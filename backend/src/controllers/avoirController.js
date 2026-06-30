const Avoir = require('../models/Avoir');
const Facture = require('../models/Facture');
const Stock = require('../models/Stock');
const MouvementStock = require('../models/MouvementStock');
const Client = require('../models/Client');
const generateNumero = require('../utils/generateNumero');
const { success, error } = require('../utils/apiResponse');


const creerAvoir = async (req, res) => {
  try {
    const { factureId, lignes, type } = req.body;

    const facture = await Facture.findById(factureId);
    if (!facture) return error(res, 'Facture introuvable.', 404);

    if (facture.statut === 'annulee') {
      return error(res, 'Impossible de créer un avoir sur une facture annulée.', 400);
    }

    // Valider lignes avoir vs facture originale
    const lignesValidées = [];
    for (const ligneAvoir of lignes) {
      const ligneFacture = facture.lignes.find(
        l => l.article.toString() === ligneAvoir.article
      );
      if (!ligneFacture) {
        return error(res, `Article ${ligneAvoir.article} absent de la facture.`, 400);
      }
      if (ligneAvoir.quantite > ligneFacture.quantite) {
        return error(
          res,
          `Quantité avoir (${ligneAvoir.quantite}) > quantité facturée (${ligneFacture.quantite}).`,
          400
        );
      }

      // Empêcher de retourner plus que ce qui n'a pas déjà été retourné
      // via des avoirs précédents (en_attente ou valide) sur cette facture
      const avoirsExistants = await Avoir.find({
        factureOrigine: factureId,
        statut: { $in: ['en_attente', 'valide', 'consomme'] }
      });
      const dejaRetourne = avoirsExistants.reduce((sum, av) => {
        const l = av.lignes.find(l => l.article.toString() === ligneAvoir.article);
        return sum + (l ? l.quantite : 0);
      }, 0);
      const disponibleRetour = ligneFacture.quantite - dejaRetourne;
      if (ligneAvoir.quantite > disponibleRetour) {
        return error(
          res,
          `Quantité déjà retournée pour cet article. Disponible au retour: ${disponibleRetour}.`,
          400
        );
      }

      lignesValidées.push({
        article: ligneAvoir.article,
        designation: ligneFacture.designation,
        quantite: ligneAvoir.quantite,
        prixUnitaire: ligneFacture.prixUnitaire,
        tva: ligneFacture.tva,
        remise: ligneFacture.remise,
        montantHT: ligneFacture.montantHT *
          (ligneAvoir.quantite / ligneFacture.quantite),
        montantTTC: ligneFacture.montantTTC *
          (ligneAvoir.quantite / ligneFacture.quantite)
      });
    }

    const totalHT = lignesValidées.reduce((s, l) => s + l.montantHT, 0);
    const totalTTC = lignesValidées.reduce((s, l) => s + l.montantTTC, 0);

    const numero = await generateNumero(Avoir, 'AVO');

    const avoir = await Avoir.create({
      numero,
      factureOrigine: factureId,
      client: facture.client,
      magasin: facture.magasin,
      lignes: lignesValidées,
      type,
      totalHT: Math.round(totalHT),
      totalTTC: Math.round(totalTTC),
      soldeRestant: Math.round(totalTTC),
      statut: 'en_attente',
      creePar: req.user._id
    });

    // Lier l'avoir à sa facture d'origine pour traçabilité
    await Facture.findByIdAndUpdate(factureId, {
      $push: { avoirs: avoir._id }
    });

    // ⚠️ Pas de mouvement de stock ni de mise à jour du solde client ici.
    // Ces effets ne doivent intervenir qu'à la validation (validerAvoir),
    // pour éviter de modifier le stock/solde sur un avoir non confirmé.

    return success(
      res,
      await avoir.populate([
        { path: 'client', select: 'nom prenom societe' },
        { path: 'magasin', select: 'nom code' },
        { path: 'factureOrigine', select: 'numero' }
      ]),
      'Avoir créé avec succès. En attente de validation.', 201
    );
  } catch (err) {
    return error(res, err.message);
  }
};


const getAvoirs = async (req, res) => {
  try {
    const { client, magasin, statut, factureOrigine, page = 1, limit = 20 } = req.query;

    const filtre = {};
    if (client) filtre.client = client;
    if (magasin) filtre.magasin = magasin;
    if (statut) filtre.statut = statut;
    if (factureOrigine) filtre.factureOrigine = factureOrigine;

    const total = await Avoir.countDocuments(filtre);
    const avoirs = await Avoir.find(filtre)
      .populate('client', 'nom prenom societe')
      .populate('magasin', 'nom code')
      .populate('factureOrigine', 'numero')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      avoirs,
      pagination: {
        total, page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return error(res, err.message);
  }
};


const getAvoir = async (req, res) => {
  try {
    const avoir = await Avoir.findById(req.params.id)
      .populate('client')
      .populate('magasin')
      .populate('factureOrigine', 'numero totalTTC')
      .populate('lignes.article', 'designation reference')
      .populate('creePar', 'nom prenom');

    if (!avoir) return error(res, 'Avoir introuvable.', 404);
    return success(res, avoir);
  } catch (err) {
    return error(res, err.message);
  }
};


/**
 * Valide un avoir en attente :
 * - Remet les articles en stock
 * - Crée les mouvements de stock correspondants
 * - Crédite le solde du client
 * C'est ICI, et uniquement ici, que ces effets de bord ont lieu.
 */
const validerAvoir = async (req, res) => {
  try {
    const avoir = await Avoir.findById(req.params.id);
    if (!avoir) return error(res, 'Avoir introuvable.', 404);

    if (avoir.statut !== 'en_attente') {
      return error(res, `Avoir déjà ${avoir.statut}, impossible de valider.`, 400);
    }

    // Remettre en stock les articles retournés
    for (const ligne of avoir.lignes) {
      let stock = await Stock.findOne({
        article: ligne.article,
        magasin: avoir.magasin
      });
      if (!stock) {
        stock = await Stock.create({
          article: ligne.article,
          magasin: avoir.magasin,
          quantite: 0
        });
      }
      const quantiteAvant = stock.quantite;
      stock.quantite += ligne.quantite;
      await stock.save();

      await MouvementStock.create({
        type: 'retour_client',
        article: ligne.article,
        magasin: avoir.magasin,
        quantite: ligne.quantite,
        quantiteAvant,
        quantiteApres: stock.quantite,
        reference: avoir.numero,
        utilisateur: req.user._id
      });
    }

    // Créditer le solde client
    await Client.findByIdAndUpdate(avoir.client, {
      $inc: { solde: -avoir.totalTTC }
    });

    avoir.statut = 'valide';
    await avoir.save();

    return success(
      res,
      await avoir.populate([
        { path: 'client', select: 'nom prenom societe' },
        { path: 'magasin', select: 'nom code' },
        { path: 'factureOrigine', select: 'numero' }
      ]),
      'Avoir validé. Stock remis et crédit accordé au client.'
    );
  } catch (err) {
    return error(res, err.message);
  }
};


/**
 * Annule un avoir.
 * - Si l'avoir était 'en_attente' : aucun effet de bord à défaire, simple changement de statut.
 * - Si l'avoir était 'valide' : on défait le stock et le solde client (effet miroir).
 * - Un avoir 'consomme' (déjà utilisé comme paiement) ne peut plus être annulé.
 */
const annulerAvoir = async (req, res) => {
  try {
    const avoir = await Avoir.findById(req.params.id);
    if (!avoir) return error(res, 'Avoir introuvable.', 404);

    if (avoir.statut === 'annule') {
      return error(res, 'Avoir déjà annulé.', 400);
    }
    if (avoir.statut === 'consomme') {
      return error(res, 'Avoir déjà consommé en paiement, annulation impossible.', 400);
    }
    if (avoir.soldeRestant < avoir.totalTTC && avoir.statut === 'valide') {
      return error(
        res,
        'Avoir partiellement consommé, annulation impossible. Contactez un administrateur.',
        400
      );
    }

    if (avoir.statut === 'valide') {
      // Retirer du stock ce qui avait été remis
      for (const ligne of avoir.lignes) {
        const stock = await Stock.findOne({
          article: ligne.article,
          magasin: avoir.magasin
        });
        if (stock) {
          const quantiteAvant = stock.quantite;
          stock.quantite -= ligne.quantite;
          await stock.save();

          await MouvementStock.create({
            type: 'sortie',
            article: ligne.article,
            magasin: avoir.magasin,
            quantite: ligne.quantite,
            quantiteAvant,
            quantiteApres: stock.quantite,
            motif: 'annulation_avoir',
            reference: `ANN-${avoir.numero}`,
            utilisateur: req.user._id
          });
        }
      }

      // Reprendre le crédit accordé au client
      await Client.findByIdAndUpdate(avoir.client, {
        $inc: { solde: avoir.totalTTC }
      });
    }

    avoir.statut = 'annule';
    avoir.soldeRestant = 0;
    await avoir.save();

    return success(res, avoir, 'Avoir annulé.');
  } catch (err) {
    return error(res, err.message);
  }
};


module.exports = {
  creerAvoir,
  getAvoirs,
  getAvoir,
  validerAvoir,
  annulerAvoir
};
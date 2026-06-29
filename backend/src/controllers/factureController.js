const Facture = require('../models/Facture');
const Stock = require('../models/Stock');
const MouvementStock = require('../models/MouvementStock');
const Client = require('../models/Client');
const Article = require('../models/Article');
const generateNumero = require('../utils/generateNumero');
const { calculerTotaux } = require('../utils/calculLignes');
const { success, error } = require('../utils/apiResponse');


const creerFacture = async (req, res) => {
  try {
    const {
      type = 'comptoir', client, magasin,
      lignes, remiseGlobale = 0, notes,
      paiementInitial
    } = req.body;

    // Enrichir et calculer lignes
    const lignesEnrichies = await Promise.all(
      lignes.map(async (ligne) => {
        const article = await Article.findById(ligne.article);
        if (!article) throw new Error(`Article ${ligne.article} introuvable.`);

        // Vérifier stock
        const stock = await Stock.findOne({
          article: ligne.article,
          magasin
        });
        const qteDisponible = stock?.quantite || 0;
        if (qteDisponible < ligne.quantite) {
          throw new Error(
            `Stock insuffisant pour "${article.designation}". 
             Disponible: ${qteDisponible}, Demandé: ${ligne.quantite}`
          );
        }

        return {
          article: ligne.article,
          designation: article.designation,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire || article.prixVente,
          tva: ligne.tva || article.tva,
          remise: ligne.remise || 0
        };
      })
    );

    const { lignes: lignesCalc, totalHT, totalTVA, totalTTC } =
      calculerTotaux(lignesEnrichies, remiseGlobale);

    // Paiement initial si comptoir
    const paiements = [];
    let montantPaye = 0;

    if (paiementInitial && paiementInitial.montant > 0) {
      paiements.push({
        date: new Date(),
        montant: paiementInitial.montant,
        mode: paiementInitial.mode || 'especes',
        reference: paiementInitial.reference
      });
      montantPaye = paiementInitial.montant;
    }

    const montantRestant = totalTTC - montantPaye;
    const statut = montantPaye >= totalTTC
      ? 'payee'
      : montantPaye > 0
        ? 'partiellement_payee'
        : 'en_attente';

    const numero = await generateNumero(Facture, 'FAC');

    const facture = await Facture.create({
      numero, type, client, magasin,
      lignes: lignesCalc,
      totalHT, totalTVA, totalTTC,
      remiseGlobale, montantPaye,
      montantRestant, paiements,
      statut, notes,
      creePar: req.user._id
    });

    // Déduire stocks + mouvements
    for (const ligne of lignesCalc) {
      const stock = await Stock.findOne({
        article: ligne.article,
        magasin
      });
      const quantiteAvant = stock.quantite;
      stock.quantite -= ligne.quantite;
      await stock.save();

      await MouvementStock.create({
        type: 'vente',
        article: ligne.article,
        magasin,
        quantite: ligne.quantite,
        quantiteAvant,
        quantiteApres: stock.quantite,
        prixUnitaire: ligne.prixUnitaire,
        reference: facture.numero,
        utilisateur: req.user._id
      });
    }

    // Mettre à jour solde client si crédit
    if (montantRestant > 0) {
      await Client.findByIdAndUpdate(client, {
        $inc: { solde: montantRestant }
      });
    }

    return success(
      res,
      await facture.populate([
        { path: 'client', select: 'nom prenom societe numeroClient' },
        { path: 'magasin', select: 'nom code' },
        { path: 'creePar', select: 'nom prenom' }
      ]),
      'Facture créée avec succès.', 201
    );
  } catch (err) {
    return error(res, err.message);
  }
};


const getFactures = async (req, res) => {
  try {
    const {
      client, magasin, type, statut,
      dateDebut, dateFin,
      page = 1, limit = 20
    } = req.query;

    const filtre = { statut: { $ne: 'annulee' } };
    if (client) filtre.client = client;
    if (magasin) filtre.magasin = magasin;
    if (type) filtre.type = type;
    if (statut) filtre.statut = statut;
    if (dateDebut || dateFin) {
      filtre.createdAt = {};
      if (dateDebut) filtre.createdAt.$gte = new Date(dateDebut);
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59);
        filtre.createdAt.$lte = fin;
      }
    }

    const total = await Facture.countDocuments(filtre);
    const factures = await Facture.find(filtre)
      .populate('client', 'nom prenom societe numeroClient')
      .populate('magasin', 'nom code')
      .populate('creePar', 'nom prenom')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Totaux globaux
    const totaux = await Facture.aggregate([
      { $match: filtre },
      {
        $group: {
          _id: null,
          totalTTC: { $sum: '$totalTTC' },
          totalPaye: { $sum: '$montantPaye' },
          totalRestant: { $sum: '$montantRestant' }
        }
      }
    ]);

    return success(res, {
      factures,
      totaux: totaux[0] || { totalTTC: 0, totalPaye: 0, totalRestant: 0 },
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


const getFacture = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('client')
      .populate('magasin')
      .populate('lignes.article', 'designation reference')
      .populate('creePar', 'nom prenom')
      .populate('devisOrigine', 'numero');

    if (!facture) return error(res, 'Facture introuvable.', 404);
    return success(res, facture);
  } catch (err) {
    return error(res, err.message);
  }
};


const enregistrerPaiement = async (req, res) => {
  try {
    const { montant, mode, reference } = req.body;

    const facture = await Facture.findById(req.params.id);
    if (!facture) return error(res, 'Facture introuvable.', 404);

    if (facture.statut === 'payee') {
      return error(res, 'Facture déjà entièrement payée.', 400);
    }
    if (facture.statut === 'annulee') {
      return error(res, 'Facture annulée.', 400);
    }
    if (montant > facture.montantRestant) {
      return error(
        res,
        `Montant supérieur au restant dû (${facture.montantRestant}).`,
        400
      );
    }

    facture.paiements.push({
      date: new Date(),
      montant, mode, reference
    });

    facture.montantPaye += montant;
    facture.montantRestant -= montant;

    facture.statut = facture.montantRestant <= 0
      ? 'payee'
      : 'partiellement_payee';

    await facture.save();

    // Mettre à jour solde client
    await Client.findByIdAndUpdate(facture.client, {
      $inc: { solde: -montant }
    });

    return success(res, facture, 'Paiement enregistré.');
  } catch (err) {
    return error(res, err.message);
  }
};


const annulerFacture = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id);
    if (!facture) return error(res, 'Facture introuvable.', 404);

    if (facture.statut === 'annulee') {
      return error(res, 'Facture déjà annulée.', 400);
    }

    // Remettre les stocks
    for (const ligne of facture.lignes) {
      const stock = await Stock.findOne({
        article: ligne.article,
        magasin: facture.magasin
      });
      if (stock) {
        const quantiteAvant = stock.quantite;
        stock.quantite += ligne.quantite;
        await stock.save();

        await MouvementStock.create({
          type: 'retour_client',
          article: ligne.article,
          magasin: facture.magasin,
          quantite: ligne.quantite,
          quantiteAvant,
          quantiteApres: stock.quantite,
          motif: 'correction_erreur',
          reference: `ANN-${facture.numero}`,
          utilisateur: req.user._id
        });
      }
    }

    // Remettre solde client
    if (facture.montantRestant > 0) {
      await Client.findByIdAndUpdate(facture.client, {
        $inc: { solde: -facture.montantRestant }
      });
    }

    facture.statut = 'annulee';
    await facture.save();

    return success(res, facture, 'Facture annulée. Stocks remis.');
  } catch (err) {
    return error(res, err.message);
  }
};


const getFacturesImpayees = async (req, res) => {
  try {
    const { magasin } = req.query;
    const filtre = {
      statut: { $in: ['en_attente', 'partiellement_payee'] }
    };
    if (magasin) filtre.magasin = magasin;

    const factures = await Facture.find(filtre)
      .populate('client', 'nom prenom societe telephone')
      .populate('magasin', 'nom code')
      .sort({ createdAt: 1 }); // Plus anciennes en premier

    const totalImpaye = factures.reduce(
      (s, f) => s + f.montantRestant, 0
    );

    return success(res, { factures, totalImpaye });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  creerFacture, getFactures, getFacture,
  enregistrerPaiement, annulerFacture,
  getFacturesImpayees
};
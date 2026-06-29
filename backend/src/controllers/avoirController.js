const Avoir = require('../models/Avoir');
const Facture = require('../models/Facture');
const Stock = require('../models/Stock');
const MouvementStock = require('../models/MouvementStock');
const Client = require('../models/Client');
const generateNumero = require('../utils/generateNumero');
const { calculerTotaux } = require('../utils/calculLignes');
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
      creePar: req.user._id
    });

    // Remettre en stock les articles retournés
    for (const ligne of lignesValidées) {
      let stock = await Stock.findOne({
        article: ligne.article,
        magasin: facture.magasin
      });
      if (!stock) {
        stock = await Stock.create({
          article: ligne.article,
          magasin: facture.magasin,
          quantite: 0
        });
      }
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
        reference: avoir.numero,
        utilisateur: req.user._id
      });
    }

    // Mettre à jour solde client
    await Client.findByIdAndUpdate(facture.client, {
      $inc: { solde: -totalTTC }
    });

    return success(
      res,
      await avoir.populate([
        { path: 'client', select: 'nom prenom societe' },
        { path: 'magasin', select: 'nom code' },
        { path: 'factureOrigine', select: 'numero' }
      ]),
      'Avoir créé avec succès.', 201
    );
  } catch (err) {
    return error(res, err.message);
  }
};


const getAvoirs = async (req, res) => {
  try {
    const { client, magasin, page = 1, limit = 20 } = req.query;

    const filtre = {};
    if (client) filtre.client = client;
    if (magasin) filtre.magasin = magasin;

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

const validerAvoir = async (req, res) => {
  try {
    const avoir = await Avoir.findByIdAndUpdate(
      req.params.id,
      { statut: 'valide' },
      { new: true }
    );
    if (!avoir) return error(res, 'Avoir introuvable.', 404);
    return success(res, avoir, 'Avoir validé.');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { creerAvoir, getAvoirs, getAvoir, validerAvoir };
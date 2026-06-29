const Devis = require('../models/Devis');
const Article = require('../models/Article');
const Stock = require('../models/Stock');
const generateNumero = require('../utils/generateNumero');
const { calculerTotaux } = require('../utils/calculLignes');
const { success, error } = require('../utils/apiResponse');

const creerDevis = async (req, res) => {
  try {
    const {
      client, magasin, lignes,
      remiseGlobale = 0,
      dateValidite, notes
    } = req.body;

    // Enrichir les lignes
    const lignesEnrichies = await Promise.all(
      lignes.map(async (ligne) => {
        const article = await Article.findById(ligne.article);
        if (!article) throw new Error(`Article ${ligne.article} introuvable.`);
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

    const numero = await generateNumero(Devis, 'DEV');

    const devis = await Devis.create({
      numero, client, magasin,
      lignes: lignesCalc,
      totalHT, totalTVA, totalTTC,
      remiseGlobale, dateValidite,
      notes, creePar: req.user._id
    });

    return success(
      res,
      await devis.populate([
        { path: 'client', select: 'nom prenom societe numeroClient' },
        { path: 'magasin', select: 'nom code' },
        { path: 'lignes.article', select: 'designation reference' },
        { path: 'creePar', select: 'nom prenom' }
      ]),
      'Devis créé avec succès.', 201
    );
  } catch (err) {
    return error(res, err.message);
  }
};


const getDevisList = async (req, res) => {
  try {
    const {
      client, magasin, statut,
      dateDebut, dateFin,
      page = 1, limit = 20
    } = req.query;

    const filtre = {};
    if (client) filtre.client = client;
    if (magasin) filtre.magasin = magasin;
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

    const total = await Devis.countDocuments(filtre);
    const devis = await Devis.find(filtre)
      .populate('client', 'nom prenom societe numeroClient')
      .populate('magasin', 'nom code')
      .populate('creePar', 'nom prenom')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      devis,
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


const getDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('client')
      .populate('magasin')
      .populate('lignes.article', 'designation reference prixVente')
      .populate('creePar', 'nom prenom');

    if (!devis) return error(res, 'Devis introuvable.', 404);
    return success(res, devis);
  } catch (err) {
    return error(res, err.message);
  }
};


const modifierDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id);
    if (!devis) return error(res, 'Devis introuvable.', 404);

    if (devis.statut !== 'brouillon') {
      return error(res, 'Seul un devis brouillon peut être modifié.', 400);
    }

    const { lignes, remiseGlobale = 0, dateValidite, notes } = req.body;

    if (lignes) {
      const lignesEnrichies = await Promise.all(
        lignes.map(async (ligne) => {
          const article = await Article.findById(ligne.article);
          return {
            article: ligne.article,
            designation: article?.designation || ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire || article?.prixVente,
            tva: ligne.tva || article?.tva || 20,
            remise: ligne.remise || 0
          };
        })
      );

      const { lignes: lignesCalc, totalHT, totalTVA, totalTTC } =
        calculerTotaux(lignesEnrichies, remiseGlobale);

      devis.lignes = lignesCalc;
      devis.totalHT = totalHT;
      devis.totalTVA = totalTVA;
      devis.totalTTC = totalTTC;
      devis.remiseGlobale = remiseGlobale;
    }

    if (dateValidite) devis.dateValidite = dateValidite;
    if (notes !== undefined) devis.notes = notes;

    await devis.save();
    return success(res, devis, 'Devis modifié.');
  } catch (err) {
    return error(res, err.message);
  }
};


const changerStatutDevis = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['brouillon', 'envoye', 'accepte', 'refuse'];

    if (!statutsValides.includes(statut)) {
      return error(res, 'Statut invalide.', 400);
    }

    const devis = await Devis.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true }
    );

    if (!devis) return error(res, 'Devis introuvable.', 404);
    return success(res, devis, `Devis ${statut}.`);
  } catch (err) {
    return error(res, err.message);
  }
};


const convertirEnFacture = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('lignes.article');

    if (!devis) return error(res, 'Devis introuvable.', 404);

    if (!['accepte', 'envoye'].includes(devis.statut)) {
      return error(res, 'Le devis doit être accepté ou envoyé.', 400);
    }

    // Vérifier stocks disponibles
    for (const ligne of devis.lignes) {
      const stock = await Stock.findOne({
        article: ligne.article._id,
        magasin: devis.magasin
      });
      if (!stock || stock.quantite < ligne.quantite) {
        return error(
          res,
          `Stock insuffisant pour ${ligne.designation}. 
           Disponible: ${stock?.quantite || 0}`,
          400
        );
      }
    }

    // Créer la facture
    const Facture = require('../models/Facture');
    const numeroFacture = await generateNumero(Facture, 'FAC');

    const facture = await Facture.create({
      numero: numeroFacture,
      type: req.body.type || 'comptoir',
      client: devis.client,
      magasin: devis.magasin,
      lignes: devis.lignes,
      totalHT: devis.totalHT,
      totalTVA: devis.totalTVA,
      totalTTC: devis.totalTTC,
      remiseGlobale: devis.remiseGlobale,
      montantPaye: 0,
      montantRestant: devis.totalTTC,
      devisOrigine: devis._id,
      notes: devis.notes,
      creePar: req.user._id
    });

    // Mettre à jour statut devis
    devis.statut = 'accepte';
    await devis.save();

    return success(
      res,
      await facture.populate([
        { path: 'client', select: 'nom prenom societe' },
        { path: 'magasin', select: 'nom code' }
      ]),
      'Devis converti en facture avec succès.'
    );
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  creerDevis, getDevisList, getDevis,
  modifierDevis, changerStatutDevis, convertirEnFacture
};
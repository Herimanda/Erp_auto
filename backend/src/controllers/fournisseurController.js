const Fournisseur = require('../models/Fournisseur');
const CommandeFournisseur = require('../models/CommandeFournisseur');
const Stock = require('../models/Stock');
const MouvementStock = require('../models/MouvementStock');
const Article = require('../models/Article');
const generateNumero = require('../utils/generateNumero');
const { success, error } = require('../utils/apiResponse');

// @desc    Créer un fournisseur
// @route   POST /api/fournisseurs
const creerFournisseur = async (req, res) => {
  try {
    const {
      reference, raisonSociale, contact,
      telephone, email, adresse, nif
    } = req.body;

    const existant = await Fournisseur.findOne({
      reference: reference.toUpperCase()
    });
    if (existant) return error(res, 'Cette référence existe déjà.', 400);

    const fournisseur = await Fournisseur.create({
      reference, raisonSociale, contact,
      telephone, email, adresse, nif
    });

    return success(res, fournisseur, 'Fournisseur créé avec succès.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Liste des fournisseurs
// @route   GET /api/fournisseurs
const getFournisseurs = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const filtre = { isActive: true };
    if (search) {
      filtre.$or = [
        { raisonSociale: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Fournisseur.countDocuments(filtre);
    const fournisseurs = await Fournisseur.find(filtre)
      .sort({ raisonSociale: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      fournisseurs,
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

// @desc    Détail fournisseur
// @route   GET /api/fournisseurs/:id
const getFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) return error(res, 'Fournisseur introuvable.', 404);
    return success(res, fournisseur);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Modifier un fournisseur
// @route   PUT /api/fournisseurs/:id
const modifierFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndUpdate(
      req.params.id, req.body,
      { new: true, runValidators: true }
    );
    if (!fournisseur) return error(res, 'Fournisseur introuvable.', 404);
    return success(res, fournisseur, 'Fournisseur modifié.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Supprimer un fournisseur
// @route   DELETE /api/fournisseurs/:id
const supprimerFournisseur = async (req, res) => {
  try {
    const commandesActives = await CommandeFournisseur.countDocuments({
      fournisseur: req.params.id,
      statut: { $in: ['brouillon', 'validee', 'en_cours'] }
    });

    if (commandesActives > 0) {
      return error(
        res,
        `Impossible : ${commandesActives} commande(s) active(s).`,
        400
      );
    }

    await Fournisseur.findByIdAndUpdate(req.params.id, { isActive: false });
    return success(res, null, 'Fournisseur supprimé.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Historique fournisseur
// @route   GET /api/fournisseurs/:id/historique
const getHistoriqueFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id);
    if (!fournisseur) return error(res, 'Fournisseur introuvable.', 404);

    const commandes = await CommandeFournisseur.find({
      fournisseur: req.params.id
    })
      .populate('magasin', 'nom code')
      .populate('lignes.article', 'designation reference')
      .populate('creePar', 'nom prenom')
      .sort({ createdAt: -1 });

    const stats = {
      totalCommandes: commandes.length,
      totalAchats: commandes.reduce((s, c) => s + c.totalHT, 0),
      commandesEnCours: commandes.filter(
        c => ['brouillon', 'validee', 'en_cours'].includes(c.statut)
      ).length,
      derniereCommande: commandes[0]?.createdAt || null
    };

    return success(res, { fournisseur, stats, commandes });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  creerFournisseur, getFournisseurs, getFournisseur,
  modifierFournisseur, supprimerFournisseur,
  getHistoriqueFournisseur
};
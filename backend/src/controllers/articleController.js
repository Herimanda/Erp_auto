const Article = require('../models/Article');
const Stock = require('../models/Stock');
const Magasin = require('../models/Magasin');
const { success, error } = require('../utils/apiResponse');
const fs = require('fs');
const path = require('path');

// @desc    Créer un article
// @route   POST /api/articles
const creerArticle = async (req, res) => {
  try {
    const {
      reference, codeBarres, designation, description,
      marque, modeleCompatible, categorie,
      prixAchat, prixVente, tva, stockMinimum
    } = req.body;

    // Vérifier unicité référence
    const existant = await Article.findOne({
      reference: reference.toUpperCase(),
      isDeleted: false
    });
    if (existant) return error(res, 'Cette référence existe déjà.', 400);

    // Vérifier unicité code-barres si fourni
    if (codeBarres) {
      const cbExistant = await Article.findOne({ codeBarres, isDeleted: false });
      if (cbExistant) return error(res, 'Ce code-barres existe déjà.', 400);
    }

    const articleData = {
      reference, codeBarres, designation, description,
      marque, categorie, prixAchat, prixVente, tva, stockMinimum,
      modeleCompatible: modeleCompatible
        ? JSON.parse(modeleCompatible)
        : []
    };

    // Image uploadée
    if (req.file) {
      articleData.image = `uploads/articles/${req.file.filename}`;
    }

    const article = await Article.create(articleData);

    // Créer un stock à 0 pour chaque magasin existant
    const magasins = await Magasin.find({ isActive: true });
    const stocksInitiaux = magasins.map(mag => ({
      article: article._id,
      magasin: mag._id,
      quantite: 0
    }));
    await Stock.insertMany(stocksInitiaux);

    return success(
      res,
      await article.populate('categorie'),
      'Article créé avec succès.',
      201
    );
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Liste des articles avec filtres & pagination
// @route   GET /api/articles
const getArticles = async (req, res) => {
  try {
    const {
      search, categorie, marque,
      isActive, page = 1, limit = 20,
      sortBy = 'designation', order = 'asc'
    } = req.query;

    const filtre = { isDeleted: false };

    // Recherche texte
    if (search) {
      filtre.$or = [
        { designation: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { marque: { $regex: search, $options: 'i' } },
        { codeBarres: { $regex: search, $options: 'i' } }
      ];
    }

    if (categorie) filtre.categorie = categorie;
    if (marque) filtre.marque = { $regex: marque, $options: 'i' };
    if (isActive !== undefined) filtre.isActive = isActive === 'true';

    const total = await Article.countDocuments(filtre);
    const articles = await Article.find(filtre)
      .populate('categorie', 'nom code')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      articles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Détail d'un article avec stocks par magasin
// @route   GET /api/articles/:id
const getArticle = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      isDeleted: false
    }).populate('categorie');

    if (!article) return error(res, 'Article introuvable.', 404);

    // Stocks par magasin
    const stocks = await Stock.find({ article: article._id })
      .populate('magasin', 'nom code');

    const stockTotal = stocks.reduce((sum, s) => sum + s.quantite, 0);

    return success(res, {
      ...article.toObject(),
      stocks,
      stockTotal
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Recherche par code-barres
// @route   GET /api/articles/barcode/:code
const getArticleByBarcode = async (req, res) => {
  try {
    const article = await Article.findOne({
      codeBarres: req.params.code,
      isDeleted: false
    }).populate('categorie');

    if (!article) return error(res, 'Article introuvable.', 404);
    return success(res, article);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Modifier un article
// @route   PUT /api/articles/:id
const modifierArticle = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      isDeleted: false
    });
    if (!article) return error(res, 'Article introuvable.', 404);

    const {
      reference, codeBarres, designation, description,
      marque, modeleCompatible, categorie,
      prixAchat, prixVente, tva, stockMinimum, isActive
    } = req.body;

    // Vérifier unicité référence (hors article actuel)
    if (reference && reference.toUpperCase() !== article.reference) {
      const existant = await Article.findOne({
        reference: reference.toUpperCase(),
        isDeleted: false,
        _id: { $ne: req.params.id }
      });
      if (existant) return error(res, 'Cette référence existe déjà.', 400);
    }

    // Supprimer ancienne image si nouvelle uploadée
    if (req.file && article.image) {
      const oldPath = path.join(__dirname, '../../', article.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updateData = {
      reference, codeBarres, designation, description,
      marque, categorie, prixAchat, prixVente,
      tva, stockMinimum, isActive,
      modeleCompatible: modeleCompatible
        ? JSON.parse(modeleCompatible)
        : article.modeleCompatible
    };

    if (req.file) {
      updateData.image = `uploads/articles/${req.file.filename}`;
    }

    // Nettoyer les champs undefined
    Object.keys(updateData).forEach(
      k => updateData[k] === undefined && delete updateData[k]
    );

    const articleMaj = await Article.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categorie');

    return success(res, articleMaj, 'Article modifié avec succès.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Supprimer un article (logique)
// @route   DELETE /api/articles/:id
const supprimerArticle = async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    );
    if (!article) return error(res, 'Article introuvable.', 404);
    return success(res, null, 'Article supprimé.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Articles en stock faible
// @route   GET /api/articles/alertes/stock-faible
const getArticlesStockFaible = async (req, res) => {
  try {
    const { magasin } = req.query;

    const filtre = { isDeleted: false, isActive: true };
    const articles = await Article.find(filtre).populate('categorie');

    const alertes = [];

    for (const article of articles) {
      const stockFiltre = { article: article._id };
      if (magasin) stockFiltre.magasin = magasin;

      const stocks = await Stock.find(stockFiltre).populate('magasin', 'nom code');
      const stockTotal = stocks.reduce((sum, s) => sum + s.quantite, 0);

      if (stockTotal <= article.stockMinimum) {
        alertes.push({
          ...article.toObject(),
          stocks,
          stockTotal,
          deficit: article.stockMinimum - stockTotal
        });
      }
    }

    return success(res, alertes);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Marques disponibles
// @route   GET /api/articles/meta/marques
const getMarques = async (req, res) => {
  try {
    const marques = await Article.distinct('marque', {
      isDeleted: false,
      marque: { $ne: null, $ne: '' }
    });
    return success(res, marques.sort());
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  creerArticle, getArticles, getArticle,
  getArticleByBarcode, modifierArticle, supprimerArticle,
  getArticlesStockFaible, getMarques
};
const Stock = require('../models/Stock');
const Article = require('../models/Article');
const MouvementStock = require('../models/MouvementStock');
const Magasin = require('../models/Magasin');
const { success, error } = require('../utils/apiResponse');

// @desc    Stock d'un article par magasin
// @route   GET /api/stocks/article/:articleId
const getStockParArticle = async (req, res) => {
  try {
    const stocks = await Stock.find({ article: req.params.articleId })
      .populate('magasin', 'nom code')
      .populate('article', 'designation reference stockMinimum');

    const stockTotal = stocks.reduce((sum, s) => sum + s.quantite, 0);

    return success(res, { stocks, stockTotal });
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Stock d'un magasin (tous les articles)
// @route   GET /api/stocks/magasin/:magasinId
const getStockParMagasin = async (req, res) => {
  try {
    const {
      search, categorie,
      stockFaible, page = 1, limit = 20
    } = req.query;

    // Articles filtrés
    const filtreArticle = { isDeleted: false };
    if (search) {
      filtreArticle.$or = [
        { designation: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }
    if (categorie) filtreArticle.categorie = categorie;

    const articles = await Article.find(filtreArticle)
      .populate('categorie', 'nom');

    // Récupérer les stocks pour ce magasin
    let stocksData = await Promise.all(
      articles.map(async (art) => {
        const stock = await Stock.findOne({
          article: art._id,
          magasin: req.params.magasinId
        });
        return {
          article: art,
          quantite: stock ? stock.quantite : 0,
          stockId: stock ? stock._id : null,
          enAlerte: stock
            ? stock.quantite <= art.stockMinimum
            : true
        };
      })
    );

    // Filtrer stock faible
    if (stockFaible === 'true') {
      stocksData = stocksData.filter(s => s.enAlerte);
    }

    const total = stocksData.length;
    const paginated = stocksData.slice(
      (page - 1) * limit,
      page * limit
    );

    // Valeur totale du stock
    const valeurTotale = stocksData.reduce((sum, s) => {
      return sum + (s.quantite * s.article.prixAchat);
    }, 0);

    return success(res, {
      stocks: paginated,
      valeurTotale,
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

// @desc    Vue globale tous magasins
// @route   GET /api/stocks/global
const getStockGlobal = async (req, res) => {
  try {
    const magasins = await Magasin.find({ isActive: true });
    const articles = await Article.find({ isDeleted: false })
      .populate('categorie', 'nom');

    const vue = await Promise.all(
      articles.map(async (art) => {
        const stocks = await Stock.find({ article: art._id })
          .populate('magasin', 'nom code');

        const parMagasin = {};
        magasins.forEach(mag => {
          const s = stocks.find(
            st => st.magasin._id.toString() === mag._id.toString()
          );
          parMagasin[mag.code] = s ? s.quantite : 0;
        });

        const stockTotal = stocks.reduce((sum, s) => sum + s.quantite, 0);

        return {
          article: {
            _id: art._id,
            reference: art.reference,
            designation: art.designation,
            marque: art.marque,
            categorie: art.categorie,
            prixAchat: art.prixAchat,
            stockMinimum: art.stockMinimum
          },
          parMagasin,
          stockTotal,
          valeurTotale: stockTotal * art.prixAchat,
          enAlerte: stockTotal <= art.stockMinimum
        };
      })
    );

    // Résumé global
    const resume = {
      totalArticles: vue.length,
      articlesEnAlerte: vue.filter(v => v.enAlerte).length,
      articlesRupture: vue.filter(v => v.stockTotal === 0).length,
      valeurTotaleStock: vue.reduce((sum, v) => sum + v.valeurTotale, 0)
    };

    return success(res, { stocks: vue, resume, magasins });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getStockParArticle, getStockParMagasin, getStockGlobal };
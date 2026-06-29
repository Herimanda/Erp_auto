const Stock = require('../models/Stock');
const Article = require('../models/Article');
const MouvementStock = require('../models/MouvementStock');
const { success, error } = require('../utils/apiResponse');


const genererFeuille = async (req, res) => {
  try {
    const { categorie } = req.query;

    const filtreArticle = { isDeleted: false, isActive: true };
    if (categorie) filtreArticle.categorie = categorie;

    const articles = await Article.find(filtreArticle)
      .populate('categorie', 'nom');

    const feuille = await Promise.all(
      articles.map(async (art) => {
        const stock = await Stock.findOne({
          article: art._id,
          magasin: req.params.magasinId
        });
        return {
          article: {
            _id: art._id,
            reference: art.reference,
            designation: art.designation,
            marque: art.marque,
            categorie: art.categorie
          },
          stockTheorique: stock ? stock.quantite : 0,
          stockPhysique: null, // à saisir
          ecart: null
        };
      })
    );

    return success(res, {
      magasin: req.params.magasinId,
      date: new Date(),
      nombreArticles: feuille.length,
      lignes: feuille
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Valider un inventaire (appliquer les écarts)
// @route   POST /api/inventaire/:magasinId/valider
const validerInventaire = async (req, res) => {
  try {
    const { lignes } = req.body;
    // lignes : [{ articleId, stockPhysique }]

    const resultats = [];
    let nbEcarts = 0;

    for (const ligne of lignes) {
      const stock = await Stock.findOne({
        article: ligne.articleId,
        magasin: req.params.magasinId
      });

      if (!stock) continue;

      const stockTheorique = stock.quantite;
      const stockPhysique = ligne.stockPhysique;
      const ecart = stockPhysique - stockTheorique;

      if (ecart !== 0) {
        nbEcarts++;
        const type = ecart > 0
          ? 'ajustement_positif'
          : 'ajustement_negatif';

        stock.quantite = stockPhysique;
        await stock.save();

        await MouvementStock.create({
          type,
          article: ligne.articleId,
          magasin: req.params.magasinId,
          quantite: Math.abs(ecart),
          quantiteAvant: stockTheorique,
          quantiteApres: stockPhysique,
          motif: 'correction_erreur',
          reference: `INV-${Date.now()}`,
          utilisateur: req.user._id
        });
      }

      resultats.push({
        articleId: ligne.articleId,
        stockTheorique,
        stockPhysique,
        ecart,
        ajuste: ecart !== 0
      });
    }

    return success(res, {
      resultats,
      resume: {
        totalLignes: lignes.length,
        nbEcarts,
        nbSansEcart: lignes.length - nbEcarts
      }
    }, `Inventaire validé. ${nbEcarts} écart(s) corrigé(s).`);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { genererFeuille, validerInventaire };
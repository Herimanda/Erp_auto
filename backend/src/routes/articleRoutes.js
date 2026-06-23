const express = require('express');
const router = express.Router();
const {
  creerArticle, getArticles, getArticle,
  getArticleByBarcode, modifierArticle, supprimerArticle,
  getArticlesStockFaible, getMarques
} = require('../controllers/articleController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../config/multer');

router.use(protect);

// Routes spéciales (avant /:id)
router.get('/alertes/stock-faible', getArticlesStockFaible);
router.get('/meta/marques', getMarques);
router.get('/barcode/:code', getArticleByBarcode);

// CRUD principal
router.route('/')
  .get(getArticles)
  .post(
    authorize('administrateur', 'gestionnaire'),
    upload.single('image'),
    creerArticle
  );

router.route('/:id')
  .get(getArticle)
  .put(
    authorize('administrateur', 'gestionnaire'),
    upload.single('image'),
    modifierArticle
  )
  .delete(authorize('administrateur'), supprimerArticle);

module.exports = router;
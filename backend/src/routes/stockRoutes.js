const express = require('express');
const router = express.Router();
const {
  getStockParArticle,
  getStockParMagasin,
  getStockGlobal
} = require('../controllers/stockController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/global', getStockGlobal);
router.get('/article/:articleId', getStockParArticle);
router.get('/magasin/:magasinId', getStockParMagasin);

module.exports = router;
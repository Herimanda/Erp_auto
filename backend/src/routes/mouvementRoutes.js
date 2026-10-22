const express = require('express');
const router = express.Router();
const {
  entreeStock, sortieStock,
  ajustementStock, getHistorique
} = require('../controllers/mouvementController');
const { protect, authorize } = require('../middlewares/auth');
const { exigerMagasin } = require('../middlewares/../utils/magasinScope');

router.use(protect);

router.get('/', getHistorique);
router.post(
  '/entree',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  exigerMagasin(['body', 'magasinId']),
  entreeStock
);
router.post(
  '/sortie',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  exigerMagasin(['body', 'magasinId']),
  sortieStock
);
router.post(
  '/ajustement',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  exigerMagasin(['body', 'magasinId']),
  ajustementStock
);

module.exports = router;
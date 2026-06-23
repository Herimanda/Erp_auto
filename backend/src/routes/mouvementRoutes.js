const express = require('express');
const router = express.Router();
const {
  entreeStock, sortieStock,
  ajustementStock, getHistorique
} = require('../controllers/mouvementController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/', getHistorique);
router.post(
  '/entree',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  entreeStock
);
router.post(
  '/sortie',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  sortieStock
);
router.post(
  '/ajustement',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  ajustementStock
);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  genererFeuille,
  validerInventaire
} = require('../controllers/inventaireController');
const { protect, authorize } = require('../middlewares/auth');
const { exigerMagasin } = require('../utils/magasinScope');

router.use(protect);

router.get(
  '/:magasinId',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  exigerMagasin(['params', 'magasinId']), 
  genererFeuille
);
router.post(
  '/:magasinId/valider',
  authorize('administrateur', 'gestionnaire'),
  exigerMagasin(['params', 'magasinId']),
  validerInventaire
);

module.exports = router;
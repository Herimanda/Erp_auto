const express = require('express');
const router = express.Router();
const {
  genererFeuille,
  validerInventaire
} = require('../controllers/inventaireController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get(
  '/:magasinId',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  genererFeuille
);
router.post(
  '/:magasinId/valider',
  authorize('administrateur', 'gestionnaire'),
  validerInventaire
);

module.exports = router;
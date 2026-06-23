const express = require('express');
const router = express.Router();
const {
  creerDevis, getDevisList, getDevis,
  modifierDevis, changerStatutDevis, convertirEnFacture
} = require('../controllers/devisController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getDevisList)
  .post(authorize('administrateur', 'gestionnaire', 'caissier'), creerDevis);

router.route('/:id')
  .get(getDevis)
  .put(authorize('administrateur', 'gestionnaire', 'caissier'), modifierDevis);

router.put(
  '/:id/statut',
  authorize('administrateur', 'gestionnaire'),
  changerStatutDevis
);
router.post(
  '/:id/convertir',
  authorize('administrateur', 'gestionnaire', 'caissier'),
  convertirEnFacture
);

module.exports = router;
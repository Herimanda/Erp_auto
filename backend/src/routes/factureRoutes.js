const express = require('express');
const router = express.Router();
const {
  creerFacture, getFactures, getFacture,
  enregistrerPaiement, annulerFacture,
  getFacturesImpayees
} = require('../controllers/factureController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// Alertes
router.get('/alertes/impayes', getFacturesImpayees);

router.route('/')
  .get(getFactures)
  .post(
    authorize('administrateur', 'gestionnaire', 'caissier'),
    creerFacture
  );

router.route('/:id').get(getFacture);

router.post(
  '/:id/paiement',
  authorize('administrateur', 'gestionnaire', 'caissier'),
  enregistrerPaiement
);
router.put(
  '/:id/annuler',
  authorize('administrateur', 'gestionnaire'),
  annulerFacture
);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  creerCommande, validerCommande,
  receptionnerCommande, annulerCommande,
  modifierCommande, getCommandes, getCommande
} = require('../controllers/commandeFournisseurController');
const { protect, authorize } = require('../middlewares/auth');
const { exigerMagasin } = require('../utils/magasinScope');

router.use(protect);

router.route('/')
  .get(getCommandes)
  .post(
    authorize('administrateur', 'gestionnaire'),
    exigerMagasin(['body', 'magasinId']),
    creerCommande
  );

router.route('/:id')
  .get(getCommande)
  .put(
    authorize('administrateur', 'gestionnaire'),
    modifierCommande
  );

router.put(
  '/:id/valider',
  authorize('administrateur', 'gestionnaire'),
  validerCommande
);
router.put(
  '/:id/receptionner',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  receptionnerCommande
);
router.put(
  '/:id/annuler',
  authorize('administrateur', 'gestionnaire'),
  annulerCommande
);

module.exports = router;
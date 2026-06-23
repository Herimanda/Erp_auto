const express = require('express');
const router = express.Router();
const {
  creerFournisseur, getFournisseurs, getFournisseur,
  modifierFournisseur, supprimerFournisseur,
  getHistoriqueFournisseur
} = require('../controllers/fournisseurController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getFournisseurs)
  .post(
    authorize('administrateur', 'gestionnaire'),
    creerFournisseur
  );

router.route('/:id')
  .get(getFournisseur)
  .put(authorize('administrateur', 'gestionnaire'), modifierFournisseur)
  .delete(authorize('administrateur'), supprimerFournisseur);

router.get('/:id/historique', getHistoriqueFournisseur);

module.exports = router;
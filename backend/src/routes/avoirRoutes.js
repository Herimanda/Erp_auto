const express = require('express');
const router = express.Router();
const {
  creerAvoir, getAvoirs,
  getAvoir, validerAvoir
} = require('../controllers/avoirController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getAvoirs)
  .post(
    authorize('administrateur', 'gestionnaire', 'caissier'),
    creerAvoir
  );

router.route('/:id').get(getAvoir);

router.put(
  '/:id/valider',
  authorize('administrateur', 'gestionnaire'),
  validerAvoir
);

module.exports = router;
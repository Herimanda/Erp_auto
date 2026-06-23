const express = require('express');
const router = express.Router();
const {
  creerMagasin, getMagasins,
  getMagasin, modifierMagasin
} = require('../controllers/magasinController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getMagasins)
  .post(authorize('administrateur'), creerMagasin);

router.route('/:id')
  .get(getMagasin)
  .put(authorize('administrateur'), modifierMagasin);

module.exports = router;
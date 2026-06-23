const express = require('express');
const router = express.Router();
const {
  creerCategorie, getCategories, getCategorie,
  modifierCategorie, supprimerCategorie
} = require('../controllers/categorieController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getCategories)
  .post(authorize('administrateur', 'gestionnaire'), creerCategorie);

router.route('/:id')
  .get(getCategorie)
  .put(authorize('administrateur', 'gestionnaire'), modifierCategorie)
  .delete(authorize('administrateur'), supprimerCategorie);

module.exports = router;
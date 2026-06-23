const express = require('express');
const router = express.Router();
const {
  creerUser, getUsers, getUser,
  modifierUser, supprimerUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

// Toutes les routes nécessitent d'être connecté + admin
router.use(protect, authorize('administrateur'));

router.route('/')
  .get(getUsers)
  .post(creerUser);

router.route('/:id')
  .get(getUser)
  .put(modifierUser)
  .delete(supprimerUser);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  creerClient, getClients, getClient,
  modifierClient, supprimerClient,
  getHistoriqueClient, getTopClients
} = require('../controllers/clientController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// Routes spéciales
router.get('/stats/top', getTopClients);

// CRUD
router.route('/')
  .get(getClients)
  .post(
    authorize('administrateur', 'gestionnaire', 'caissier'),
    creerClient
  );

router.route('/:id')
  .get(getClient)
  .put(
    authorize('administrateur', 'gestionnaire', 'caissier'),
    modifierClient
  )
  .delete(authorize('administrateur', 'gestionnaire'), supprimerClient);

router.get('/:id/historique', getHistoriqueClient);

module.exports = router;
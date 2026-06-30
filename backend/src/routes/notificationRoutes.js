const express = require('express');
const router = express.Router();
const {
  getNotifications, getCompteur, marquerLue,
  toutMarquerLu, supprimerNotification, viderLues
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/',           getNotifications);
router.get('/compteur',   getCompteur);
router.put('/tout-lire',  toutMarquerLu);
router.put('/:id/lu',     marquerLue);
router.delete('/lues',    viderLues);
router.delete('/:id',     supprimerNotification);

module.exports = router;
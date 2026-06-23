const express = require('express');
const router = express.Router();
const {
  creerTransfert, validerTransfert, expedierTransfert,
  receptionnerTransfert, annulerTransfert, getTransferts
} = require('../controllers/transfertController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getTransferts)
  .post(
    authorize('administrateur', 'gestionnaire', 'magasinier'),
    creerTransfert
  );

router.put(
  '/:id/valider',
  authorize('administrateur', 'gestionnaire'),
  validerTransfert
);
router.put(
  '/:id/expedier',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  expedierTransfert
);
router.put(
  '/:id/receptionner',
  authorize('administrateur', 'gestionnaire', 'magasinier'),
  receptionnerTransfert
);
router.put(
  '/:id/annuler',
  authorize('administrateur', 'gestionnaire'),
  annulerTransfert
);

module.exports = router;
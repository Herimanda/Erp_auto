const express = require('express');
const router = express.Router();
const {
  getKpis, getCaJournalier, getCaMensuel,
  getTopProduits, getCaParCategorie,
  getDernieresVentes, getAlertes
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/kpis',            getKpis);
router.get('/ca-journalier',   getCaJournalier);
router.get('/ca-mensuel',      getCaMensuel);
router.get('/top-produits',    getTopProduits);
router.get('/ca-categories',   getCaParCategorie);
router.get('/dernieres-ventes',getDernieresVentes);
router.get('/alertes',
  authorize('administrateur', 'gestionnaire'),
  getAlertes
);

module.exports = router;
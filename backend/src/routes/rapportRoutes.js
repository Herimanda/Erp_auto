const express = require('express');
const router  = express.Router();
const {
  rapportVentesPDF, rapportVentesExcel,
  rapportStocksPDF, rapportStocksExcel,
  rapportClientsExcel, factureIndividuellePDF
} = require('../controllers/rapportController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('administrateur', 'gestionnaire'));

router.get('/ventes/pdf',         rapportVentesPDF);
router.get('/ventes/excel',       rapportVentesExcel);
router.get('/stocks/pdf',         rapportStocksPDF);
router.get('/stocks/excel',       rapportStocksExcel);
router.get('/clients/excel',      rapportClientsExcel);
router.get('/facture/:id/pdf',
  authorize('administrateur', 'gestionnaire', 'caissier'),
  factureIndividuellePDF
);

module.exports = router;
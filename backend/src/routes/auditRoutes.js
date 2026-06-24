const express = require('express');
const router  = express.Router();
const { getAuditLogs, getAuditStats } = require('../controllers/auditController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('administrateur'));

router.get('/',      getAuditLogs);
router.get('/stats', getAuditStats);

module.exports = router;
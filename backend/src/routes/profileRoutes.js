const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const uploadAvatar = require('../middlewares/uploadAvatar');
const { modifierMonProfil, uploadMaPhoto } = require('../controllers/profileController');

router.put('/', protect, modifierMonProfil);
router.post('/photo', protect, uploadAvatar.single('photo'), uploadMaPhoto);

module.exports = router;
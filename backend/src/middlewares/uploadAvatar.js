const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dossier = path.join(__dirname, '..', '..', 'uploads', 'avatars');
if (!fs.existsSync(dossier)) {
  fs.mkdirSync(dossier, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dossier),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nomFichier = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, nomFichier);
  }
});

const fileFilter = (req, file, cb) => {
  const typesAutorises = ['image/jpeg', 'image/png', 'image/webp'];
  if (typesAutorises.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté (jpg, png, webp uniquement).'), false);
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 Mo max
});

module.exports = uploadAvatar;
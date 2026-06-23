const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads/articles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nom = `article-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nom);
  }
});

const fileFilter = (req, file, cb) => {
  const typesAutorisés = /jpeg|jpg|png|webp/;
  const extOk = typesAutorisés.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = typesAutorisés.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Format image non supporté. Utilisez JPG, PNG ou WEBP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB max
});

module.exports = upload;
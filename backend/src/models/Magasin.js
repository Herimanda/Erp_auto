const mongoose = require('mongoose');

const magasinSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  nom: { type: String, required: true },
  adresse: { type: String },
  telephone: { type: String },
  email: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Magasin', magasinSchema);
const mongoose = require('mongoose');

const fournisseurSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true, uppercase: true },
  raisonSociale: { type: String, required: true },
  contact: { type: String },
  telephone: { type: String },
  email: { type: String },
  adresse: { type: String },
  nif: { type: String },
  solde: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Fournisseur', fournisseurSchema);
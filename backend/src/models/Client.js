const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  numeroClient: { type: String, required: true, unique: true },
  nom: { type: String, required: true },
  prenom: { type: String },
  societe: { type: String },
  categorie: {
    type: String,
    enum: ['particulier', 'garage', 'revendeur'],
    default: 'particulier'
  },
  telephone: { type: String },
  email: { type: String },
  adresse: { type: String },
  nif: { type: String },
  solde: { type: Number, default: 0 }, // solde crédit/débit
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
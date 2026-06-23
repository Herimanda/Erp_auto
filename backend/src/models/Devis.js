const mongoose = require('mongoose');

const ligneSchema = new mongoose.Schema({
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  designation: { type: String, required: true },
  quantite: { type: Number, required: true, min: 1 },
  prixUnitaire: { type: Number, required: true },
  tva: { type: Number, default: 20 },
  remise: { type: Number, default: 0 }, // en %
  montantHT: { type: Number },
  montantTTC: { type: Number }
}, { _id: false });

const devisSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  magasin: { type: mongoose.Schema.Types.ObjectId, ref: 'Magasin', required: true },
  lignes: [ligneSchema],
  totalHT: { type: Number, default: 0 },
  totalTVA: { type: Number, default: 0 },
  totalTTC: { type: Number, default: 0 },
  remiseGlobale: { type: Number, default: 0 },
  statut: {
    type: String,
    enum: ['brouillon', 'envoye', 'accepte', 'refuse'],
    default: 'brouillon'
  },
  dateValidite: { type: Date },
  notes: { type: String },
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Devis', devisSchema);
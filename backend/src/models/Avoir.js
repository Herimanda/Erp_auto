const mongoose = require('mongoose');

const avoirSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  factureOrigine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture',
    required: true
  },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  magasin: { type: mongoose.Schema.Types.ObjectId, ref: 'Magasin', required: true },
  lignes: [{
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    designation: { type: String },
    quantite: { type: Number },
    prixUnitaire: { type: Number },
    montantHT: { type: Number },
    montantTTC: { type: Number }
  }],
  type: {
    type: String,
    enum: ['retour_produit', 'annulation_partielle', 'annulation_totale']
  },
  totalHT: { type: Number, default: 0 },
  totalTTC: { type: Number, default: 0 },
  statut: {
    type: String,
    enum: ['en_attente', 'valide', 'utilise'],
    default: 'en_attente'
  },
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Avoir', avoirSchema);
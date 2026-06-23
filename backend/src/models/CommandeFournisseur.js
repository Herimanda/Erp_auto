const mongoose = require('mongoose');

const commandeFournisseurSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  fournisseur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fournisseur',
    required: true
  },
  magasin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magasin',
    required: true
  },
  lignes: [{
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    designation: { type: String },
    quantiteCommandee: { type: Number, required: true },
    quantiteRecue: { type: Number, default: 0 },
    prixUnitaire: { type: Number },
    montantHT: { type: Number }
  }],
  totalHT: { type: Number, default: 0 },
  statut: {
    type: String,
    enum: ['brouillon', 'validee', 'en_cours', 'recue', 'annulee'],
    default: 'brouillon'
  },
  dateCommande: { type: Date, default: Date.now },
  dateLivraisonPrevue: { type: Date },
  dateLivraisonReelle: { type: Date },
  notes: { type: String },
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CommandeFournisseur', commandeFournisseurSchema);
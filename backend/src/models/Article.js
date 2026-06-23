const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true, uppercase: true },
  codeBarres: { type: String, unique: true, sparse: true },
  designation: { type: String, required: true },
  description: { type: String },
  marque: { type: String },
  modeleCompatible: [{ type: String }],
  categorie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie',
    required: true
  },
  prixAchat: { type: Number, required: true, min: 0 },
  prixVente: { type: Number, required: true, min: 0 },
  tva: { type: Number, default: 20 }, // en %
  stockMinimum: { type: Number, default: 0 },
  image: { type: String }, // chemin vers l'image
  isActive: { type: Boolean, default: true }, // suppression logique
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Index pour la recherche
articleSchema.index({ designation: 'text', marque: 'text', reference: 'text' });

module.exports = mongoose.model('Article', articleSchema);
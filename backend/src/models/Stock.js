const mongoose = require('mongoose');

// Stock par article ET par magasin
const stockSchema = new mongoose.Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  magasin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Magasin',
    required: true
  },
  quantite: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

// Un article ne peut avoir qu'un seul stock par magasin
stockSchema.index({ article: 1, magasin: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);
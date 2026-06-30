const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();


const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const magasinRoutes = require('./routes/magasinRoutes');
const categorieRoutes = require('./routes/categorieRoutes');
const articleRoutes = require('./routes/articleRoutes');
const stockRoutes = require('./routes/stockRoutes');
const mouvementRoutes = require('./routes/mouvementRoutes');
const transfertRoutes = require('./routes/transfertRoutes');
const inventaireRoutes = require('./routes/inventaireRoutes');
const clientRoutes = require('./routes/clientRoutes');
const fournisseurRoutes = require('./routes/fournisseurRoutes');
const commandeFournisseurRoutes = require('./routes/commandeFournisseurRoutes');
const devisRoutes = require('./routes/devisRoutes');
const factureRoutes = require('./routes/factureRoutes');
const avoirRoutes = require('./routes/avoirRoutes');

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/magasins', magasinRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/mouvements', mouvementRoutes);
app.use('/api/transferts', transfertRoutes);
app.use('/api/inventaire', inventaireRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/fournisseurs', fournisseurRoutes);
app.use('/api/commandes-fournisseur', commandeFournisseurRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/avoirs', avoirRoutes);
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/rapports', require('./routes/rapportRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));


//uploads
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));


// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: '🚀 ERP Auto API démarrée' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
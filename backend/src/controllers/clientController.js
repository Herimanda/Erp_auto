const Client = require('../models/Client');
const Facture = require('../models/Facture');
const Avoir = require('../models/Avoir');
const { success, error } = require('../utils/apiResponse');

// Générer numéro client automatique
const genererNumeroClient = async () => {
  const dernier = await Client.findOne(
    { numeroClient: { $regex: '^CLT-' } },
    { numeroClient: 1 },
    { sort: { numeroClient: -1 } }
  );
  let numero = 1;
  if (dernier) {
    const parts = dernier.numeroClient.split('-');
    numero = parseInt(parts[parts.length - 1]) + 1;
  }
  return `CLT-${String(numero).padStart(5, '0')}`;
};

// @desc    Créer un client
// @route   POST /api/clients
const creerClient = async (req, res) => {
  try {
    const {
      nom, prenom, societe, categorie,
      telephone, email, adresse, nif
    } = req.body;

    // Vérifier email unique si fourni
    if (email) {
      const existant = await Client.findOne({ email, isActive: true });
      if (existant) return error(res, 'Cet email est déjà utilisé.', 400);
    }

    const numeroClient = await genererNumeroClient();

    const client = await Client.create({
      numeroClient, nom, prenom, societe,
      categorie, telephone, email, adresse, nif
    });

    return success(res, client, 'Client créé avec succès.', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Liste des clients
// @route   GET /api/clients
const getClients = async (req, res) => {
  try {
    const {
      search, categorie, page = 1, limit = 20,
      sortBy = 'nom', order = 'asc'
    } = req.query;

    const filtre = { isActive: true };

    if (search) {
      filtre.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { societe: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } },
        { numeroClient: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (categorie) filtre.categorie = categorie;

    const total = await Client.countDocuments(filtre);
    const clients = await Client.find(filtre)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return success(res, {
      clients,
      pagination: {
        total, page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Détail d'un client
// @route   GET /api/clients/:id
const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client || !client.isActive) {
      return error(res, 'Client introuvable.', 404);
    }
    return success(res, client);
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Modifier un client
// @route   PUT /api/clients/:id
const modifierClient = async (req, res) => {
  try {
    const {
      nom, prenom, societe, categorie,
      telephone, email, adresse, nif
    } = req.body;

    // Vérifier unicité email
    if (email) {
      const existant = await Client.findOne({
        email,
        isActive: true,
        _id: { $ne: req.params.id }
      });
      if (existant) return error(res, 'Cet email est déjà utilisé.', 400);
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { nom, prenom, societe, categorie, telephone, email, adresse, nif },
      { new: true, runValidators: true }
    );

    if (!client) return error(res, 'Client introuvable.', 404);
    return success(res, client, 'Client modifié avec succès.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Supprimer un client (logique)
// @route   DELETE /api/clients/:id
const supprimerClient = async (req, res) => {
  try {
    // Vérifier s'il a des factures impayées
    const facturesImpayees = await Facture.countDocuments({
      client: req.params.id,
      statut: { $in: ['en_attente', 'partiellement_payee'] }
    });

    if (facturesImpayees > 0) {
      return error(
        res,
        `Impossible de supprimer : ${facturesImpayees} facture(s) impayée(s).`,
        400
      );
    }

    await Client.findByIdAndUpdate(req.params.id, { isActive: false });
    return success(res, null, 'Client supprimé.');
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Historique complet d'un client
// @route   GET /api/clients/:id/historique
const getHistoriqueClient = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const client = await Client.findById(req.params.id);
    if (!client) return error(res, 'Client introuvable.', 404);

    // Factures
    const factures = await Facture.find({ client: req.params.id })
      .populate('magasin', 'nom code')
      .populate('creePar', 'nom prenom')
      .sort({ createdAt: -1 });

    // Avoirs
    const avoirs = await Avoir.find({ client: req.params.id })
      .populate('magasin', 'nom code')
      .sort({ createdAt: -1 });

    // Statistiques
    const stats = {
      totalFactures: factures.length,
      totalAchats: factures.reduce((s, f) => s + f.totalTTC, 0),
      totalPaye: factures.reduce((s, f) => s + f.montantPaye, 0),
      totalRestant: factures.reduce((s, f) => s + f.montantRestant, 0),
      totalAvoirs: avoirs.reduce((s, a) => s + a.totalTTC, 0),
      derniereVisite: factures[0]?.createdAt || null
    };

    // Pagination factures
    const total = factures.length;
    const facturesPaginées = factures.slice(
      (page - 1) * limit,
      page * limit
    );

    return success(res, {
      client,
      stats,
      factures: facturesPaginées,
      avoirs,
      pagination: {
        total, page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// @desc    Meilleurs clients
// @route   GET /api/clients/stats/top
const getTopClients = async (req, res) => {
  try {
    const { limit = 10, periode } = req.query;

    const filtre = {};
    if (periode === 'mois') {
      const debut = new Date();
      debut.setDate(1);
      debut.setHours(0, 0, 0, 0);
      filtre.createdAt = { $gte: debut };
    } else if (periode === 'annee') {
      const debut = new Date(new Date().getFullYear(), 0, 1);
      filtre.createdAt = { $gte: debut };
    }

    const topClients = await Facture.aggregate([
      { $match: { ...filtre, statut: { $ne: 'annulee' } } },
      {
        $group: {
          _id: '$client',
          totalAchats: { $sum: '$totalTTC' },
          nbFactures: { $sum: 1 },
          montantPaye: { $sum: '$montantPaye' }
        }
      },
      { $sort: { totalAchats: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' }
    ]);

    return success(res, topClients);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  creerClient, getClients, getClient,
  modifierClient, supprimerClient,
  getHistoriqueClient, getTopClients
};
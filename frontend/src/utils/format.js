// Formater montant en Ariary
export const formatMontant = (montant) => {
  if (montant === null || montant === undefined) return '—';
  return new Intl.NumberFormat('fr-MG', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(montant) + ' Ar';
};

// Formater date
export const formatDate = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(date));
};

// Formater date + heure
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));
};

// Badge statut universel
export const getStatutBadge = (statut) => {
  const map = {
    // Stocks
    en_attente:          'badge-warning',
    valide:              'badge-success',
    expedie:             'badge-info',
    recu:                'badge-success',
    annule:              'badge-danger',
    // Factures
    payee:               'badge-success',
    partiellement_payee: 'badge-warning',
    // Devis
    brouillon:           'badge-gray',
    envoye:              'badge-info',
    accepte:             'badge-success',
    refuse:              'badge-danger',
    // Commandes
    en_cours:            'badge-info',
    recue:               'badge-success',
    validee:             'badge-success',
    livree:              'badge-success',
  };
  return map[statut] || 'badge-gray';
};

export const getStatutLabel = (statut) => {
  const labels = {
    en_attente:          'En attente',
    valide:              'Validé',
    expedie:             'Expédié',
    recu:                'Reçu',
    annule:              'Annulé',
    payee:               'Payée',
    partiellement_payee: 'Part. payée',
    brouillon:           'Brouillon',
    envoye:              'Envoyé',
    accepte:             'Accepté',
    refuse:              'Refusé',
    en_cours:            'En cours',
    recue:               'Reçue',
    validee:             'Validée',
    livree:              'Livrée',
    comptoir:            'Comptoir',
    credit:              'Crédit',
    proforma:            'Proforma',
  };
  return labels[statut] || statut;
};
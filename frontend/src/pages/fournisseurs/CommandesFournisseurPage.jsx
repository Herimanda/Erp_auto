import { useState } from 'react';
import {
  Plus, Eye, CheckCircle,
  PackageCheck, XCircle
} from 'lucide-react';
import { useCommandes, useActionCommande }
  from '../../hooks/useFournisseurs';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import CommandeForm from './CommandeForm';
import CommandeDetail from './CommandeDetail';
import ReceptionForm from './ReceptionForm';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import {
  formatMontant, formatDate,
  getStatutBadge, getStatutLabel
} from '../../utils/format';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';

const STATUTS = [
  'brouillon', 'validee', 'en_cours', 'recue', 'annulee'
];

export default function CommandesFournisseurPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire'].includes(user?.role);
  const canReceive = [...(canEdit ? [] : []),
    'magasinier'].includes(user?.role) || canEdit;

  const [page, setPage]             = useState(1);
  const [statutFiltre, setStatut]   = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showRecep, setShowRecep]   = useState(false);
  const [selected, setSelected]     = useState(null);

  const { data, isLoading } = useCommandes({
    statut: statutFiltre, page, limit: 15
  });
  const actionMutation = useActionCommande();

  const commandes  = data?.data?.commandes || [];
  const pagination = data?.data?.pagination;

  const handleAction = (id, action) => {
    const msgs = {
      valider: 'Valider cette commande ?',
      annuler: 'Annuler cette commande ?'
    };
    if (confirm(msgs[action])) {
      actionMutation.mutate({ id, action });
    }
  };

  return (
    <div>
      <PageHeader
        title="Commandes fournisseurs"
        subtitle={`${pagination?.total || 0} commande(s)`}
        actions={canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvelle commande
          </button>
        )}
      />

      {/* Filtres statut */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatut('')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              !statutFiltre
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            Toutes
          </button>
          {STATUTS.map((s) => (
            <button
              key={s}
              onClick={() => setStatut(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                statutFiltre === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {getStatutLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : commandes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="font-medium">Aucune commande trouvée</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Numéro</Th>
                <Th>Fournisseur</Th>
                <Th>Magasin</Th>
                <Th>Articles</Th>
                <Th>Montant HT</Th>
                <Th>Date</Th>
                <Th>Livraison prévue</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {commandes.map((c) => (
                <Tr key={c._id}>
                  <Td>
                    <span className="font-mono text-sm font-medium
                                     text-primary-600 dark:text-primary-400">
                      {c.numero}
                    </span>
                  </Td>
                  <Td>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {c.fournisseur?.raisonSociale}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {c.fournisseur?.reference}
                    </p>
                  </Td>
                  <Td className="text-sm text-gray-700 dark:text-gray-300">
                    {c.magasin?.nom}
                  </Td>
                  <Td className="text-sm text-gray-500 dark:text-gray-400">
                    {c.lignes?.length} article(s)
                  </Td>
                  <Td className="font-medium text-sm text-gray-900 dark:text-white">
                    {formatMontant(c.totalHT)}
                  </Td>
                  <Td className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(c.createdAt)}
                  </Td>
                  <Td className="text-sm text-gray-500 dark:text-gray-400">
                    {c.dateLivraisonPrevue
                      ? formatDate(c.dateLivraisonPrevue)
                      : '—'}
                  </Td>
                  <Td>
                    <span className={getStatutBadge(c.statut)}>
                      {getStatutLabel(c.statut)}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelected(c); setShowDetail(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100
                                   text-gray-400 hover:text-primary-600
                                   dark:hover:bg-gray-800 dark:text-gray-500
                                   dark:hover:text-primary-400"
                        title="Voir détail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {c.statut === 'brouillon' && canEdit && (
                        <button
                          onClick={() => handleAction(c._id, 'valider')}
                          className="p-1.5 rounded-lg hover:bg-green-50
                                     text-gray-400 hover:text-green-600
                                     dark:hover:bg-green-900/30 dark:text-gray-500
                                     dark:hover:text-green-400"
                          title="Valider"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {['validee', 'en_cours'].includes(c.statut)
                        && canReceive && (
                        <button
                          onClick={() => {
                            setSelected(c); setShowRecep(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-50
                                     text-gray-400 hover:text-blue-600
                                     dark:hover:bg-blue-900/30 dark:text-gray-500
                                     dark:hover:text-blue-400"
                          title="Réceptionner"
                        >
                          <PackageCheck className="w-4 h-4" />
                        </button>
                      )}
                      {!['recue', 'annulee'].includes(c.statut)
                        && canEdit && (
                        <button
                          onClick={() => handleAction(c._id, 'annuler')}
                          className="p-1.5 rounded-lg hover:bg-red-50
                                     text-gray-400 hover:text-red-600
                                     dark:hover:bg-red-900/30 dark:text-gray-500
                                     dark:hover:text-red-400"
                          title="Annuler"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        {pagination && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nouvelle commande fournisseur"
        size="xl"
      >
        <CommandeForm onSuccess={() => setShowForm(false)} />
      </Modal>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Détail commande"
        size="lg"
      >
        <CommandeDetail commandeId={selected?._id} />
      </Modal>

      <Modal
        isOpen={showRecep}
        onClose={() => setShowRecep(false)}
        title="Réceptionner la commande"
        size="lg"
      >
        <ReceptionForm
          commande={selected}
          onSuccess={() => setShowRecep(false)}
        />
      </Modal>
    </div>
  );
}
import { useState } from 'react';
import {
  Plus, Eye, Send, CheckCircle,
  XCircle, RefreshCw, FileText
} from 'lucide-react';
import {
  useDevis, useUpdateDevisStatut, useConvertirDevis
} from '../../hooks/useVentes';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import DevisForm from './DevisForm';
import DevisDetail from './DevisDetail';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import {
  formatMontant, formatDate,
  getStatutBadge, getStatutLabel
} from '../../utils/format';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';

const STATUTS = ['brouillon', 'envoye', 'accepte', 'refuse'];

export default function DevisPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire', 'caissier']
    .includes(user?.role);

  const [page, setPage]             = useState(1);
  const [statutFiltre, setStatut]   = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected]     = useState(null);

  const { data, isLoading } = useDevis({
    statut: statutFiltre,
    page,
    limit: 15
  });

  const statutMutation  = useUpdateDevisStatut();
  const convertMutation = useConvertirDevis();

  const devisList  = data?.data?.devis || [];
  const pagination = data?.data?.pagination;

  const handleStatut = (id, statut) => {
    statutMutation.mutate({ id, statut });
  };

  const handleConvertir = (id) => {
    if (confirm('Convertir ce devis en facture comptoir ?')) {
      convertMutation.mutate({ id, type: 'comptoir' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Devis"
        subtitle={`${pagination?.total || 0} devis`}
        actions={canEdit && (
          <button
            onClick={() => {
              setSelected(null);
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau devis
          </button>
        )}
      />

      {/* 🔥 FILTRES MODIFIÉS */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 items-center">

          {/* Tous */}
          <button
            onClick={() => setStatut('')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              statutFiltre === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            Tous
          </button>

          {/* Statuts */}
          {STATUTS.map((s) => (
            <button
              key={s}
              onClick={() => setStatut(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium capitalize',
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

      {/* TABLE */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : devisList.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">Aucun devis trouvé</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Numéro</Th>
                <Th>Client</Th>
                <Th>Magasin</Th>
                <Th>Articles</Th>
                <Th className="text-right">Total TTC</Th>
                <Th>Date</Th>
                <Th>Validité</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>

            <Tbody>
              {devisList.map((d) => (
                <Tr key={d._id}>
                  <Td>
                    <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
                      {d.numero}
                    </span>
                  </Td>

                  <Td>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {d.client?.nom} {d.client?.prenom}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {d.client?.numeroClient}
                    </p>
                  </Td>

                  <Td className="text-sm text-gray-700 dark:text-gray-300">
                    {d.magasin?.nom}
                  </Td>

                  <Td className="text-sm text-gray-500 dark:text-gray-400">
                    {d.lignes?.length} article(s)
                  </Td>

                  <Td className="text-right font-semibold text-sm text-gray-900 dark:text-white">
                    {formatMontant(d.totalTTC)}
                  </Td>

                  <Td className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(d.createdAt)}
                  </Td>

                  <Td className="text-sm text-gray-500 dark:text-gray-400">
                    {d.dateValidite ? formatDate(d.dateValidite) : '—'}
                  </Td>

                  <Td>
                    <span className={getStatutBadge(d.statut)}>
                      {getStatutLabel(d.statut)}
                    </span>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelected(d);
                          setShowDetail(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100
                                   text-gray-400 hover:text-primary-600
                                   dark:hover:bg-gray-800 dark:text-gray-500
                                   dark:hover:text-primary-400"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canEdit && d.statut === 'brouillon' && (
                        <button
                          onClick={() => handleStatut(d._id, 'envoye')}
                          className="p-1.5 rounded-lg hover:bg-blue-50
                                     text-gray-400 hover:text-blue-600
                                     dark:hover:bg-blue-900/30 dark:text-gray-500
                                     dark:hover:text-blue-400"
                          title="Marquer envoyé"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}

                      {canEdit && d.statut === 'envoye' && (
                        <>
                          <button
                            onClick={() => handleStatut(d._id, 'accepte')}
                            className="p-1.5 rounded-lg hover:bg-green-50
                                       text-gray-400 hover:text-green-600
                                       dark:hover:bg-green-900/30 dark:text-gray-500
                                       dark:hover:text-green-400"
                            title="Accepter"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleStatut(d._id, 'refuse')}
                            className="p-1.5 rounded-lg hover:bg-red-50
                                       text-gray-400 hover:text-red-600
                                       dark:hover:bg-red-900/30 dark:text-gray-500
                                       dark:hover:text-red-400"
                            title="Refuser"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {canEdit &&
                        ['envoye', 'accepte'].includes(d.statut) && (
                        <button
                          onClick={() => handleConvertir(d._id)}
                          className="p-1.5 rounded-lg hover:bg-purple-50
                                     text-gray-400 hover:text-purple-600
                                     dark:hover:bg-purple-900/30 dark:text-gray-500
                                     dark:hover:text-purple-400"
                          title="Convertir en facture"
                        >
                          <RefreshCw className="w-4 h-4" />
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

      {/* MODALS inchangés */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nouveau devis"
        size="xl"
      >
        <DevisForm onSuccess={() => setShowForm(false)} />
      </Modal>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Détail devis"
        size="xl"
      >
        <DevisDetail devisId={selected?._id} />
      </Modal>
    </div>
  );
}
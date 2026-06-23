import { useState } from 'react';
import { Plus, ArrowRight, CheckCircle,
         Truck, PackageCheck } from 'lucide-react';
import { useTransferts, useActionTransfert,
         useCreateTransfert } from '../../hooks/useStocks';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import TransfertForm from './TransfertForm';
import Pagination from '../../components/ui/Pagination';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import { formatDate, getStatutBadge, getStatutLabel }
  from '../../utils/format';
import useAuthStore from '../../store/authStore';

export default function TransfertsPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire', 'magasinier']
    .includes(user?.role);

  const [page, setPage] = useState(1);
  const [statutFiltre, setStatutFiltre] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useTransferts({
    statut: statutFiltre, page, limit: 15
  });
  const actionMutation = useActionTransfert();

  const transferts = data?.data?.transferts || [];
  const pagination = data?.data?.pagination;

  const handleAction = (id, action) => {
    const labels = {
      valider: 'Valider ce transfert ?',
      expedier: 'Expédier ce transfert ? Le stock source sera déduit.',
      receptionner: 'Réceptionner ce transfert ? Le stock destination sera crédité.',
      annuler: 'Annuler ce transfert ?'
    };
    if (confirm(labels[action])) {
      actionMutation.mutate({ id, action });
    }
  };

  const statuts = ['en_attente', 'valide', 'expedie', 'recu', 'annule'];

  return (
    <div>
      <PageHeader
        title="Transferts inter-magasins"
        subtitle={`${pagination?.total || 0} transfert(s)`}
        actions={canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau transfert
          </button>
        )}
      />

      {/* Filtre statut */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatutFiltre('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium
              ${!statutFiltre
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600'}`}
          >
            Tous
          </button>
          {statuts.map((s) => (
            <button
              key={s}
              onClick={() => setStatutFiltre(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium
                ${statutFiltre === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600'}`}
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
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Numéro</Th>
                <Th>Trajet</Th>
                <Th>Articles</Th>
                <Th>Date</Th>
                <Th>Demandé par</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {transferts.map((t) => (
                <Tr key={t._id}>
                  <Td>
                    <span className="font-mono text-sm font-medium
                                     text-primary-600">
                      {t.numero}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {t.magasinSource?.nom}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400
                                             shrink-0" />
                      <span className="font-medium">
                        {t.magasinDestination?.nom}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-sm text-gray-500">
                    {t.lignes?.length} article(s)
                  </Td>
                  <Td className="text-sm text-gray-500">
                    {formatDate(t.createdAt)}
                  </Td>
                  <Td className="text-sm text-gray-500">
                    {t.demandePar?.prenom} {t.demandePar?.nom}
                  </Td>
                  <Td>
                    <span className={getStatutBadge(t.statut)}>
                      {getStatutLabel(t.statut)}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      {t.statut === 'en_attente' && canEdit && (
                        <button
                          onClick={() => handleAction(t._id, 'valider')}
                          className="p-1.5 rounded-lg hover:bg-green-50
                                     text-gray-400 hover:text-green-600"
                          title="Valider"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {t.statut === 'valide' && canEdit && (
                        <button
                          onClick={() => handleAction(t._id, 'expedier')}
                          className="p-1.5 rounded-lg hover:bg-blue-50
                                     text-gray-400 hover:text-blue-600"
                          title="Expédier"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                      {t.statut === 'expedie' && canEdit && (
                        <button
                          onClick={() => handleAction(t._id, 'receptionner')}
                          className="p-1.5 rounded-lg hover:bg-primary-50
                                     text-gray-400 hover:text-primary-600"
                          title="Réceptionner"
                        >
                          <PackageCheck className="w-4 h-4" />
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
          <div className="p-4 border-t border-gray-100">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nouveau transfert"
        size="lg"
      >
        <TransfertForm onSuccess={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
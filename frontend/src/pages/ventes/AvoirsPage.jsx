import { useState } from 'react';
import { Plus, Eye, FileMinus } from 'lucide-react';
import { useAvoirs, useCreateAvoir, useAvoir } from '../../hooks/useVentes';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import AvoirForm from './AvoirForm';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import {
  formatMontant, formatDate,
  getStatutBadge, getStatutLabel
} from '../../utils/format';
import useAuthStore from '../../store/authStore';

export default function AvoirsPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire', 'caissier']
    .includes(user?.role);

  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected]   = useState(null);

  const { data, isLoading } = useAvoirs({ page, limit: 15 });
  const avoirs     = data?.data?.avoirs || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <PageHeader
        title="Avoirs"
        subtitle={`${pagination?.total || 0} avoir(s)`}
        actions={canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvel avoir
          </button>
        )}
      />

      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : avoirs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileMinus className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
            <p className="font-medium">Aucun avoir trouvé</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Numéro</Th>
                <Th>Facture origine</Th>
                <Th>Client</Th>
                <Th>Type</Th>
                <Th className="text-right">Montant TTC</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {avoirs.map((a) => (
                <Tr key={a._id}>
                  <Td>
                    <span className="font-mono text-sm font-medium
                                     text-orange-600">
                      {a.numero}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-primary-600">
                      {a.factureOrigine?.numero}
                    </span>
                  </Td>
                  <Td>
                    <p className="font-medium text-sm text-gray-900">
                      {a.client?.nom} {a.client?.prenom}
                    </p>
                  </Td>
                  <Td>
                    <span className="badge-warning capitalize text-xs">
                      {a.type?.replace(/_/g, ' ')}
                    </span>
                  </Td>
                  <Td className="text-right font-semibold text-sm
                                 text-orange-600">
                    — {formatMontant(a.totalTTC)}
                  </Td>
                  <Td className="text-sm text-gray-500">
                    {formatDate(a.createdAt)}
                  </Td>
                  <Td>
                    <span className={getStatutBadge(a.statut)}>
                      {getStatutLabel(a.statut)}
                    </span>
                  </Td>
                  <Td>
                    <button
                      onClick={() => {
                        setSelected(a); setShowDetail(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100
                                 text-gray-400 hover:text-primary-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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

      <Modal isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nouvel avoir" size="lg">
        <AvoirForm onSuccess={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
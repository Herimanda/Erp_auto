import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Truck, XCircle } from 'lucide-react';
import {
  useFournisseurs, useDeleteFournisseur
} from '../../hooks/useFournisseurs';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import FournisseurForm from './FournisseurForm';
import FournisseurHistorique from './FournisseurHistorique';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import useAuthStore from '../../store/authStore';

export default function FournisseursPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire'].includes(user?.role);

  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [showHisto, setShowHisto] = useState(false);
  const [selected, setSelected]   = useState(null);

  const { data, isLoading } = useFournisseurs({ search, page, limit: 15 });
  const deleteMutation = useDeleteFournisseur();

  const fournisseurs = data?.data?.fournisseurs || [];
  const pagination   = data?.data?.pagination;

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        subtitle={`${pagination?.total || 0} fournisseur(s)`}
        actions={canEdit && (
          <button
            onClick={() => { setSelected(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau fournisseur
          </button>
        )}
      />

      {/* FILTRE */}
      <div className="card mb-6">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Raison sociale, référence, contact..."
            />
          </div>

          {search && (
            <button
              onClick={clearSearch}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200
                         text-gray-500 hover:text-gray-700 transition
                         dark:bg-gray-800 dark:hover:bg-gray-700
                         dark:text-gray-400 dark:hover:text-gray-200"
              title="Effacer"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fournisseurs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">Aucun fournisseur trouvé</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Référence</Th>
                <Th>Raison sociale</Th>
                <Th>Contact</Th>
                <Th>Téléphone</Th>
                <Th>Email</Th>
                <Th>NIF</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {fournisseurs.map((f) => (
                <Tr key={f._id}>
                  <Td>
                    <span className="font-mono text-xs bg-gray-100
                                     px-2 py-0.5 rounded font-medium
                                     dark:bg-gray-800 dark:text-gray-300">
                      {f.reference}
                    </span>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100
                                      flex items-center justify-center
                                      dark:bg-blue-900/40">
                        <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {f.raisonSociale}
                      </p>
                    </div>
                  </Td>

                  <Td className="text-sm text-gray-600 dark:text-gray-300">{f.contact || '—'}</Td>
                  <Td className="text-sm text-gray-600 dark:text-gray-300">{f.telephone || '—'}</Td>
                  <Td className="text-sm text-gray-500 dark:text-gray-400">{f.email || '—'}</Td>
                  <Td className="text-sm text-gray-500 dark:text-gray-400">{f.nif || '—'}</Td>

                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelected(f);
                          setShowHisto(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100
                                   text-gray-400 hover:text-primary-600
                                   dark:hover:bg-gray-800 dark:text-gray-500
                                   dark:hover:text-primary-400"
                        title="Historique"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => {
                              setSelected(f);
                              setShowForm(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100
                                       text-gray-400 hover:text-blue-600
                                       dark:hover:bg-gray-800 dark:text-gray-500
                                       dark:hover:text-blue-400"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Supprimer ce fournisseur ?')) {
                                deleteMutation.mutate(f._id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100
                                       text-gray-400 hover:text-red-600
                                       dark:hover:bg-gray-800 dark:text-gray-500
                                       dark:hover:text-red-400"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
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

      {/* MODALS */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selected ? 'Modifier fournisseur' : 'Nouveau fournisseur'}
      >
        <FournisseurForm
          fournisseur={selected}
          onSuccess={() => setShowForm(false)}
        />
      </Modal>

      <Modal
        isOpen={showHisto}
        onClose={() => setShowHisto(false)}
        title="Historique fournisseur"
        size="xl"
      >
        <FournisseurHistorique fournisseurId={selected?._id} />
      </Modal>
    </div>
  );
}
import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Truck } from 'lucide-react';
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

      <div className="card mb-6">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Raison sociale, référence, contact..."
        />
      </div>

      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fournisseurs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
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
                                     px-2 py-0.5 rounded font-medium">
                      {f.reference}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100
                                      flex items-center justify-center">
                        <Truck className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="font-medium text-gray-900">
                        {f.raisonSociale}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-sm text-gray-600">
                    {f.contact || '—'}
                  </Td>
                  <Td className="text-sm text-gray-600">
                    {f.telephone || '—'}
                  </Td>
                  <Td className="text-sm text-gray-500">
                    {f.email || '—'}
                  </Td>
                  <Td className="text-sm text-gray-500">
                    {f.nif || '—'}
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelected(f); setShowHisto(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100
                                   text-gray-400 hover:text-primary-600"
                        title="Historique"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => {
                              setSelected(f); setShowForm(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100
                                       text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Supprimer ce fournisseur ?'))
                                deleteMutation.mutate(f._id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100
                                       text-gray-400 hover:text-red-600"
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
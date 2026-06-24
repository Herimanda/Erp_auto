import { useState } from 'react';
import {
  Plus, Edit2, Trash2, Eye,
  User, Building2, Wrench
} from 'lucide-react';
import {
  useClients, useCreateClient,
  useUpdateClient, useDeleteClient
} from '../../hooks/useClients';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ClientForm from './ClientForm';
import ClientHistorique from './ClientHistorique';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import { formatMontant } from '../../utils/format';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';

const CATEGORIE_CONFIG = {
  particulier: { label: 'Particulier', icon: User,     color: 'badge-gray'    },
  garage:      { label: 'Garage',      icon: Wrench,   color: 'badge-info'    },
  revendeur:   { label: 'Revendeur',   icon: Building2, color: 'badge-warning' },
};

export default function ClientsPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire', 'caissier']
    .includes(user?.role);

  const [search, setSearch]       = useState('');
  const [categorie, setCategorie] = useState('');
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const [showHisto, setShowHisto] = useState(false);
  const [selected, setSelected]   = useState(null);

  const { data, isLoading } = useClients({
    search, categorie, page, limit: 15
  });
  const deleteMutation = useDeleteClient();

  const clients    = data?.data?.clients || [];
  const pagination = data?.data?.pagination;

  const handleEdit = (client) => {
    setSelected(client);
    setShowForm(true);
  };

  const handleView = (client) => {
    setSelected(client);
    setShowHisto(true);
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer ce client ?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${pagination?.total || 0} client(s)`}
        actions={canEdit && (
          <button
            onClick={() => { setSelected(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau client
          </button>
        )}
      />

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Nom, prénom, société, téléphone..."
            />
          </div>
          <div className="flex gap-2">
            {['', 'particulier', 'garage', 'revendeur'].map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategorie(cat); setPage(1); }}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium capitalize',
                  categorie === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat || 'Tous'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aucun client trouvé</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>N° Client</Th>
                <Th>Nom / Société</Th>
                <Th>Catégorie</Th>
                <Th>Téléphone</Th>
                <Th>Email</Th>
                <Th className="text-right">Solde</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {clients.map((c) => {
                const cfg = CATEGORIE_CONFIG[c.categorie];
                const Icon = cfg?.icon || User;
                return (
                  <Tr key={c._id}>
                    <Td>
                      <span className="font-mono text-xs bg-gray-100
                                       px-2 py-0.5 rounded font-medium">
                        {c.numeroClient}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full
                                        bg-primary-100 flex items-center
                                        justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {c.nom} {c.prenom}
                          </p>
                          {c.societe && (
                            <p className="text-xs text-gray-400">
                              {c.societe}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className={cfg?.color || 'badge-gray'}>
                        {cfg?.label}
                      </span>
                    </Td>
                    <Td className="text-sm text-gray-600">
                      {c.telephone || '—'}
                    </Td>
                    <Td className="text-sm text-gray-500">
                      {c.email || '—'}
                    </Td>
                    <Td className="text-right">
                      <span className={clsx(
                        'font-semibold text-sm',
                        c.solde > 0
                          ? 'text-red-600'
                          : 'text-gray-900'
                      )}>
                        {c.solde > 0
                          ? formatMontant(c.solde)
                          : '—'}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(c)}
                          className="p-1.5 rounded-lg hover:bg-gray-100
                                     text-gray-400 hover:text-primary-600"
                          title="Historique"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleEdit(c)}
                              className="p-1.5 rounded-lg hover:bg-gray-100
                                         text-gray-400 hover:text-blue-600"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c._id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100
                                         text-gray-400 hover:text-red-600"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
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

      {/* Modal formulaire */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={selected ? 'Modifier le client' : 'Nouveau client'}
      >
        <ClientForm
          client={selected}
          onSuccess={() => setShowForm(false)}
        />
      </Modal>

      {/* Modal historique */}
      <Modal
        isOpen={showHisto}
        onClose={() => setShowHisto(false)}
        title="Historique client"
        size="xl"
      >
        <ClientHistorique clientId={selected?._id} />
      </Modal>
    </div>
  );
}
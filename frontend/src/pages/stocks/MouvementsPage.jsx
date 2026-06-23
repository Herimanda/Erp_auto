import { useState } from 'react';
import { Plus, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { useMouvements } from '../../hooks/useStocks';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import MouvementForm from './MouvementForm';
import Pagination from '../../components/ui/Pagination';
import {
  Table, Thead, Th, Tbody, Tr, Td
} from '../../components/ui/Table';
import { formatDateTime, formatMontant } from '../../utils/format';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';

const TYPE_CONFIG = {
  achat_fournisseur:  { label: 'Achat fournisseur',  color: 'green',  dir: 'up'  },
  retour_client:      { label: 'Retour client',       color: 'green',  dir: 'up'  },
  ajustement_positif: { label: 'Ajustement +',        color: 'blue',   dir: 'up'  },
  transfert_entrant:  { label: 'Transfert entrant',   color: 'blue',   dir: 'up'  },
  vente:              { label: 'Vente',               color: 'red',    dir: 'down'},
  retour_fournisseur: { label: 'Retour fournisseur',  color: 'red',    dir: 'down'},
  ajustement_negatif: { label: 'Ajustement —',        color: 'orange', dir: 'down'},
  transfert_sortant:  { label: 'Transfert sortant',   color: 'orange', dir: 'down'},
};

export default function MouvementsPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire', 'magasinier']
    .includes(user?.role);

  const [page, setPage] = useState(1);
  const [typeFiltre, setTypeFiltre] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('entree');

  const { data, isLoading } = useMouvements({
    type: typeFiltre, page, limit: 20
  });

  const mouvements = data?.data?.mouvements || [];
  const pagination = data?.data?.pagination;

  const openForm = (type) => {
    setFormType(type);
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Mouvements de stock"
        subtitle="Historique de toutes les entrées et sorties"
        actions={canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => openForm('entree')}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <ArrowDown className="w-4 h-4" /> Entrée
            </button>
            <button
              onClick={() => openForm('sortie')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <ArrowUp className="w-4 h-4" /> Sortie
            </button>
            <button
              onClick={() => openForm('ajustement')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Ajuster
            </button>
          </div>
        )}
      />

      {/* Filtre type */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFiltre('')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              !typeFiltre
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            Tous
          </button>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setTypeFiltre(key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                typeFiltre === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Article</Th>
                <Th>Magasin</Th>
                <Th className="text-right">Qté</Th>
                <Th className="text-right">Avant</Th>
                <Th className="text-right">Après</Th>
                <Th>Réf.</Th>
                <Th>Utilisateur</Th>
              </tr>
            </Thead>
            <Tbody>
              {mouvements.map((m) => {
                const cfg = TYPE_CONFIG[m.type];
                return (
                  <Tr key={m._id}>
                    <Td className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(m.createdAt)}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'w-6 h-6 rounded-full flex items-center',
                          'justify-center shrink-0',
                          cfg?.dir === 'up'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        )}>
                          {cfg?.dir === 'up'
                            ? <ArrowDown className="w-3 h-3" />
                            : <ArrowUp className="w-3 h-3" />}
                        </span>
                        <span className="text-sm">{cfg?.label}</span>
                      </div>
                    </Td>
                    <Td>
                      <p className="font-medium text-gray-900 text-sm">
                        {m.article?.designation}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {m.article?.reference}
                      </p>
                    </Td>
                    <Td className="text-sm">{m.magasin?.nom}</Td>
                    <Td className="text-right">
                      <span className={clsx(
                        'font-bold text-sm',
                        cfg?.dir === 'up'
                          ? 'text-green-600' : 'text-red-600'
                      )}>
                        {cfg?.dir === 'up' ? '+' : '-'}{m.quantite}
                      </span>
                    </Td>
                    <Td className="text-right text-sm text-gray-500">
                      {m.quantiteAvant}
                    </Td>
                    <Td className="text-right font-medium text-sm">
                      {m.quantiteApres}
                    </Td>
                    <Td className="text-xs text-gray-400">
                      {m.reference || m.motif || '—'}
                    </Td>
                    <Td className="text-sm text-gray-500">
                      {m.utilisateur?.prenom} {m.utilisateur?.nom}
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

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={
          formType === 'entree' ? 'Entrée de stock' :
          formType === 'sortie' ? 'Sortie de stock' :
          'Ajustement de stock'
        }
      >
        <MouvementForm
          type={formType}
          onSuccess={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
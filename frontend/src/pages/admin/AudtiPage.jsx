import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import { formatDateTime } from '../../utils/format';
import { clsx } from 'clsx';
import { Shield } from 'lucide-react';

const ACTION_CONFIG = {
  connexion:        { label: 'Connexion',
                      color: 'bg-blue-100 text-blue-700'    },
  deconnexion:      { label: 'Déconnexion',
                      color: 'bg-gray-100 text-gray-600'    },
  creation:         { label: 'Création',
                      color: 'bg-green-100 text-green-700'  },
  modification:     { label: 'Modification',
                      color: 'bg-yellow-100 text-yellow-700'},
  suppression:      { label: 'Suppression',
                      color: 'bg-red-100 text-red-700'      },
  vente:            { label: 'Vente',
                      color: 'bg-purple-100 text-purple-700'},
  ajustement_stock: { label: 'Ajust. stock',
                      color: 'bg-orange-100 text-orange-700'},
  transfert:        { label: 'Transfert',
                      color: 'bg-indigo-100 text-indigo-700'},
};

export default function AuditPage() {
  const [page, setPage]       = useState(1);
  const [action, setAction]   = useState('');
  const [dateDebut, setDebut] = useState('');
  const [dateFin,   setFin]   = useState('');

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['audit', { action, dateDebut, dateFin, page }],
    queryFn:  () => api.get('/audit', {
      params: {
        action:    action    || undefined,
        dateDebut: dateDebut || undefined,
        dateFin:   dateFin   || undefined,
        page,
        limit: 25
      }
    })
  });

  const logs       = data?.data?.logs       || [];
  const pagination = data?.data?.pagination;

  if (queryError) {
    return (
      <div>
        <PageHeader title="Journal d'audit" />
        <div className="card text-center py-12">
          <p className="text-red-500 font-medium">
            Erreur : {queryError.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Journal d'audit"
        subtitle="Traçabilité complète de toutes les actions"
      />

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-48"
          >
            <option value="">Toutes actions</option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <div className="flex gap-2 flex-wrap">
            <div>
              <label className="label text-xs">Du</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => { setDebut(e.target.value); setPage(1); }}
                className="input-field"
              />
            </div>
            <div>
              <label className="label text-xs">Au</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => { setFin(e.target.value); setPage(1); }}
                className="input-field"
              />
            </div>
          </div>
          <span className="text-sm text-gray-400 self-end pb-2">
            {pagination?.total || 0} entrée(s)
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
            <p className="font-medium">Aucune entrée dans le journal</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Date & Heure</Th>
                <Th>Utilisateur</Th>
                <Th>Rôle</Th>
                <Th>Action</Th>
                <Th>Entité</Th>
                <Th>Magasin</Th>
                <Th>IP</Th>
              </tr>
            </Thead>
            <Tbody>
              {logs.map((log) => {
                const cfg = ACTION_CONFIG[log.action];
                return (
                  <Tr key={log._id}>
                    <Td className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </Td>
                    <Td>
                      <p className="font-medium text-sm text-gray-900">
                        {log.utilisateur?.prenom}{' '}
                        {log.utilisateur?.nom}
                      </p>
                      <p className="text-xs text-gray-400">
                        {log.utilisateur?.email}
                      </p>
                    </Td>
                    <Td>
                      <span className="text-xs capitalize badge-gray">
                        {log.utilisateur?.role}
                      </span>
                    </Td>
                    <Td>
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        cfg?.color || 'bg-gray-100 text-gray-600'
                      )}>
                        {cfg?.label || log.action}
                      </span>
                    </Td>
                    <Td className="text-sm text-gray-600">
                      {log.entite || '—'}
                    </Td>
                    <Td className="text-sm text-gray-500">
                      {log.magasin?.nom || '—'}
                    </Td>
                    <Td className="text-xs text-gray-400 font-mono">
                      {log.ip || '—'}
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
    </div>
  );
}
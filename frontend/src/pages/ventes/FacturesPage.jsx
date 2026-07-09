import { useState } from 'react';
import {
  Plus, Eye, CreditCard, XCircle,
  Receipt, AlertTriangle
} from 'lucide-react';
import {
  useFactures, useAnnulerFacture, useFacturesImpayees
} from '../../hooks/useVentes';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import FactureForm from './FactureForm';
import FactureDetail from './FactureDetail';
import PaiementForm from './PaiementForm';
import { Table, Thead, Th, Tbody, Tr, Td }
  from '../../components/ui/Table';
import {
  formatMontant, formatDate,
  getStatutBadge, getStatutLabel
} from '../../utils/format';
import { clsx } from 'clsx';
import useAuthStore from '../../store/authStore';

const TYPES    = ['comptoir', 'credit', 'proforma'];
const STATUTS  = ['en_attente', 'partiellement_payee', 'payee'];

export default function FacturesPage() {
  const { user } = useAuthStore();
  const canEdit = ['administrateur', 'gestionnaire', 'caissier']
    .includes(user?.role);

  const [page, setPage]             = useState(1);
  const [typeFiltre, setType]       = useState('');
  const [statutFiltre, setStatut]   = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showPay, setShowPay]       = useState(false);
  const [selected, setSelected]     = useState(null);

  const { data, isLoading } = useFactures({
    type: typeFiltre,
    statut: statutFiltre,
    page,
    limit: 15
  });

  const { data: impayesData } = useFacturesImpayees();
  const annulerMutation = useAnnulerFacture();

  const factures   = data?.data?.factures || [];
  const pagination = data?.data?.pagination;
  const totaux     = data?.data?.totaux || {};
  const impayes    = impayesData?.data?.factures || [];

  return (
    <div>
      <PageHeader
        title="Factures"
        subtitle={`${pagination?.total || 0} facture(s)`}
        actions={canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvelle facture
          </button>
        )}
      />

      {/* Alerte impayés */}
      {impayes.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200
                        dark:bg-red-900/20 dark:border-red-800/50
                        rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0"/>
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {impayes.length} facture(s) impayée(s) —
              Total dû : {formatMontant(
                impayesData?.data?.totalImpaye
              )}
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Total facturé',
            value: formatMontant(totaux.totalTTC),
            color: 'text-blue-600 dark:text-blue-400'
          },
          {
            label: 'Total encaissé',
            value: formatMontant(totaux.totalPaye),
            color: 'text-green-600 dark:text-green-400'
          },
          {
            label: 'Reste à encaisser',
            value: formatMontant(totaux.totalRestant),
            color: 'text-red-600 dark:text-red-400'
          }
        ].map((kpi) => (
          <div key={kpi.label} className="card text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
            <p className={`text-xl font-bold mt-1 ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* 🔥 FILTRES MODIFIÉS */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">

          {/* TYPE */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Type :</span>

            <button
              onClick={() => setType('')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                typeFiltre === ''
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              Tous
            </button>

            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium capitalize',
                  typeFiltre === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* STATUT */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Statut :</span>

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
      </div>

      {/* TABLE */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600
                            border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : factures.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">Aucune facture trouvée</p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Numéro</Th>
                <Th>Type</Th>
                <Th>Client</Th>
                <Th>Magasin</Th>
                <Th className="text-right">Total TTC</Th>
                <Th className="text-right">Payé</Th>
                <Th className="text-right">Restant</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>

            <Tbody>
              {factures.map((f) => (
                <Tr key={f._id}>
                  <Td>
                    <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
                      {f.numero}
                    </span>
                  </Td>

                  <Td>
                    <span className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      f.type === 'comptoir'
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        : f.type === 'credit'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                    )}>
                      {getStatutLabel(f.type)}
                    </span>
                  </Td>

                  <Td>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {f.client?.nom} {f.client?.prenom}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {f.client?.numeroClient}
                    </p>
                  </Td>

                  <Td className="text-sm text-gray-700 dark:text-gray-300">
                    {f.magasin?.nom}
                  </Td>

                  <Td className="text-right font-semibold text-sm text-gray-900 dark:text-white">
                    {formatMontant(f.totalTTC)}
                  </Td>

                  <Td className="text-right text-sm text-green-600 dark:text-green-400 font-medium">
                    {f.montantPaye > 0 ? formatMontant(f.montantPaye) : '—'}
                  </Td>

                  <Td className="text-right text-sm font-medium">
                    <span className={
                      f.montantRestant > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }>
                      {f.montantRestant > 0 ? formatMontant(f.montantRestant) : '—'}
                    </span>
                  </Td>

                  <Td className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(f.createdAt)}
                  </Td>

                  <Td>
                    <span className={getStatutBadge(f.statut)}>
                      {getStatutLabel(f.statut)}
                    </span>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelected(f);
                          setShowDetail(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600
                                   dark:hover:bg-gray-800 dark:text-gray-500 dark:hover:text-primary-400"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canEdit && f.statut !== 'payee' && f.statut !== 'annulee' && (
                        <button
                          onClick={() => {
                            setSelected(f);
                            setShowPay(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600
                                     dark:hover:bg-green-900/30 dark:text-gray-500 dark:hover:text-green-400"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}

                      {canEdit && ['administrateur', 'gestionnaire'].includes(user?.role) && f.statut !== 'annulee' && (
                        <button
                          onClick={() => {
                            if (confirm('Annuler cette facture ?')) {
                              annulerMutation.mutate(f._id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600
                                     dark:hover:bg-red-900/30 dark:text-gray-500 dark:hover:text-red-400"
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

      {/* MODALS inchangés */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouvelle facture" size="xl">
        <FactureForm onSuccess={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Détail facture" size="xl">
        <FactureDetail factureId={selected?._id} />
      </Modal>

      <Modal isOpen={showPay} onClose={() => setShowPay(false)} title="Enregistrer un paiement">
        <PaiementForm facture={selected} onSuccess={() => setShowPay(false)} />
      </Modal>
    </div>
  );
}
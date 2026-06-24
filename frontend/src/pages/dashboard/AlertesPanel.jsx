import { useAlertes } from '../../hooks/useDashboard';
import { formatMontant, formatDate } from '../../utils/format';
import useAuthStore from '../../store/authStore';
import {
  AlertTriangle, Package, Receipt,
  ShoppingCart, ArrowLeftRight
} from 'lucide-react';
import { clsx } from 'clsx';

export default function AlertesPanel() {
  const { magasinActif, user } = useAuthStore();
  const canSee = ['administrateur', 'gestionnaire'].includes(user?.role);

  const { data, isLoading } = useAlertes(
    canSee ? magasinActif?._id : null
  );
  const alertes = data?.data;

  if (!canSee) return null;

  const Section = ({ icon: Icon, title, count, color, children }) => (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        <div className={clsx(
          'w-6 h-6 rounded-lg flex items-center justify-center',
          color
        )}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-700">
          {title}
        </span>
        {count > 0 && (
          <span className="ml-auto text-xs font-bold text-white
                           bg-red-500 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="text-base font-semibold text-gray-900">
          Alertes
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i}
              className="h-12 bg-gray-100 rounded-lg animate-pulse"/>
          ))}
        </div>
      ) : (
        <>
          {/* Stocks faibles */}
          <Section
            icon={Package}
            title="Stocks faibles"
            count={alertes?.resume?.nbStocksFaibles}
            color="bg-red-500"
          >
            {alertes?.stocksFaibles?.length === 0 ? (
              <p className="text-xs text-gray-400 pl-8">Aucune alerte</p>
            ) : (
              <div className="space-y-1.5 pl-8">
                {alertes?.stocksFaibles?.slice(0, 4).map((s) => (
                  <div key={s.article._id}
                    className="flex items-center justify-between
                               text-xs bg-red-50 rounded-lg px-3 py-2">
                    <span className="text-gray-700 truncate font-medium">
                      {s.article.designation}
                    </span>
                    <span className={clsx(
                      'font-bold ml-2 shrink-0',
                      s.rupture ? 'text-red-600' : 'text-orange-600'
                    )}>
                      {s.rupture
                        ? '⚠ Rupture'
                        : `Qté: ${s.stockTotal}`}
                    </span>
                  </div>
                ))}
                {alertes?.stocksFaibles?.length > 4 && (
                  <p className="text-xs text-gray-400 pl-1">
                    +{alertes.stocksFaibles.length - 4} autres...
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* Factures impayées */}
          <Section
            icon={Receipt}
            title="Factures impayées"
            count={alertes?.resume?.nbImpayes}
            color="bg-orange-500"
          >
            {alertes?.impayes?.length === 0 ? (
              <p className="text-xs text-gray-400 pl-8">Aucune impayée</p>
            ) : (
              <div className="space-y-1.5 pl-8">
                {alertes?.impayes?.slice(0, 3).map((f) => (
                  <div key={f._id}
                    className="flex items-center justify-between
                               text-xs bg-orange-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-mono text-primary-600
                                       font-bold">
                        {f.numero}
                      </span>
                      <span className="text-gray-500 ml-1">
                        {f.client?.nom}
                      </span>
                    </div>
                    <span className="font-bold text-orange-600 shrink-0">
                      {formatMontant(f.montantRestant)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Commandes à réceptionner */}
          <Section
            icon={ShoppingCart}
            title="Commandes à réceptionner"
            count={alertes?.resume?.nbCommandesAttente}
            color="bg-blue-500"
          >
            {alertes?.commandesAttente?.length === 0 ? (
              <p className="text-xs text-gray-400 pl-8">Aucune commande</p>
            ) : (
              <div className="space-y-1.5 pl-8">
                {alertes?.commandesAttente?.slice(0, 3).map((c) => (
                  <div key={c._id}
                    className="flex items-center justify-between
                               text-xs bg-blue-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-mono text-primary-600
                                       font-bold">
                        {c.numero}
                      </span>
                      <span className="text-gray-500 ml-1">
                        {c.fournisseur?.raisonSociale}
                      </span>
                    </div>
                    {c.dateLivraisonPrevue && (
                      <span className="text-blue-600 font-medium
                                       shrink-0">
                        {formatDate(c.dateLivraisonPrevue)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Transferts en attente */}
          {alertes?.resume?.nbTransfertsAttente > 0 && (
            <Section
              icon={ArrowLeftRight}
              title="Transferts en attente"
              count={alertes?.resume?.nbTransfertsAttente}
              color="bg-purple-500"
            >
              <div className="space-y-1.5 pl-8">
                {alertes?.transfertsAttente?.slice(0, 3).map((t) => (
                  <div key={t._id}
                    className="flex items-center gap-2
                               text-xs bg-purple-50 rounded-lg px-3 py-2">
                    <span className="font-mono text-primary-600 font-bold">
                      {t.numero}
                    </span>
                    <span className="text-gray-500">
                      {t.magasinSource?.nom} →{' '}
                      {t.magasinDestination?.nom}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
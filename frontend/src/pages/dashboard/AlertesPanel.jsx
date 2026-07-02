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
    <div className="alert-section">

      <div className="flex items-center gap-2 mb-2">

        <div className={clsx("alert-icon", color)}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>

        <span className="alert-section-title">
          {title}
        </span>

        {count > 0 && (
          <span className="alert-count">
            {count}
          </span>
        )}

      </div>

      {children}

    </div>
  );

  return (
    <div className="card">

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">

        <AlertTriangle className="w-5 h-5 text-red-500" />

        <h3 className="alert-title">
          Alertes
        </h3>

      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
            />
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
              <p className="alert-empty">Aucune alerte</p>
            ) : (
              <div className="space-y-1.5 pl-8">

                {alertes?.stocksFaibles?.slice(0, 4).map((s) => (
                  <div
                    key={s.article._id}
                    className="alert-item alert-item-red"
                  >
                    <span className="truncate font-medium">
                      {s.article.designation}
                    </span>

                    <span className={clsx(
                      "font-bold ml-2 shrink-0",
                      s.rupture
                        ? "text-red-600 dark:text-red-400"
                        : "text-orange-600 dark:text-orange-400"
                    )}>
                      {s.rupture
                        ? "⚠ Rupture"
                        : `Qté: ${s.stockTotal}`}
                    </span>
                  </div>
                ))}

              </div>
            )}
          </Section>

          {/* Factures */}
          <Section
            icon={Receipt}
            title="Factures impayées"
            count={alertes?.resume?.nbImpayes}
            color="bg-orange-500"
          >
            {alertes?.impayes?.length === 0 ? (
              <p className="alert-empty">Aucune impayée</p>
            ) : (
              <div className="space-y-1.5 pl-8">

                {alertes?.impayes?.slice(0, 3).map((f) => (
                  <div className="alert-item alert-item-orange" key={f._id}>
                    <div>
                      <span className="font-mono text-primary-600 font-bold">
                        {f.numero}
                      </span>
                      <span className="text-gray-500 ml-1 dark:text-gray-400">
                        {f.client?.nom}
                      </span>
                    </div>

                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {formatMontant(f.montantRestant)}
                    </span>
                  </div>
                ))}

              </div>
            )}
          </Section>

          {/* Commandes */}
          <Section
            icon={ShoppingCart}
            title="Commandes à réceptionner"
            count={alertes?.resume?.nbCommandesAttente}
            color="bg-blue-500"
          >
            {alertes?.commandesAttente?.length === 0 ? (
              <p className="alert-empty">Aucune commande</p>
            ) : (
              <div className="space-y-1.5 pl-8">

                {alertes?.commandesAttente?.slice(0, 3).map((c) => (
                  <div className="alert-item alert-item-blue" key={c._id}>
                    <div>
                      <span className="font-mono text-primary-600 font-bold">
                        {c.numero}
                      </span>
                      <span className="text-gray-500 ml-1 dark:text-gray-400">
                        {c.fournisseur?.raisonSociale}
                      </span>
                    </div>

                    {c.dateLivraisonPrevue && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {formatDate(c.dateLivraisonPrevue)}
                      </span>
                    )}
                  </div>
                ))}

              </div>
            )}
          </Section>

        </>
      )}
    </div>
  );
}
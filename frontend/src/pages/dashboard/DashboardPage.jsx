import {
  TrendingUp, ShoppingCart, AlertTriangle,
  Users, Package, CreditCard,
  Warehouse, Clock
} from 'lucide-react';
import {
  useKpis, useDernieresVentes
} from '../../hooks/useDashboard';
import KpiCard from './KpiCard';
import ChartCA from './ChartCA';
import ChartCategories from './ChartCategories';
import TopProduits from './TopProduits';
import DernieresVentes from './DernieresVentes';
import AlertesPanel from './AlertesPanel';
import { formatMontant } from '../../utils/format';
import useAuthStore from '../../store/authStore';

export default function DashboardPage() {
  const { user, magasinActif } = useAuthStore();
  const magasinId = magasinActif?._id;

  const { data: kpisData, isLoading: kpisLoading } = useKpis(magasinId);
  const kpis = kpisData?.data;

  const now  = new Date();
  const heure = now.getHours();
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bonne après-midi' : 'Bonsoir';
  const note = 'ERP AUTO est une application de gestion et de suivie de stock multi-magasin'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {salut} 👋 {note}  
          </h2>
          <p className="text-gray-500 dark:text-gray-50 mt-1">
            {magasinActif
              ? `Magasin prise en charge: ${magasinActif.nom}`
              : 'Tous les magasins'}

          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm
                        text-gray-400 dark:text-gray-50 bg-gray-50 dark:bg-gray-600 px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4" />
          {now.toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
          })}
        </div>
      </div>

      {/* KPIs Row 1 — CA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Chiffre d'Affaires aujourd'hui"
          value={formatMontant(kpis?.caJour?.total)}
          subtitle={`${kpis?.caJour?.count || 0} facture(s)`}
          icon={TrendingUp}
          color="blue"
          loading={kpisLoading}
        />
        <KpiCard
          title="Chiffre d'Affaires ce mois"
          value={formatMontant(kpis?.caMois?.total)}
          subtitle={`${kpis?.caMois?.count || 0} facture(s)`}
          icon={ShoppingCart}
          color="green"
          evolution={kpis?.caMois?.evolution}
          loading={kpisLoading}
        />
        <KpiCard
          title="Chiffres d'Affaires cette année"
          value={formatMontant(kpis?.caAnnee?.total)}
          icon={CreditCard}
          color="purple"
          loading={kpisLoading}
        />
        <KpiCard
          title="Impayés"
          value={formatMontant(kpis?.impayes?.total)}
          subtitle={`${kpis?.impayes?.count || 0} facture(s)`}
          icon={AlertTriangle}
          color="red"
          loading={kpisLoading}
        />
      </div>

      {/* KPIs Row 2 — Opérationnel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Stocks en alerte"
          value={kpis?.stocksEnAlerte ?? '—'}
          subtitle={`${kpis?.stocksRupture || 0} rupture(s)`}
          icon={Warehouse}
          color="yellow"
          loading={kpisLoading}
        />
        <KpiCard
          title="Nouveaux clients"
          value={kpis?.nouveauxClients ?? '—'}
          subtitle="Ce mois"
          icon={Users}
          color="blue"
          loading={kpisLoading}
        />
        <KpiCard
          title="Commandes en cours"
          value={kpis?.commandesEnCours ?? '—'}
          subtitle="À réceptionner"
          icon={Package}
          color="orange"
          loading={kpisLoading}
        />
        <KpiCard
          title="Transferts en attente"
          value={kpis?.transfertsEnAttente ?? '—'}
          icon={ShoppingCart}
          color="purple"
          loading={kpisLoading}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCA />
        </div>
        <div>
          <ChartCategories />
        </div>
      </div>

      {/* Bas de page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TopProduits />
        </div>
        <div className="lg:col-span-1">
          <DernieresVentes />
        </div>
        <div className="lg:col-span-1">
          <AlertesPanel />
        </div>
      </div>
    </div>
  );
}
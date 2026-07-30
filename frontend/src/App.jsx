import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/guards/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ArticlesPage from './pages/articles/ArticlesPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import StocksPage from './pages/stocks/StocksPage';
import MouvementsPage from './pages/stocks/MouvementsPage';
import TransfertsPage from './pages/stocks/TransfertsPage';
import InventairePage from './pages/stocks/InventairePage';
import ClientsPage from './pages/clients/ClientsPage';
import FournisseursPage from './pages/fournisseurs/FournisseursPage';
import CommandesFournisseurPage from './pages/fournisseurs/CommandesFournisseurPage';
import DevisPage from './pages/ventes/DevisPage';
import FacturesPage from './pages/ventes/FacturesPage';
import AvoirsPage from './pages/ventes/AvoirsPage';
import UtilisateursPage from './pages/admin/UtilisateursPage';
import MagasinsPage from './pages/admin/MagasinsPage';
import RapportsPage from './pages/rapports/RapportsPage';
import AuditPage from './pages/admin/AudtiPage';
import ParametresPage from './pages/admin/ParametresPage';
import useAuthStore from './store/authStore';
import { initStatusBar, initKeyboard } from './utils/nativeSetup';
import { SplashScreen } from '@capacitor/splash-screen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
    const [ready, setReady] = useState(false);
  const init = useAuthStore((s) => s.init);

useEffect(() => {
  Promise.all([
    init(),
    initStatusBar(),
    initKeyboard()
  ]).finally(async () => {
    setReady(true);
    if (Capacitor.isNativePlatform()) {
      await SplashScreen.hide();
    }
  });
}, []);

  if (!ready) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protégé — utilisateur connecté */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

              {/* Routes accessibles à tous les rôles */}
              <Route path="/dashboard"           element={<DashboardPage />} />
              <Route path="/articles"            element={<ArticlesPage />} />
              <Route path="/categories"          element={<CategoriesPage />} />
              <Route path="/stocks"              element={<StocksPage />} />
              <Route path="/mouvements"          element={<MouvementsPage />} />
              <Route path="/transferts"          element={<TransfertsPage />} />
              <Route path="/inventaire"          element={<InventairePage />} />
              <Route path="/clients"             element={<ClientsPage />} />
              <Route path="/fournisseurs"        element={<FournisseursPage />} />
              <Route path="/commandes-fournisseur" element={<CommandesFournisseurPage />} />
              <Route path="/devis"               element={<DevisPage />} />
              <Route path="/factures"            element={<FacturesPage />} />
              <Route path="/avoirs"              element={<AvoirsPage />} />
              <Route path="/rapports"            element={<RapportsPage />} />
              <Route path="/parametres"          element={<ParametresPage />} />

              {/* Routes réservées aux administrateurs */}
              <Route element={<ProtectedRoute roles={['administrateur']} />}>
                <Route path="/utilisateurs" element={<UtilisateursPage />} />
                <Route path="/magasins"     element={<MagasinsPage />} />
                <Route path="/audit"        element={<AuditPage />} />
              </Route>

            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
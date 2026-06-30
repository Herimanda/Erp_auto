import { Menu, Bell, ChevronDown, Store } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import { clsx } from 'clsx';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { useCompteurNotifications } from '../hooks/useNotification';

export default function Topbar({ title }) {
  const { user, magasinActif, setMagasinActif } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const [showMagasins, setShowMagasins] = useState(false);

  const [showNotifs, setShowNotifs] = useState(false);
const { data: compteurData } = useCompteurNotifications();
const nbNonLues = compteurData?.data?.count || 0;

  return (
    <header className="h-16 bg-white border-b border-gray-200
                       flex items-center justify-between px-6
                       shrink-0 z-10">
      {/* Gauche */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Droite */}
      <div className="flex items-center gap-3">
        {/* Sélecteur magasin */}
        {user?.magasins?.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowMagasins(!showMagasins)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                         border border-gray-200 hover:bg-gray-50
                         text-sm font-medium text-gray-700"
            >
              <Store className="w-4 h-4 text-primary-600" />
              <span>{magasinActif?.nom || 'Tous les magasins'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showMagasins && (
              <div className="absolute right-0 top-full mt-1 w-52
                              bg-white border border-gray-200 rounded-xl
                              shadow-lg z-50 py-1">
                {user.magasins.map((mag) => (
                  <button
                    key={mag._id}
                    onClick={() => {
                      setMagasinActif(mag);
                      setShowMagasins(false);
                    }}
                    className={clsx(
                      'w-full text-left px-4 py-2 text-sm',
                      'hover:bg-gray-50 transition-colors',
                      magasinActif?._id === mag._id
                        ? 'text-primary-600 font-medium'
                        : 'text-gray-700'
                    )}
                  >
                    {mag.nom}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
<div className="relative">
  <button
    onClick={() => setShowNotifs(!showNotifs)}
    className="relative p-2 rounded-lg hover:bg-gray-100
               text-gray-500 hover:text-gray-700"
  >
    <Bell className="w-5 h-5" />
    {nbNonLues > 0 && (
      <span className="absolute top-1 right-1 min-w-4 h-4 px-1
                       bg-red-500 rounded-full text-[10px] text-white
                       font-bold flex items-center justify-center">
        {nbNonLues > 9 ? '9+' : nbNonLues}
      </span>
    )}
  </button>
  {showNotifs && (
    <NotificationPanel onClose={() => setShowNotifs(false)} />
  )}
</div>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-3
                        border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary-600
                          flex items-center justify-center
                          text-white text-xs font-bold">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
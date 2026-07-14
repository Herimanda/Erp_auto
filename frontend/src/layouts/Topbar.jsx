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

  const API_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

  return (
    <header
      className="h-16 bg-white dark:bg-gray-900 border-b
                 border-gray-200 dark:border-gray-800
                 flex items-center justify-between
                 px-3 sm:px-6 shrink-0 z-10 gap-2"
    >

      {/* Gauche */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">

        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-1 rounded-lg
                     hover:bg-gray-100 dark:hover:bg-gray-600 shrink-0"
        >
          <Menu className="w-5 h-5 text-gray-500 dark:text-gray-200" />
        </button>


        <h1
          className="text-base sm:text-lg font-semibold
                     text-gray-800 dark:text-gray-100 truncate"
        >
          {title}
        </h1>

      </div>


      {/* Droite */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">


        {/* Sélecteur magasin */}
        {user?.magasins?.length > 1 && (

          <div className="relative">

            <button
              onClick={() => setShowMagasins(!showMagasins)}
              className="flex items-center gap-2
                         px-2.5 sm:px-3 py-1.5
                         rounded-lg border
                         border-gray-200 dark:border-gray-600
                         hover:bg-gray-50 dark:hover:bg-gray-600
                         text-sm font-medium
                         text-gray-700 dark:text-gray-50
                         max-w-48 sm:max-w-[16rem]"
            >

              <Store
                className="w-4 h-4 text-primary-600 shrink-0"
              />


              <span className="truncate block">
                {magasinActif?.nom || 'Tous les magasins'}
              </span>


              <ChevronDown
                className="w-3 h-3 text-gray-400 shrink-0"
              />

            </button>


          {showMagasins && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMagasins(false)}
              />

              <div
                className="absolute right-0 top-full mt-1
                          w-64 max-w-[calc(100vw-1rem)]
                          bg-white dark:bg-gray-800
                          border border-gray-200
                          dark:border-gray-700
                          rounded-xl shadow-lg
                          z-50 py-1"
              >

                {/* NOUVELLE OPTION : Tous les magasins */}
                <button
                  onClick={() => {
                    setMagasinActif(null);
                    setShowMagasins(false);
                  }}
                  className={clsx(
                    'w-full text-left px-4 py-2 text-sm truncate',
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    'transition-colors flex items-center gap-2',
                    !magasinActif
                      ? 'text-primary-600 font-semibold'
                      : 'text-gray-700 dark:text-gray-200'
                  )}
                >
                  <Store className="w-3.5 h-3.5" />
                  Tous les magasins
                </button>

                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                {user.magasins.map((mag) => (
                  <button
                    key={mag._id}
                    onClick={() => {
                      setMagasinActif(mag);
                      setShowMagasins(false);
                    }}
                    className={clsx(
                      'w-full text-left px-4 py-2 text-sm truncate',
                      'hover:bg-gray-50 dark:hover:bg-gray-700',
                      'transition-colors',
                      magasinActif?._id === mag._id
                        ? 'text-primary-600 font-medium'
                        : 'text-gray-700 dark:text-gray-200'
                    )}
                  >
                    {mag.nom}
                  </button>
                ))}

              </div>
            </>
          )}

          </div>

        )}



        {/* Notifications */}

        <div className="relative">

          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg
                       hover:bg-gray-100 dark:hover:bg-gray-600
                       text-gray-500 dark:text-gray-50
                       hover:text-gray-700"
          >

            <Bell className="w-5 h-5" />


            {nbNonLues > 0 && (

              <span
                className="absolute top-1 right-1
                           min-w-4 h-4 px-1
                           bg-red-500 rounded-full
                           text-[10px] text-white
                           font-bold flex items-center justify-center"
              >
                {nbNonLues > 9 ? '9+' : nbNonLues}
              </span>

            )}

          </button>



          {showNotifs && (

            <NotificationPanel
              onClose={() => setShowNotifs(false)}
            />

          )}

        </div>




        {/* Avatar */}

        <div
          className="w-9 h-9 rounded-full
                     bg-primary-600
                     flex items-center justify-center
                     text-white text-sm font-bold
                     overflow-hidden shrink-0
                     border-2 border-white shadow"
        >

          {user?.photo ? (

            <img
              src={`${API_BASE}${user.photo}`}
              alt="Profil"
              className="w-full h-full object-cover"
            />

          ) : (

            <span>
              {user?.prenom?.[0]}
              {user?.nom?.[0]}
            </span>

          )}

        </div>


      </div>

    </header>
  );
}
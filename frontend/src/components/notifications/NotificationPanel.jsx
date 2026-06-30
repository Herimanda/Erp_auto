import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, X,
  Package, Receipt, ArrowLeftRight, ShoppingCart, Info
} from 'lucide-react';
import {
  useNotifications, useCompteurNotifications,
  useMarquerLue, useToutMarquerLu,
  useSupprimerNotification, useViderLues
} from '../../hooks/useNotification';
import { formatDateTime } from '../../utils/format';
import { clsx } from 'clsx';

const ICON_CONFIG = {
  stock_minimum:      { icon: Package,        color: 'bg-red-100 text-red-600'    },
  facture_impayee:    { icon: Receipt,        color: 'bg-orange-100 text-orange-600'},
  nouvelle_commande:  { icon: ShoppingCart,   color: 'bg-blue-100 text-blue-600'  },
  transfert_attente:  { icon: ArrowLeftRight, color: 'bg-purple-100 text-purple-600'},
  transfert_recu:     { icon: ArrowLeftRight, color: 'bg-green-100 text-green-600' },
  commande_recue:     { icon: ShoppingCart,   color: 'bg-green-100 text-green-600' },
  systeme:            { icon: Info,           color: 'bg-gray-100 text-gray-600'  },
};

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState('toutes'); // toutes | non-lues

  const { data, isLoading } = useNotifications({
    lu: filtre === 'non-lues' ? false : undefined,
    limit: 30
  });
  const marquerLueMutation    = useMarquerLue();
  const toutLireMutation      = useToutMarquerLu();
  const supprimerMutation     = useSupprimerNotification();
  const viderLuesMutation     = useViderLues();

  const notifications = data?.data?.notifications || [];
  const nonLues       = data?.data?.nonLues || 0;

  const handleClick = (notif) => {
    if (!notif.lu) marquerLueMutation.mutate(notif._id);
    if (notif.lien) {
      navigate(notif.lien);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white
                    border border-gray-200 rounded-2xl shadow-2xl
                    z-50 overflow-hidden flex flex-col max-h-[32rem]">
      {/* Header */}
      <div className="flex items-center justify-between p-4
                      border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {nonLues > 0 && (
            <span className="text-xs font-bold text-white bg-red-500
                             px-1.5 py-0.5 rounded-full">
              {nonLues}
            </span>
          )}
        </div>
        <button onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filtres + actions */}
      <div className="flex items-center justify-between px-4 py-2
                      border-b border-gray-100 bg-gray-50">
        <div className="flex gap-1">
          {['toutes', 'non-lues'].map((f) => (
            <button key={f}
              onClick={() => setFiltre(f)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-medium capitalize',
                filtre === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              )}
            >
              {f === 'toutes' ? 'Toutes' : 'Non lues'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {nonLues > 0 && (
            <button
              onClick={() => toutLireMutation.mutate()}
              className="text-xs text-primary-600 hover:text-primary-700
                         flex items-center gap-1 font-medium"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Tout lire
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-3 border-primary-600
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          notifications.map((n) => {
            const cfg = ICON_CONFIG[n.type] || ICON_CONFIG.systeme;
            const Icon = cfg.icon;
            return (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={clsx(
                  'flex gap-3 p-4 border-b border-gray-50 cursor-pointer',
                  'hover:bg-gray-50 transition-colors group',
                  !n.lu && 'bg-blue-50/50'
                )}
              >
                <div className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center',
                  'flex-shrink-0', cfg.color
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={clsx(
                      'text-sm leading-snug',
                      !n.lu ? 'font-semibold text-gray-900'
                            : 'font-medium text-gray-700'
                    )}>
                      {n.titre}
                    </p>
                    {!n.lu && (
                      <span className="w-2 h-2 bg-primary-600 rounded-full
                                       flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-gray-400">
                      {formatDateTime(n.createdAt)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerMutation.mutate(n._id);
                      }}
                      className="opacity-0 group-hover:opacity-100
                                 text-gray-300 hover:text-red-500
                                 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.some((n) => n.lu) && (
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => viderLuesMutation.mutate()}
            className="w-full text-center text-xs text-gray-400
                       hover:text-red-500 py-1.5 transition-colors"
          >
            Effacer les notifications lues
          </button>
        </div>
      )}
    </div>
  );
}
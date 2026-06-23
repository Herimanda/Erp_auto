import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { clsx } from 'clsx';
import useAuthStore from '../store/authStore';
import useUiStore from '../store/uiStore';
import { navigation } from '../config/navigation';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleCollapse } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté avec succès.');
    navigate('/login');
  };

  const canAccess = (roles) =>
    user && roles.includes(user.role);

  return (
    <aside className={clsx(
      'flex flex-col h-screen bg-sidebar text-white',
      'transition-all duration-300 ease-in-out shrink-0',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b
                      border-white/10 h-16">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg
                            flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ERP Auto</span>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-white/10
                     transition-colors ml-auto"
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navigation.map((section) => {
          const itemsAccessibles = section.items.filter(
            item => canAccess(item.roles)
          );
          if (itemsAccessibles.length === 0) return null;

          return (
            <div key={section.section} className="mb-4">
              {/* Section label */}
              {!sidebarCollapsed && (
                <p className="text-xs font-semibold text-white/40
                              uppercase tracking-wider px-3 mb-1">
                  {section.section}
                </p>
              )}

              {/* Items */}
              {itemsAccessibles.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-colors duration-150 text-sm font-medium',
                    sidebarCollapsed && 'justify-center',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer — profil & logout */}
      <div className="p-3 border-t border-white/10">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="w-8 h-8 rounded-full bg-primary-600
                            flex items-center justify-center text-xs
                            font-bold shrink-0">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-white/50 capitalize truncate">
                {user?.role}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-600
                            flex items-center justify-center text-xs font-bold">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
            'text-white/70 hover:bg-red-600/20 hover:text-red-400',
            'transition-colors text-sm',
            sidebarCollapsed && 'justify-center'
          )}
          title={sidebarCollapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!sidebarCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
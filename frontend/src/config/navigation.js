import {
  LayoutDashboard, Package, Warehouse, Users, Truck,
  FileText, ShoppingCart, BarChart3, Settings,
  ArrowLeftRight, ClipboardList, Receipt, FileMinus,
  Building2, UserCog, History, Shield
} from 'lucide-react';

export const navigation = [
  {
    section: 'Principal',
    items: [
      {
        label: 'Tableau de bord',
        icon: LayoutDashboard,
        path: '/dashboard',
        roles: ['administrateur', 'gestionnaire', 'caissier', 'magasinier']
      }
    ]
  },
  {
    section: 'Catalogue',
    items: [
      {
        label: 'Articles',
        icon: Package,
        path: '/articles',
        roles: ['administrateur', 'gestionnaire', 'caissier', 'magasinier']
      },
      {
        label: 'Catégories',
        icon: ClipboardList,
        path: '/categories',
        roles: ['administrateur', 'gestionnaire']
      }
    ]
  },
  {
    section: 'Stocks',
    items: [
      {
        label: 'État des stocks',
        icon: Warehouse,
        path: '/stocks',
        roles: ['administrateur', 'gestionnaire', 'magasinier']
      },
      {
        label: 'Mouvements',
        icon: History,
        path: '/mouvements',
        roles: ['administrateur', 'gestionnaire', 'magasinier']
      },
      {
        label: 'Transferts',
        icon: ArrowLeftRight,
        path: '/transferts',
        roles: ['administrateur', 'gestionnaire', 'magasinier']
      },
      {
        label: 'Inventaire',
        icon: ClipboardList,
        path: '/inventaire',
        roles: ['administrateur', 'gestionnaire', 'magasinier']
      }
    ]
  },
  {
    section: 'Ventes',
    items: [
      {
        label: 'Devis',
        icon: FileText,
        path: '/devis',
        roles: ['administrateur', 'gestionnaire', 'caissier']
      },
      {
        label: 'Factures',
        icon: Receipt,
        path: '/factures',
        roles: ['administrateur', 'gestionnaire', 'caissier']
      },
      {
        label: 'Avoirs',
        icon: FileMinus,
        path: '/avoirs',
        roles: ['administrateur', 'gestionnaire', 'caissier']
      }
    ]
  },
  {
    section: 'Achats',
    items: [
      {
        label: 'Fournisseurs',
        icon: Truck,
        path: '/fournisseurs',
        roles: ['administrateur', 'gestionnaire']
      },
      {
        label: 'Commandes',
        icon: ShoppingCart,
        path: '/commandes-fournisseur',
        roles: ['administrateur', 'gestionnaire']
      }
    ]
  },
  {
    section: 'Tiers',
    items: [
      {
        label: 'Clients',
        icon: Users,
        path: '/clients',
        roles: ['administrateur', 'gestionnaire', 'caissier']
      }
    ]
  },
  {
    section: 'Administration',
    items: [
      {
        label: 'Rapports',
        icon: BarChart3,
        path: '/rapports',
        roles: ['administrateur', 'gestionnaire']
      },
      {
        label: 'Journal d\'audit',
        icon:  Shield,
        path:  '/audit',
        roles: ['administrateur']
      },
      {
        label: 'Magasins',
        icon: Building2,
        path: '/magasins',
        roles: ['administrateur']
      },
      {
        label: 'Utilisateurs',
        icon: UserCog,
        path: '/utilisateurs',
        roles: ['administrateur']
      },
      {
        label: 'Paramètres',
        icon: Settings,
        path: '/parametres',
        roles: ['administrateur']
      }
    ]
  }
];
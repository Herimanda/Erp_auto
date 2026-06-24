import { useState } from 'react';
import { Download, FileText, Table, Filter } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const downloadRapport = async (url, filename) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erreur génération rapport');
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Rapport téléchargé !');
  } catch (err) {
    toast.error(err.message);
  }
};

const RapportCard = ({
  title, description, icon: Icon,
  color, onPDF, onExcel, filters
}) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm
                     hover:shadow-md transition-shadow ${colors[color]}`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center
                         justify-center flex-shrink-0 ${
          color === 'blue'   ? 'bg-blue-100'   :
          color === 'green'  ? 'bg-green-100'  :
          color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      {filters && (
        <div className="mb-4">{filters}</div>
      )}

      <div className="flex gap-2">
        {onPDF && (
          <button onClick={onPDF}
            className="flex-1 flex items-center justify-center gap-2
                       py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700
                       rounded-lg text-sm font-medium transition-colors">
            <FileText className="w-4 h-4" />
            PDF
          </button>
        )}
        {onExcel && (
          <button onClick={onExcel}
            className="flex-1 flex items-center justify-center gap-2
                       py-2 px-3 bg-green-50 hover:bg-green-100
                       text-green-700 rounded-lg text-sm font-medium
                       transition-colors">
            <Table className="w-4 h-4" />
            Excel
          </button>
        )}
      </div>
    </div>
  );
};

export default function RapportsPage() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin,   setDateFin]   = useState('');
  const [magasin,   setMagasin]   = useState('');

  const { data: magasinsData } = useQuery({
    queryKey: ['magasins'],
    queryFn:  () => api.get('/magasins')
  });
  const magasins = magasinsData?.data || [];

  const params = (extra = {}) => {
    const p = new URLSearchParams();
    if (dateDebut) p.append('dateDebut', dateDebut);
    if (dateFin)   p.append('dateFin',   dateFin);
    if (magasin)   p.append('magasin',   magasin);
    Object.entries(extra).forEach(([k, v]) => v && p.append(k, v));
    return p.toString() ? '?' + p.toString() : '';
  };

  const FiltrePeriode = () => (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <label className="label text-xs">Du</label>
        <input type="date" value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          className="input-field text-xs" />
      </div>
      <div>
        <label className="label text-xs">Au</label>
        <input type="date" value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          className="input-field text-xs" />
      </div>
      <div>
        <label className="label text-xs">Magasin</label>
        <select value={magasin}
          onChange={(e) => setMagasin(e.target.value)}
          className="input-field text-xs">
          <option value="">Tous</option>
          {magasins.map((m) => (
            <option key={m._id} value={m._id}>{m.nom}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Rapports"
        subtitle="Exportez vos données en PDF ou Excel"
      />

      {/* Filtres globaux */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">
            Filtres globaux
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Date début</label>
            <input type="date" value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="input-field" />
          </div>
          <div>
            <label className="label">Date fin</label>
            <input type="date" value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="input-field" />
          </div>
          <div>
            <label className="label">Magasin</label>
            <select value={magasin}
              onChange={(e) => setMagasin(e.target.value)}
              className="input-field">
              <option value="">Tous les magasins</option>
              {magasins.map((m) => (
                <option key={m._id} value={m._id}>{m.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rapports */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Ventes */}
        <RapportCard
          title="Rapport des ventes"
          description="Toutes les factures avec totaux et paiements"
          icon={FileText}
          color="blue"
          onPDF={() => downloadRapport(
            `/rapports/ventes/pdf${params()}`,
            `rapport-ventes-${Date.now()}.pdf`
          )}
          onExcel={() => downloadRapport(
            `/rapports/ventes/excel${params()}`,
            `rapport-ventes-${Date.now()}.xlsx`
          )}
        />

        {/* Stocks */}
        <RapportCard
          title="Rapport des stocks"
          description="État détaillé du stock par article et magasin"
          icon={Download}
          color="green"
          onPDF={() => downloadRapport(
            `/rapports/stocks/pdf${params()}`,
            `rapport-stocks-${Date.now()}.pdf`
          )}
          onExcel={() => downloadRapport(
            `/rapports/stocks/excel${params()}`,
            `rapport-stocks-${Date.now()}.xlsx`
          )}
        />

        {/* Clients */}
        <RapportCard
          title="Rapport clients"
          description="Liste complète des clients avec soldes"
          icon={Table}
          color="purple"
          onExcel={() => downloadRapport(
            `/rapports/clients/excel`,
            `rapport-clients-${Date.now()}.xlsx`
          )}
        />

      </div>
    </div>
  );
}
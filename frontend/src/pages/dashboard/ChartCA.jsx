import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useCaJournalier, useCaMensuel } from '../../hooks/useDashboard';
import useAuthStore from '../../store/authStore';
import { clsx } from 'clsx';

const formatAr = (v) =>
  v >= 1000000
    ? (v / 1000000).toFixed(1) + 'M'
    : v >= 1000
      ? (v / 1000).toFixed(0) + 'k'
      : v;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl
                    shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}
          className="font-medium">
          {p.name} : {new Intl.NumberFormat('fr-MG').format(p.value)} Ar
        </p>
      ))}
    </div>
  );
};

export default function ChartCA() {
  const { magasinActif } = useAuthStore();
  const magasinId = magasinActif?._id;
  const [vue, setVue] = useState('mensuel');

  const { data: joursData, isLoading: loadJ } =
    useCaJournalier(magasinId);
  const { data: moisData, isLoading: loadM } =
    useCaMensuel(magasinId);

  const donneesJours = joursData?.data || [];
  const donneesMois  = moisData?.data  || [];
  const donnees = vue === 'journalier' ? donneesJours : donneesMois;
  const xKey    = vue === 'journalier' ? 'date' : 'mois';
  const isLoading = vue === 'journalier' ? loadJ : loadM;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Chiffre d'affaires
          </h3>
          <p className="text-sm text-gray-500">
            {vue === 'journalier' ? '30 derniers jours' : '12 derniers mois'}
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['journalier', 'mensuel'].map((v) => (
            <button key={v}
              onClick={() => setVue(v)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium capitalize',
                'transition-colors',
                vue === v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {v === 'journalier' ? '30 jours' : '12 mois'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-600
                          border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          {vue === 'mensuel' ? (
            <BarChart data={donnees} barSize={28}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatAr} tick={{ fontSize: 11 }}
                axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="totalTTC" name="Facturé"
                fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="totalPaye" name="Encaissé"
                fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          ) : (
            <AreaChart data={donnees}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatAr} tick={{ fontSize: 11 }}
                axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="totalTTC" name="Facturé"
                stroke="#3b82f6" strokeWidth={2}
                fill="url(#colorCA)" />
              <Area type="monotone" dataKey="totalPaye" name="Encaissé"
                stroke="#22c55e" strokeWidth={2} fill="transparent" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
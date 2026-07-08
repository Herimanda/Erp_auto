import {
  PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useCaCategories } from '../../hooks/useDashboard';
import useAuthStore from '../../store/authStore';

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
];

const formatAr = (v) =>
  new Intl.NumberFormat('fr-MG').format(v) + ' Ar';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200
                    dark:border-gray-700 rounded-xl
                    shadow-lg p-3 text-sm">
      <p className="font-semibold" style={{ color: payload[0].payload.fill }}>
        {payload[0].name}
      </p>
      <p className="text-gray-700 dark:text-gray-300">{formatAr(payload[0].value)}</p>
    </div>
  );
};

export default function ChartCategories() {
  const { magasinActif } = useAuthStore();
  const { data, isLoading } = useCaCategories(magasinActif?._id);
  const donnees = (data?.data || []).filter((d) => d.total > 0);

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Chiffre d'Affaires par catégorie
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ce mois</p>
      </div>

      {isLoading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-600
                          border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : donnees.length === 0 ? (
        <div className="h-52 flex items-center justify-center
                        text-gray-400 dark:text-gray-500 text-sm">
          Aucune donnée ce mois
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={donnees}
              dataKey="total"
              nameKey="nom"
              cx="50%" cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {donnees.map((_, i) => (
                <Cell key={i}
                  fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) =>
                value?.length > 15
                  ? value.substring(0, 15) + '…'
                  : value}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
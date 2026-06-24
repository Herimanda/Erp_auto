import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useClients } from '../../hooks/useClients';

export default function ClientSelect({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);

  const { data } = useClients({
    search, limit: 8
  });
  const clients = data?.data?.clients || [];

  const selected = value;

  return (
    <div className="relative">
      {selected ? (
        <div className="flex items-center justify-between p-3
                        bg-primary-50 border border-primary-200
                        rounded-lg">
          <div>
            <p className="font-medium text-primary-800 text-sm">
              {selected.nom} {selected.prenom}
            </p>
            <p className="text-xs text-primary-600">
              {selected.numeroClient}
              {selected.societe && ` — ${selected.societe}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-primary-400 hover:text-primary-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Rechercher un client..."
              className="input-field pl-9"
            />
          </div>

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1
                            bg-white border border-gray-200 rounded-xl
                            shadow-xl z-50 overflow-hidden">
              {clients.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aucun client trouvé
                </p>
              ) : (
                clients.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="w-full text-left px-4 py-3
                               hover:bg-gray-50 border-b border-gray-100
                               last:border-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {c.nom} {c.prenom}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.numeroClient}
                      {c.societe && ` — ${c.societe}`}
                      {c.telephone && ` — ${c.telephone}`}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
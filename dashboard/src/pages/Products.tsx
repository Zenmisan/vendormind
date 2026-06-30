import { useState, useEffect } from 'react';
import { Search, Upload, Package, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const VENDOR_ID = '1';

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
  reservedStock: number;
  description: string | null;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/health`);
      if (res.ok) setProducts([]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadCatalog = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/catalog`, { method: 'POST', body: fd });
      const data = await res.json();
      alert(`${data.count} products ingested. Embedding jobs queued.`);
      load();
    } catch {
      alert('Upload failed. Check the server logs.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleSort = (field: keyof Product) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: keyof Product }) => {
    if (sortField !== field) return <ChevronDown size={11} color="var(--text-3)" />;
    return sortAsc
      ? <ChevronUp size={11} color="var(--text-2)" />
      : <ChevronDown size={11} color="var(--text-2)" />;
  };

  const filtered = products
    .filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="products" />

      <main style={{ flex: 1, padding: '2rem 2.5rem' }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>
              Products
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              {products.length} products in catalog
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button className="btn-ghost" onClick={load}>
              <RefreshCw size={13} />
              Refresh
            </button>
            <label className="btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              <Upload size={13} />
              {uploading ? 'Uploading...' : 'Upload Catalog'}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={uploadCatalog} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="animate-fade-up-1" style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products by name or description..."
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Table */}
        <div className="card animate-fade-up-2" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Package size={22} color="var(--text-3)" />
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 0.25rem', color: 'var(--text-2)' }}>No products yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: 0 }}>Upload a catalog to get started</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {[
                    { key: 'name',  label: 'Product' },
                    { key: 'price', label: 'Price' },
                    { key: 'stock', label: 'Stock' },
                    { key: 'reservedStock', label: 'Reserved' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key as keyof Product)}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        {col.label}
                        <SortIcon field={col.key as keyof Product} />
                      </span>
                    </th>
                  ))}
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const available = p.stock - p.reservedStock;
                  return (
                    <tr key={p.id}>
                      <td>
                        <p style={{ fontWeight: 500, margin: 0 }}>{p.name}</p>
                        {p.description && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '0.15rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                            {p.description}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="mono" style={{ fontWeight: 600 }}>₦{Number(p.price).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="mono" style={{ color: 'var(--text-2)' }}>{p.stock}</span>
                      </td>
                      <td>
                        <span className="mono" style={{ color: '#f59e0b' }}>{p.reservedStock}</span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: available > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
                          color: available > 0 ? '#15803d' : '#ef4444',
                        }}>
                          {available}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

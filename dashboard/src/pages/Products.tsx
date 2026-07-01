import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, FileSpreadsheet,
  Package, RefreshCw, Search, Upload,
} from 'lucide-react';
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

const sampleProducts: Product[] = [
  { id: 'sample-1', name: 'Party Jollof Rice', price: '2500', stock: 42, reservedStock: 4, description: 'Smoky party jollof packed per plate' },
  { id: 'sample-2', name: 'Small Chops Combo', price: '3000', stock: 18, reservedStock: 2, description: 'Spring rolls, samosa, puff-puff, and chicken' },
  { id: 'sample-3', name: 'Chapman Bottle', price: '1200', stock: 31, reservedStock: 0, description: 'Chilled 50cl house chapman' },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

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
      setLastUpload(`${data.count ?? 'New'} products queued for indexing`);
      load();
    } catch {
      setLastUpload('Upload failed. Check the server logs.');
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
    return sortAsc ? <ChevronUp size={11} color="var(--text-2)" /> : <ChevronDown size={11} color="var(--text-2)" />;
  };

  const displayProducts = products.length ? products : sampleProducts;
  const usingSamples = products.length === 0;
  const filtered = displayProducts
    .filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const totalStock = displayProducts.reduce((sum, p) => sum + p.stock, 0);
  const reserved = displayProducts.reduce((sum, p) => sum + p.reservedStock, 0);
  const lowStock = displayProducts.filter(p => p.stock - p.reservedStock <= 5).length;

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="products" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem' }}>
        <div className="page-header animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              Catalog
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              Products your AI agent can recommend, sell, and reserve.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={load}>
              <RefreshCw size={13} />
              Refresh
            </button>
            <label className="btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              <Upload size={13} />
              {uploading ? 'Uploading...' : 'Upload catalog'}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={uploadCatalog} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="stat-grid animate-fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Catalog items', value: displayProducts.length, Icon: Package, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
            { label: 'Total stock', value: totalStock, Icon: FileSpreadsheet, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            { label: 'Reserved', value: reserved, Icon: CheckCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Low stock', value: lowStock, Icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-icon" style={{ background: s.bg }}>
                <s.Icon size={17} color={s.color} />
              </div>
              <div className="stat-card-value mono">{loading ? '...' : s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        <section className="card animate-fade-up-2" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          <div className="catalog-toolbar">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products by name or description..." style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div className="badge" style={{ background: usingSamples ? 'rgba(245,158,11,0.1)' : 'rgba(22,163,74,0.1)', color: usingSamples ? '#d97706' : '#16a34a' }}>
              {usingSamples ? 'Showing sample catalog' : 'Live catalog'}
            </div>
          </div>
          {lastUpload && <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--text-2)' }}>{lastUpload}</p>}
        </section>

        <div className="card animate-fade-up-3" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '2rem 1.5rem', display: 'grid', gap: '0.75rem' }}>
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={22} color="var(--text-3)" /></div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.25rem', color: 'var(--text-2)' }}>No products match this search</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: 0 }}>Try another product name or upload a fresh catalog.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      { key: 'name', label: 'Product' },
                      { key: 'price', label: 'Price' },
                      { key: 'stock', label: 'Stock' },
                      { key: 'reservedStock', label: 'Reserved' },
                    ].map(col => (
                      <th key={col.key} onClick={() => toggleSort(col.key as keyof Product)} style={{ cursor: 'pointer', userSelect: 'none' }}>
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
                          <p style={{ fontWeight: 700, margin: 0 }}>{p.name}</p>
                          {p.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '0.15rem 0 0', maxWidth: 320 }}>{p.description}</p>}
                        </td>
                        <td><span className="mono" style={{ fontWeight: 800 }}>₦{Number(p.price).toLocaleString()}</span></td>
                        <td><span className="mono" style={{ color: 'var(--text-2)' }}>{p.stock}</span></td>
                        <td><span className="mono" style={{ color: '#f59e0b' }}>{p.reservedStock}</span></td>
                        <td>
                          <span className="badge" style={{ background: available > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)', color: available > 0 ? '#15803d' : '#ef4444' }}>
                            {available}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

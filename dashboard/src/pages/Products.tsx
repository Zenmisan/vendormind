import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, FileSpreadsheet,
  Package, RefreshCw, Search, Upload, Plus, Edit, Trash2, X, Loader2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
  reservedStock: number;
  description: string | null;
  isEmbedded?: boolean;
  createdAt?: string;
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

  // CRUD Modals State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');

  const getVendorId = () => localStorage.getItem('vendorId') ?? '1';

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/vendors/${getVendorId()}/products`);
      if (!res.ok) { console.error('Products fetch failed:', res.status); setProducts([]); return; }
      const data = await res.json() as { products?: Product[] };
      setProducts(data.products ?? []);
    } catch (err) {
      console.error('Products fetch error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const uploadCatalog = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const res = await fetch(`${API}/vendors/${getVendorId()}/catalog`, { method: 'POST', body: fd });
      const data = await res.json() as { count?: number };
      setLastUpload(`${data.count ?? 'New'} products queued for indexing`);
      load();
    } catch {
      setLastUpload('Upload failed. Check the server logs.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch(`${API}/vendors/${getVendorId()}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), stock: Number(stock), description }),
      });
      if (res.ok) {
        setIsAddOpen(false);
        resetForm();
        load();
      } else {
        const data = await res.json() as any;
        alert(data.error || 'Failed to add product');
      }
    } catch (err: any) {
      console.error('Add failed:', err);
      alert('Network error adding product: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormLoading(true);
    try {
      const isSample = editingProduct.id.startsWith('sample-');
      const url = isSample
        ? `${API}/vendors/${getVendorId()}/products`
        : `${API}/vendors/${getVendorId()}/products/${editingProduct.id}`;
      const method = isSample ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), stock: Number(stock), description }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        setEditingProduct(null);
        resetForm();
        await load();
      } else {
        const data = await res.json() as any;
        alert(data.error || 'Failed to update product');
      }
    } catch (err: any) {
      console.error('Edit failed:', err);
      alert('Network error updating product: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const isSample = productId.startsWith('sample-');
      if (isSample) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        return;
      }
      const res = await fetch(`${API}/vendors/${getVendorId()}/products/${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        load();
      } else {
        const data = await res.json() as any;
        alert(data.error || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert('Network error deleting product: ' + err.message);
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price);
    setStock(String(p.stock));
    setDescription(p.description || '');
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setStock('');
    setDescription('');
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
        {/* Header */}
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
            <button className="btn-ghost" onClick={() => { resetForm(); setIsAddOpen(true); }}>
              <Plus size={13} />
              Add Product
            </button>
            <label className="btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              <Upload size={13} />
              {uploading ? 'Uploading...' : 'Upload Excel'}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={uploadCatalog} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid animate-fade-up-1" style={{ marginBottom: '1.25rem' }}>
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

        {/* Toolbar */}
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

        {/* Table list */}
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
                    <th>Embed Index</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const available = p.stock - p.reservedStock;
                    // Derive embedding status: if using samples it is demo, otherwise read isEmbedded
                    const isEmbedded = usingSamples ? false : !!p.isEmbedded;

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
                        <td>
                          {isEmbedded ? (
                            <span className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)' }}>
                              ● Embedded
                            </span>
                          ) : usingSamples ? (
                            <span className="badge" style={{ background: 'rgba(100,116,139,0.08)', color: 'var(--text-3)' }}>
                              ● Demo static
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706' }}>
                              ● Indexing
                            </span>
                          )}
                        </td>
                        <td>
                          {!usingSamples ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn-ghost" onClick={() => openEdit(p)} style={{ padding: '0.4rem' }}>
                                <Edit size={13} />
                              </button>
                              <button className="btn-ghost" onClick={() => handleDelete(p.id)} style={{ padding: '0.4rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)' }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Locked (Sample)</span>
                          )}
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

      {/* ── Add Product Modal ────────────────────────────────────── */}
      {isAddOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(13,17,23,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card-raised animate-fade-up" style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Add New Product</h2>
              <button className="btn-ghost" onClick={() => setIsAddOpen(false)} style={{ padding: '0.4rem', border: 'none' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                Product Name
                <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Party Jollof Rice" />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                  Price (₦)
                  <input className="input" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} required placeholder="2500" />
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                  Stock Quantity
                  <input className="input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} required placeholder="50" />
                </label>
              </div>
              <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                Description
                <textarea className="input" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Product description for semantic search indexing..." />
              </label>
              <button type="submit" className="btn-primary" disabled={formLoading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
                {formLoading ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Plus size={14} />}
                {formLoading ? 'Creating Product...' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ───────────────────────────────────── */}
      {isEditOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(13,17,23,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card-raised animate-fade-up" style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Edit Product</h2>
              <button className="btn-ghost" onClick={() => { setIsEditOpen(false); setEditingProduct(null); }} style={{ padding: '0.4rem', border: 'none' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleEdit} style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                Product Name
                <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Party Jollof Rice" />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                  Price (₦)
                  <input className="input" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} required placeholder="2500" />
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                  Stock Quantity
                  <input className="input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} required placeholder="50" />
                </label>
              </div>
              <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                Description
                <textarea className="input" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Product description for semantic search indexing..." />
              </label>
              <button type="submit" className="btn-primary" disabled={formLoading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
                {formLoading ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <CheckCircle size={14} />}
                {formLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

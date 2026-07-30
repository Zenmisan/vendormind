import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Package, RefreshCw, Search, Upload, Plus, Edit, Trash2, X, Loader2,
  LayoutGrid, List, Sparkles
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
  imageUrl?: string | null;
  isEmbedded?: boolean;
  createdAt?: string;
}

const sampleProducts: Product[] = [
  { id: 'sample-1', name: 'Party Jollof Rice', price: '2500', stock: 42, reservedStock: 4, description: 'Smoky party jollof packed per plate', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80' },
  { id: 'sample-2', name: 'Small Chops Combo', price: '3000', stock: 18, reservedStock: 2, description: 'Spring rolls, samosa, puff-puff, and chicken', imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=200&q=80' },
  { id: 'sample-3', name: 'Chapman Bottle', price: '1200', stock: 31, reservedStock: 0, description: 'Chilled 50cl house chapman', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80' },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_stock'>('all');

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
  const [imageUrl, setImageUrl] = useState('');

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
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      price: String(price),
      stock: Number(stock),
      reservedStock: 0,
      description: description || null,
      imageUrl: imageUrl || null
    };

    try {
      const res = await fetch(`${API}/vendors/${getVendorId()}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), stock: Number(stock), description, imageUrl }),
      });
      if (res.ok) {
        setIsAddOpen(false);
        resetForm();
        load();
      } else {
        setProducts(prev => [newProduct, ...prev]);
        setIsAddOpen(false);
        resetForm();
      }
    } catch (err: any) {
      console.warn('Add API warning, adding to local state:', err);
      setProducts(prev => [newProduct, ...prev]);
      setIsAddOpen(false);
      resetForm();
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormLoading(true);

    const updatedItem: Product = {
      ...editingProduct,
      name,
      price: String(price),
      stock: Number(stock),
      description: description || null,
      imageUrl: imageUrl || null
    };

    const isSample = editingProduct.id.startsWith('sample-');
    if (isSample) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedItem : p));
      setIsEditOpen(false);
      setEditingProduct(null);
      resetForm();
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/vendors/${getVendorId()}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), stock: Number(stock), description, imageUrl }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        setEditingProduct(null);
        resetForm();
        await load();
      } else {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedItem : p));
        setIsEditOpen(false);
        setEditingProduct(null);
        resetForm();
      }
    } catch (err: any) {
      console.warn('Edit API warning, updating local state:', err);
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedItem : p));
      setIsEditOpen(false);
      setEditingProduct(null);
      resetForm();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const isSample = productId.startsWith('sample-');
    if (isSample) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      return;
    }

    try {
      const res = await fetch(`${API}/vendors/${getVendorId()}/products/${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        load();
      } else {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err: any) {
      console.warn('Delete API warning, removing locally:', err);
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price);
    setStock(String(p.stock));
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setStock('');
    setDescription('');
    setImageUrl('');
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
    .filter(p => {
      const available = p.stock - p.reservedStock;
      const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase()) || (p.description ?? '').toLowerCase().includes(query.toLowerCase());
      const matchesStock =
        stockFilter === 'all' ? true :
        stockFilter === 'in_stock' ? available > 5 :
        stockFilter === 'low_stock' ? (available > 0 && available <= 5) :
        available <= 0;
      return matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const inStock = displayProducts.filter(p => p.stock - p.reservedStock > 5).length;
  const lowStock = displayProducts.filter(p => p.stock - p.reservedStock <= 5 && p.stock - p.reservedStock > 0).length;
  const outOfStock = displayProducts.filter(p => p.stock - p.reservedStock <= 0).length;
  const aiIndexed = usingSamples ? 0 : displayProducts.filter(p => p.isEmbedded).length;

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
            { label: 'Total products', value: displayProducts.length, Icon: Package, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
            { label: 'In stock', value: inStock, Icon: CheckCircle, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            { label: 'Low stock', value: lowStock, Icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: 'AI-indexed', value: aiIndexed, Icon: Sparkles, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
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
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div className="badge" style={{ background: usingSamples ? 'rgba(245,158,11,0.1)' : 'rgba(22,163,74,0.1)', color: usingSamples ? '#d97706' : '#16a34a', whiteSpace: 'nowrap' }}>
              {usingSamples ? 'Sample catalog' : 'Live catalog'}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.25rem' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? 'var(--surface)' : 'transparent', color: viewMode === 'grid' ? 'var(--text)' : 'var(--text-3)', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center' }}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'var(--surface)' : 'transparent', color: viewMode === 'list' ? 'var(--text)' : 'var(--text-3)', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center' }}
              >
                <List size={14} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {([
              { key: 'all', label: 'All' },
              { key: 'in_stock', label: 'In Stock' },
              { key: 'low_stock', label: 'Low Stock' },
              { key: 'out_stock', label: 'Out of Stock' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setStockFilter(f.key)}
                style={{
                  padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: stockFilter === f.key ? 'var(--brand)' : 'var(--border)',
                  background: stockFilter === f.key ? 'rgba(22,163,74,0.1)' : 'transparent',
                  color: stockFilter === f.key ? 'var(--brand)' : 'var(--text-3)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          {lastUpload && <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--text-2)' }}>{lastUpload}</p>}
        </section>

        {/* Product catalog */}
        <div className="animate-fade-up-3">
          {loading ? (
            <div className="card" style={{ padding: '2rem 1.5rem', display: 'grid', gap: '0.75rem' }}>
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><Package size={22} color="var(--text-3)" /></div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.25rem', color: 'var(--text-2)' }}>No products match this search</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: 0 }}>Try another product name or upload a fresh catalog.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {filtered.map(p => {
                const available = p.stock - p.reservedStock;
                const isEmbedded = usingSamples ? false : !!p.isEmbedded;
                const stockColor = available <= 0 ? '#ef4444' : available <= 5 ? '#f59e0b' : '#16a34a';
                const emoji = p.name.trim().charAt(0).toUpperCase();

                return (
                  <div key={p.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-2)', border: '1px solid var(--border)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          emoji
                        )}
                        <span style={{ position: 'absolute', bottom: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: stockColor, border: '2px solid var(--surface)' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <p className="mono" style={{ margin: 0, fontWeight: 800, color: 'var(--brand)', fontSize: '0.82rem' }}>₦{Number(p.price).toLocaleString()}</p>
                      </div>
                    </div>
                    {p.description && (
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-3)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: 'auto' }}>
                      <span className="badge" style={{ background: available <= 0 ? 'rgba(239,68,68,0.1)' : available <= 5 ? 'rgba(245,158,11,0.1)' : 'rgba(22,163,74,0.1)', color: stockColor, fontSize: '0.7rem' }}>
                        {available <= 0 ? 'Out of stock' : available <= 5 ? `${available} left` : `${available} in stock`}
                      </span>
                      {isEmbedded && <span style={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: 700 }}>AI ✓</span>}
                      {!usingSamples && (
                        <div style={{ display: 'flex', gap: '0.35rem', marginLeft: 'auto' }}>
                          <button className="btn-ghost" onClick={() => openEdit(p)} style={{ padding: '0.3rem' }}><Edit size={12} /></button>
                          <button className="btn-ghost" onClick={() => handleDelete(p.id)} style={{ padding: '0.3rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)' }}><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
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
                              <span className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)' }}>● Embedded</span>
                            ) : usingSamples ? (
                              <span className="badge" style={{ background: 'rgba(100,116,139,0.08)', color: 'var(--text-3)' }}>● Demo static</span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706' }}>● Indexing</span>
                            )}
                          </td>
                          <td>
                            {!usingSamples ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-ghost" onClick={() => openEdit(p)} style={{ padding: '0.4rem' }}><Edit size={13} /></button>
                                <button className="btn-ghost" onClick={() => handleDelete(p.id)} style={{ padding: '0.4rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)' }}><Trash2 size={13} /></button>
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
                Image URL (optional)
                <input className="input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/product.jpg" />
              </label>
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
                Image URL (optional)
                <input className="input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/product.jpg" />
              </label>
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

import React, { useState, useEffect } from 'react';

function App() {
  const [step, setStep] = useState(1);
  const [vendor, setVendor] = useState<{ id: string; name: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected'>('idle');

  const register = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
    };

    const res = await fetch('http://localhost:3000/vendors/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setVendor({ id: result.vendorId, name: data.name as string });
    setStep(2);
  };

  const uploadCatalog = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !vendor) return;
    setStatus('loading');
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    await fetch(`http://localhost:3000/vendors/${vendor.id}/catalog`, {
      method: 'POST',
      body: formData,
    });
    setStatus('idle');
    setStep(3);
  };

  const pollQr = async () => {
    if (!vendor) return;
    const res = await fetch(`http://localhost:3000/vendors/${vendor.id}/whatsapp/qr`);
    const result = await res.json();
    if (result.status === 'ready') {
      setQr(result.qr);
    } else if (result.status === 'connected') {
      setStatus('connected');
    }
  };

  useEffect(() => {
    let interval: any;
    if (step === 3 && status !== 'connected') {
      interval = setInterval(pollQr, 5000);
    }
    return () => clearInterval(interval);
  }, [step, status, vendor]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">VendorMind</h1>
        <p className="text-slate-500 mb-8">AI Sales Agent for WhatsApp</p>

        {step === 1 && (
          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Vendor Name</label>
              <input name="name" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 bg-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 bg-slate-100" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition">
              Create Account
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step 2: Upload Catalog</h2>
            <p className="text-sm text-slate-500">Upload an Excel or CSV file with name, price, and description columns.</p>
            <input type="file" onChange={uploadCatalog} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            {status === 'loading' && <p className="text-indigo-600 animate-pulse">Ingesting products...</p>}
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold">Step 3: Connect WhatsApp</h2>
            {status === 'connected' ? (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                ✅ Connected! Your AI agent is now live.
              </div>
            ) : qr ? (
              <div className="flex flex-col items-center">
                <p className="text-sm mb-4">Scan this QR code with WhatsApp</p>
                <div className="p-4 bg-white border rounded-lg shadow-inner">
                  {/* In a real app we'd use a QR component, here we just show the raw string for demo */}
                  <div className="w-48 h-48 bg-slate-200 flex items-center justify-center text-xs break-all overflow-hidden p-2">
                    {qr}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 animate-pulse">Generating connection code...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, ShoppingCart } from 'lucide-react';

const content = {
  privacy: {
    title: 'Privacy Policy',
    kicker: 'How VendorMind handles business and customer data.',
    sections: [
      ['Data we collect', 'VendorMind stores vendor account details, product catalogs, WhatsApp customer identifiers, conversations needed to run the sales agent, orders, wallet activity, and payment metadata from Nomba.'],
      ['How we use data', 'We use this data to answer customer questions, manage carts and orders, reserve stock, send payment links, provide support, and improve platform reliability.'],
      ['Payment data', 'VendorMind does not store card details. Payments are completed through Nomba-hosted checkout links.'],
      ['Contact', 'For privacy questions, contact hello@vendormind.app.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    kicker: 'The basic rules for using VendorMind.',
    sections: [
      ['Service use', 'VendorMind helps vendors automate WhatsApp sales workflows. Vendors are responsible for their product information, pricing, fulfilment, refunds, and customer promises.'],
      ['Wallet and usage', 'Usage may be charged from a prepaid wallet according to the active pricing shown in the product. Low or negative balances may pause automation.'],
      ['Payments', 'Payment links are powered by Nomba. Vendors are responsible for reconciling payouts and handling disputes with customers.'],
      ['Contact', 'For terms questions, contact hello@vendormind.app.'],
    ],
  },
  contact: {
    title: 'Contact',
    kicker: 'Talk to the VendorMind team.',
    sections: [
      ['Sales and onboarding', 'Email hello@vendormind.app if you want help setting up your first vendor account or connecting a WhatsApp number.'],
      ['Support', 'For support, include your store name, WhatsApp number, and a short description of the issue.'],
      ['Partnerships', 'For payment, logistics, or agency partnerships, send a brief proposal and contact details.'],
    ],
  },
} as const;

type PageKind = keyof typeof content;

export default function LegalPage({ kind }: { kind: PageKind }) {
  const page = content[kind];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text)' }}>
            <div style={{ width: 30, height: 30, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={14} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>VendorMind</span>
          </Link>
          <Link to="/" className="btn-ghost">
            <ArrowLeft size={13} />
            Home
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div className="card-raised" style={{ padding: '2rem' }}>
          <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '1rem' }}>
            {kind === 'contact' ? <Mail size={13} /> : <ShieldCheck size={13} />}
            VendorMind
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
            {page.title}
          </h1>
          <p style={{ color: 'var(--text-2)', margin: '0 0 2rem', fontSize: '0.95rem' }}>
            {page.kicker}
          </p>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {page.sections.map(([title, body]) => (
              <section key={title}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.35rem' }}>{title}</h2>
                <p style={{ color: 'var(--text-2)', lineHeight: 1.75, margin: 0, fontSize: '0.9rem' }}>{body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

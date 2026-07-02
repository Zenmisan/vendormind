import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Package, PlugZap, Settings,
  ShoppingBag, ShoppingCart, Wallet, MessageSquare
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const nav = [
  { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
  { to: '/products',  label: 'Catalog',  Icon: Package },
  { to: '/orders',    label: 'Orders',   Icon: ShoppingBag },
  { to: '/conversations', label: 'Conversations', Icon: MessageSquare },
];

export default function Sidebar({ active }: { active: string }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShoppingCart size={15} color="#fff" />
        </div>
        <span className="sidebar-logo-text">VendorMind</span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Store</span>
        {nav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}

        <span className="sidebar-section-label">Setup</span>
        <NavLink
          to="/onboard"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <PlugZap size={15} />
          WhatsApp setup
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <Settings size={15} />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-section-label">Wallet</span>
        <NavLink
          to="/wallet"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <Wallet size={15} />
          Balance & top up
        </NavLink>
        <button
          className="sidebar-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          onClick={() => signOut(auth).then(() => { window.location.href = '/'; })}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

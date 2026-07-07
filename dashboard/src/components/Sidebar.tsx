import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Package, PlugZap, Settings,
  ShoppingBag, Wallet, MessageSquare, Sun, Moon
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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo-dark.png" alt="VendorMind logo" style={{ width: 28, height: 28 }} />
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
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
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

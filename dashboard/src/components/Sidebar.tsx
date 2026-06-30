import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Wallet, LogOut, ShoppingCart } from 'lucide-react';

const nav = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/products',  label: 'Products',  Icon: Package },
  { to: '/orders',    label: 'Orders',    Icon: ShoppingBag },
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
        <span className="sidebar-section-label">Menu</span>
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
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-section-label">Account</span>
        <NavLink to="/onboard" className="sidebar-link">
          <Wallet size={15} />
          Top up wallet
        </NavLink>
        <NavLink to="/" className="sidebar-link">
          <LogOut size={15} />
          Back to home
        </NavLink>
      </div>
    </aside>
  );
}

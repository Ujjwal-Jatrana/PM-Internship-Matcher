import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, User, Settings, LogOut, Briefcase, LogIn } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">
          <Briefcase size={18} />
        </div>
        InternMatch
      </Link>

      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard')}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/profile" className={`navbar-link ${isActive('/profile')}`}>
              <User size={18} />
              <span>Profile</span>
            </Link>
            <Link to="/settings" className={`navbar-link ${isActive('/settings')}`}>
              <Settings size={18} />
              <span>Settings</span>
            </Link>
            <button className="navbar-link" onClick={logout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={`navbar-link ${isActive('/login')}`}>
              <LogIn size={18} />
              <span>Login</span>
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

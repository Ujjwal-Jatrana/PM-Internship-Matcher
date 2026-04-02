import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Search, Bell, ArrowRight, Briefcase, Shield, RefreshCw } from 'lucide-react'

export default function Landing() {
  const { user } = useAuth()

  return (
    <main>
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <h1>
            Your PM Internship,{' '}
            <span className="gradient-text">Matched Intelligently</span>
          </h1>
          <p>
            Stop scrolling through 32,000+ internships manually. Create your profile once, 
            and our smart engine automatically finds and suggests the best PM Internship 
            Scheme opportunities tailored to your skills, location, and preferences.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                <LayoutDashboard size={20} />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Create Your Profile
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">32,000+</div>
              <div className="hero-stat-label">Internships on Portal</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">Top Companies</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">₹9,000</div>
              <div className="hero-stat-label">Monthly Stipend</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">Free to Use</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features-grid">
          <div className="card feature-card">
            <div className="feature-icon orange">
              <Search size={28} />
            </div>
            <h3>Smart Matching</h3>
            <p>
              Our algorithm scores every internship against your profile — course, domain, 
              preferred location, and desired company — to surface only the best fits.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon blue">
              <RefreshCw size={28} />
            </div>
            <h3>Auto-Refresh</h3>
            <p>
              The system continuously monitors the PM Internship portal for new listings. 
              When a new opportunity matches your profile, you'll know immediately.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon green">
              <Bell size={28} />
            </div>
            <h3>Email Alerts</h3>
            <p>
              Get notified via email whenever a high-scoring new internship appears. 
              Never miss an application deadline again.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon orange">
              <Briefcase size={28} />
            </div>
            <h3>Portfolio Builder</h3>
            <p>
              Create a comprehensive student portfolio with your academic details, 
              preferences, and contact information — all in one place.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon blue">
              <Shield size={28} />
            </div>
            <h3>Eligibility Check</h3>
            <p>
              Automatically filters out internships where you don't meet the age, 
              nationality, or education requirements — saving you time.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon green">
              <Zap size={28} />
            </div>
            <h3>100% Free</h3>
            <p>
              Everything is completely free. No subscriptions, no premium plans, 
              no hidden costs. Built for students, by students.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function LayoutDashboard(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>
  )
}

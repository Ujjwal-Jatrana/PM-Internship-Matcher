import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { SAMPLE_INTERNSHIPS, Internship } from '../data/sampleInternships'
import { matchInternships, MatchResult } from '../lib/matcher'
import { 
  BarChart3, Sparkles, Building2, MapPin, Briefcase, 
  ExternalLink, ChevronDown, RefreshCw, Star, Filter,
  TrendingUp, Clock
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'domain'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [internshipsDb, setInternshipsDb] = useState<Internship[]>(SAMPLE_INTERNSHIPS)
  const [dataError, setDataError] = useState(false)

  const matches = useMemo(() => {
    if (!user) return []
    return matchInternships(user, internshipsDb)
  }, [user, internshipsDb])

  const filteredMatches = useMemo(() => {
    if (scoreFilter === 'high') return matches.filter(m => m.score >= 70)
    if (scoreFilter === 'medium') return matches.filter(m => m.score >= 50)
    if (scoreFilter === 'domain') return matches.filter(m => m.isDomainMatch)
    return matches
  }, [matches, scoreFilter])

  const totalNew = matches.filter(m => m.isNew).length
  const avgScore = matches.length > 0 ? Math.round(matches.reduce((s, m) => s + m.score, 0) / matches.length) : 0

  const handleRefresh = async () => {
    setRefreshing(true)
    setDataError(false)
    try {
      // Cloud build: Fetch latest scraped data from GitHub (Option A)
      const res = await fetch('https://raw.githubusercontent.com/Ujjwal-Jatrana/PM-Internship-Matcher/main/scraper/scraped_internships.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (data && data.internships && data.internships.length > 0) {
        setInternshipsDb(data.internships)
      } else {
        throw new Error('Empty data')
      }
    } catch (e) {
      console.warn('Could not fetch live data from GitHub, falling back to bundled sample data:', e)
      setInternshipsDb(SAMPLE_INTERNSHIPS)
      setDataError(true)
    } finally {
      setRefreshing(false)
      setLastRefresh(new Date())
    }
  }

  // Fetch on mount and auto-refresh every 30 minutes
  useEffect(() => {
    handleRefresh()
    const interval = setInterval(handleRefresh, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getScoreClass = (score: number) => {
    if (score >= 70) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <main className="container dashboard-content">
      <div className="page-header">
        <h1>
          <Sparkles size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--color-primary)' }} />
          Your Matched Internships
        </h1>
        <p>
          Smart suggestions based on your profile. Last refreshed: {lastRefresh.toLocaleTimeString()}
          {dataError && <span style={{ color: 'var(--color-danger)', marginLeft: 8, fontSize: '0.8rem' }}>(Using offline data)</span>}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon orange"><BarChart3 size={24} /></div>
          <div>
            <div className="stat-value">{matches.length}</div>
            <div className="stat-label">Total Matches</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Star size={24} /></div>
          <div>
            <div className="stat-value">{matches.filter(m => m.score >= 70).length}</div>
            <div className="stat-label">High Score (70%+)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Sparkles size={24} /></div>
          <div>
            <div className="stat-value">{totalNew}</div>
            <div className="stat-label">New Since Last Visit</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><TrendingUp size={24} /></div>
          <div>
            <div className="stat-value">{avgScore}%</div>
            <div className="stat-label">Average Match Score</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar-left">
          <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
          <button className={`filter-btn ${scoreFilter === 'all' ? 'active' : ''}`} onClick={() => setScoreFilter('all')}>
            All ({matches.length})
          </button>
          <button className={`filter-btn ${scoreFilter === 'high' ? 'active' : ''}`} onClick={() => setScoreFilter('high')}>
            🔥 High Match (70%+)
          </button>
          <button className={`filter-btn ${scoreFilter === 'medium' ? 'active' : ''}`} onClick={() => setScoreFilter('medium')}>
            ⭐ Medium+ (50%+)
          </button>
          <button className={`filter-btn ${scoreFilter === 'domain' ? 'active' : ''}`} onClick={() => setScoreFilter('domain')}>
            🎯 Domain Match
          </button>
        </div>
        <div className="dashboard-toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Match Cards */}
      {filteredMatches.length > 0 ? (
        <div className="match-grid">
          {filteredMatches.map(match => (
            <MatchCard key={match.internship.id} match={match} getScoreClass={getScoreClass} getInitials={getInitials} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Briefcase size={36} />
          </div>
          <h3>No matches found</h3>
          <p>
            {scoreFilter !== 'all' 
              ? 'Try lowering your score filter to see more results.'
              : 'Update your profile preferences to get better internship suggestions.'
            }
          </p>
        </div>
      )}
    </main>
  )
}

function MatchCard({ match, getScoreClass, getInitials }: { match: MatchResult; getScoreClass: (s: number) => string; getInitials: (n: string) => string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="match-card">
      <div className="match-card-header">
        <div className="match-card-company">
          <div className="match-card-company-logo">
            {getInitials(match.internship.companyName)}
          </div>
          <div className="match-card-company-info">
            <h3>{match.internship.companyName}</h3>
            <p>{match.internship.sector}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {match.isNew && <span className="new-badge">New</span>}
          <div className={`match-score-badge ${getScoreClass(match.score)}`}>
            {match.score}% Match
          </div>
        </div>
      </div>

      <div className="match-card-role">{match.internship.roleTitle}</div>

      <div className="match-card-tags">
        <span className="match-tag">
          <MapPin size={12} />
          {match.internship.state}
        </span>
        <span className="match-tag">
          <Briefcase size={12} />
          {match.internship.jobFunction.split('/')[0].trim()}
        </span>
        <span className="match-tag">
          <Building2 size={12} />
          {match.internship.fieldCategory}
        </span>
        <span className="match-tag">
          <Clock size={12} />
          {new Date(match.internship.firstSeen).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Why this match */}
      <div className="match-card-reasons">
        <div 
          onClick={() => setExpanded(!expanded)} 
          style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          Why this match?
        </div>
        {expanded && (
          <ul style={{ paddingTop: 8 }}>
            {match.reasons.map((r, i) => (
              <li key={i}>
                <strong>{r.label}</strong> ({r.points}/{r.maxPoints}): {r.description}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="match-card-actions">
        <a 
          href={match.internship.sourceUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary btn-sm"
        >
          Apply on Portal <ExternalLink size={14} />
        </a>
      </div>
    </div>
  )
}

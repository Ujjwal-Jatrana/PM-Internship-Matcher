import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { COURSE_PROGRAMS, DOMAINS, INDIAN_STATES, TOP_COMPANIES } from '../data/constants'
import { Settings as SettingsIcon, Bell, User, MapPin, Save } from 'lucide-react'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    contactNumber: user?.contactNumber || '',
    address: user?.address || '',
    courseProgram: user?.courseProgram || '',
    domain: user?.domain || '',
    yearOfProgram: String(user?.yearOfProgram || 1),
    preferredStates: user?.preferredStates || [] as string[],
    desiredCompany: user?.desiredCompany || 'Any',
    emailAlertsEnabled: user?.emailAlertsEnabled ?? true,
    minScoreThreshold: 30
  })

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleState = (state: string) => {
    setForm(prev => ({
      ...prev,
      preferredStates: prev.preferredStates.includes(state)
        ? prev.preferredStates.filter(s => s !== state)
        : [...prev.preferredStates, state]
    }))
  }

  const handleSave = () => {
    updateProfile({
      fullName: form.fullName,
      contactNumber: form.contactNumber,
      address: form.address,
      courseProgram: form.courseProgram,
      domain: form.domain,
      yearOfProgram: parseInt(form.yearOfProgram),
      preferredStates: form.preferredStates,
      desiredCompany: form.desiredCompany,
      emailAlertsEnabled: form.emailAlertsEnabled
    })
    showToast('Settings saved! Your matches will update.', 'success')
    navigate('/dashboard')
  }

  if (!user) return null

  return (
    <main className="container" style={{ paddingBottom: 64, maxWidth: 700 }}>
      <div className="page-header">
        <h1>
          <SettingsIcon size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--color-primary)' }} />
          Settings
        </h1>
        <p>Update your profile and preferences to refine your internship matches</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="settings-section">
          <h2><User size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Personal Details</h2>
          
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="set-name">Full Name</label>
            <input id="set-name" className="form-input" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
          </div>

          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="set-phone">Contact Number</label>
              <input id="set-phone" type="tel" className="form-input" value={form.contactNumber} onChange={e => update('contactNumber', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="set-address">Address</label>
              <input id="set-address" className="form-input" value={form.address} onChange={e => update('address', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2><User size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Academic Details</h2>
          
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="set-course">Course / Program</label>
              <select id="set-course" className="form-select" value={form.courseProgram} onChange={e => update('courseProgram', e.target.value)}>
                {COURSE_PROGRAMS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="set-year">Year</label>
              <select id="set-year" className="form-select" value={form.yearOfProgram} onChange={e => update('yearOfProgram', e.target.value)}>
                {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="set-domain">Domain / Specialization</label>
            <select id="set-domain" className="form-select" value={form.domain} onChange={e => update('domain', e.target.value)}>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2><MapPin size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Internship Preferences</h2>
          
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Preferred States</label>
            <span className="form-hint" style={{ marginBottom: 8, display: 'block' }}>
              Selected: {form.preferredStates.length > 0 ? form.preferredStates.length + ' states' : 'All India'}
            </span>
            <div className="chip-group">
              {INDIAN_STATES.map(state => (
                <button
                  key={state}
                  type="button"
                  className={`chip ${form.preferredStates.includes(state) ? 'selected' : ''}`}
                  onClick={() => toggleState(state)}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="set-company">Desired Company</label>
            <select id="set-company" className="form-select" value={form.desiredCompany} onChange={e => update('desiredCompany', e.target.value)}>
              {TOP_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2><Bell size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Notifications</h2>
          
          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Email Alerts</h4>
              <p>Receive email notifications when new matching internships are found</p>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={form.emailAlertsEnabled} onChange={e => update('emailAlertsEnabled', e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row" style={{ marginTop: 16 }}>
            <div className="settings-row-info">
              <h4>Export Profile for Pipeline</h4>
              <p>Download your profile as JSON so the scraper can send you email alerts automatically</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              if (!user) return
              const exportData = [user]
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'user_profiles.json'
              a.click()
              URL.revokeObjectURL(url)
              showToast('Profile exported! Place this file in the scraper/ folder.', 'success')
            }}>
              Export
            </button>
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" onClick={handleSave} style={{ marginTop: 16 }}>
          <Save size={18} /> Save Changes
        </button>
      </div>
    </main>
  )
}

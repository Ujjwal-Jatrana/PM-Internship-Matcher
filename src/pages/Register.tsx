import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { INDIAN_STATES, COURSE_PROGRAMS, DOMAINS, TOP_COMPANIES, DESIGNATIONS } from '../data/constants'
import { Check, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react'

const STEPS = ['Personal', 'Contact', 'Academic', 'Preferences', 'Confirm']

export default function Register() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Form data
  const [form, setForm] = useState({
    fullName: '', dateOfBirth: '', nationality: 'Indian',
    fathersName: '', mothersName: '',
    email: '', password: '', confirmPassword: '',
    contactNumber: '', address: '',
    courseProgram: '', domains: [] as string[], yearOfProgram: '1',
    preferredStates: [] as string[], desiredCompanies: [] as string[],
    desiredDesignation: 'Any',
    customCompany: '', emailAlertsEnabled: true
  })

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const calculateAge = (dob: string) => {
    if (!dob) return 0
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }

  const toggleState = (state: string) => {
    setForm(prev => ({
      ...prev,
      preferredStates: prev.preferredStates.includes(state)
        ? prev.preferredStates.filter(s => s !== state)
        : [...prev.preferredStates, state]
    }))
  }

  const toggleDomain = (domain: string) => {
    setForm(prev => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter(d => d !== domain)
        : [...prev.domains, domain]
    }))
  }

  const toggleCompany = (company: string) => {
    setForm(prev => ({
      ...prev,
      desiredCompanies: prev.desiredCompanies.includes(company)
        ? prev.desiredCompanies.filter(c => c !== company)
        : [...prev.desiredCompanies, company]
    }))
  }

  const validateStep = () => {
    switch(step) {
      case 0:
        if (!form.fullName || !form.dateOfBirth || !form.fathersName || !form.mothersName) {
          showToast('Please fill all personal details', 'error'); return false
        }
        const age = calculateAge(form.dateOfBirth)
        if (age < 18 || age > 25) {
          showToast('Age must be between 18-25 for PM Internship Scheme', 'error'); return false
        }
        return true
      case 1:
        if (!form.email || !form.password || !form.contactNumber) {
          showToast('Please fill email, password and contact number', 'error'); return false
        }
        if (form.password !== form.confirmPassword) {
          showToast('Passwords do not match', 'error'); return false
        }
        if (form.password.length < 6) {
          showToast('Password must be at least 6 characters', 'error'); return false
        }
        return true
      case 2:
        if (!form.courseProgram || form.domains.length === 0) {
          showToast('Please select your course and at least one domain', 'error'); return false
        }
        return true
      case 3:
        return true // preferences are optional
      default: return true
    }
  }

  const nextStep = () => { if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const success = await register({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      age: calculateAge(form.dateOfBirth),
      dateOfBirth: form.dateOfBirth,
      nationality: form.nationality,
      courseProgram: form.courseProgram,
      domains: form.domains,
      yearOfProgram: parseInt(form.yearOfProgram),
      preferredStates: form.preferredStates,
      preferredDistricts: [],
      fathersName: form.fathersName,
      mothersName: form.mothersName,
      address: form.address,
      contactNumber: form.contactNumber,
      desiredCompanies: form.desiredCompanies.length > 0 ? form.desiredCompanies : ['Any'],
      desiredDesignation: form.desiredDesignation,
      emailAlertsEnabled: form.emailAlertsEnabled
    })
    setLoading(false)
    if (success) {
      showToast('Profile created! Welcome to InternMatch.', 'success')
      navigate('/dashboard')
    } else {
      showToast('An account with this email already exists', 'error')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <h1>Create Your Profile</h1>
        <p className="auth-subtitle">Complete your portfolio to get personalized internship matches</p>

        {/* Step indicator */}
        <div className="step-indicator">
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}>
                <div className="dot">
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className="step-label">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 0: Personal */}
          {step === 0 && (
            <div className="step-content">
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">Full Name <span className="required">*</span></label>
                  <input id="reg-name" className="form-input" placeholder="Enter your full name" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-dob">Date of Birth <span className="required">*</span></label>
                  <input id="reg-dob" type="date" className="form-input" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
                  {form.dateOfBirth && <span className="form-hint">Age: {calculateAge(form.dateOfBirth)} years</span>}
                </div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-father">Father's Name <span className="required">*</span></label>
                  <input id="reg-father" className="form-input" placeholder="Enter father's name" value={form.fathersName} onChange={e => update('fathersName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-mother">Mother's Name <span className="required">*</span></label>
                  <input id="reg-mother" className="form-input" placeholder="Enter mother's name" value={form.mothersName} onChange={e => update('mothersName', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-nation">Nationality <span className="required">*</span></label>
                <select id="reg-nation" className="form-select" value={form.nationality} onChange={e => update('nationality', e.target.value)}>
                  <option value="Indian">Indian</option>
                  <option value="Other">Other</option>
                </select>
                {form.nationality !== 'Indian' && <span className="form-error">PM Internship Scheme requires Indian nationality</span>}
              </div>
            </div>
          )}

          {/* Step 1: Contact */}
          {step === 1 && (
            <div className="step-content">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="reg-email">Email Address <span className="required">*</span></label>
                <input id="reg-email" type="email" className="form-input" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                <span className="form-hint">Used for login and email alerts</span>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-pass">Password <span className="required">*</span></label>
                  <input id="reg-pass" type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirm">Confirm Password <span className="required">*</span></label>
                  <input id="reg-confirm" type="password" className="form-input" placeholder="Confirm password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">Contact Number <span className="required">*</span></label>
                  <input id="reg-phone" type="tel" className="form-input" placeholder="+91 XXXXXXXX" value={form.contactNumber} onChange={e => update('contactNumber', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-address">Address</label>
                  <input id="reg-address" className="form-input" placeholder="City, State" value={form.address} onChange={e => update('address', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic */}
          {step === 2 && (
            <div className="step-content">
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-course">Course / Program <span className="required">*</span></label>
                  <select id="reg-course" className="form-select" value={form.courseProgram} onChange={e => update('courseProgram', e.target.value)}>
                    <option value="">Select your course</option>
                    {COURSE_PROGRAMS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-year">Year of Program</label>
                  <select id="reg-year" className="form-select" value={form.yearOfProgram} onChange={e => update('yearOfProgram', e.target.value)}>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Domains / Specializations <span className="required">*</span></label>
                <span className="form-hint" style={{ marginBottom: 8, display: 'block' }}>
                  Select all domains you're interested in ({form.domains.length} selected)
                </span>
                <div className="chip-group">
                  {DOMAINS.map(domain => (
                    <button
                      key={domain}
                      type="button"
                      className={`chip ${form.domains.includes(domain) ? 'selected' : ''}`}
                      onClick={() => toggleDomain(domain)}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="step-content">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Preferred States for Internship</label>
                <span className="form-hint" style={{ marginBottom: 8, display: 'block' }}>
                  Select states where you'd prefer to intern (leave empty for all India)
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

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Desired Companies</label>
                <span className="form-hint" style={{ marginBottom: 8, display: 'block' }}>
                  Select companies you're interested in (leave empty = open to any). {form.desiredCompanies.length} selected
                </span>
                <div className="chip-group">
                  {TOP_COMPANIES.filter(c => c !== 'Any' && c !== 'Other (specify)').map(company => (
                    <button
                      key={company}
                      type="button"
                      className={`chip ${form.desiredCompanies.includes(company) ? 'selected' : ''}`}
                      onClick={() => toggleCompany(company)}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="reg-designation">Desired Work Designation</label>
                <select id="reg-designation" className="form-select" value={form.desiredDesignation} onChange={e => update('desiredDesignation', e.target.value)}>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <label className="form-checkbox">
                <input type="checkbox" checked={form.emailAlertsEnabled} onChange={e => update('emailAlertsEnabled', e.target.checked)} />
                <span>Enable email alerts for new matching internships</span>
              </label>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="step-content">
              <h3 style={{ marginBottom: 16 }}>Review Your Profile</h3>
              <div className="profile-details-grid" style={{ marginBottom: 16 }}>
                <div className="profile-field">
                  <div className="profile-field-label">Full Name</div>
                  <div className="profile-field-value">{form.fullName}</div>
                </div>
                <div className="profile-field">
                  <div className="profile-field-label">Age</div>
                  <div className="profile-field-value">{calculateAge(form.dateOfBirth)} years</div>
                </div>
                <div className="profile-field">
                  <div className="profile-field-label">Email</div>
                  <div className="profile-field-value">{form.email}</div>
                </div>
                <div className="profile-field">
                  <div className="profile-field-label">Contact</div>
                  <div className="profile-field-value">{form.contactNumber}</div>
                </div>
                <div className="profile-field">
                  <div className="profile-field-label">Course</div>
                  <div className="profile-field-value">{form.courseProgram} (Year {form.yearOfProgram})</div>
                </div>
                <div className="profile-field">
                  <div className="profile-field-label">Domains</div>
                  <div className="profile-field-value">{form.domains.join(', ') || 'None selected'}</div>
                </div>
                <div className="profile-field">
                  <div className="profile-field-label">Preferred States</div>
                  <div className="profile-field-value">{form.preferredStates.length > 0 ? form.preferredStates.join(', ') : 'All India'}</div>
                </div>
                <div className="profile-field">
                  <div className="profile-field-label">Desired Companies</div>
                  <div className="profile-field-value">{form.desiredCompanies.length > 0 ? form.desiredCompanies.join(', ') : 'Open to any'}</div>
                </div>
                <div className="profile-field">
                  <div className="profile-field-label">Designation</div>
                  <div className="profile-field-value">{form.desiredDesignation}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="step-actions">
            {step > 0 ? (
              <button type="button" className="btn btn-secondary" onClick={prevStep}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? <div className="spinner" /> : <><UserPlus size={18} /> Create Profile & Find Matches</>}
              </button>
            )}
          </div>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}

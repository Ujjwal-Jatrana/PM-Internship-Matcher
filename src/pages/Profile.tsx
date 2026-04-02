import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { 
  User, Mail, Phone, MapPin, GraduationCap, Building2, 
  Calendar, Globe, Heart, Edit 
} from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()

  if (!user) return null

  const initials = user.fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <main className="container" style={{ paddingBottom: 64 }}>
      <div className="page-header">
        <h1>Your Profile</h1>
        <p>Your student portfolio used for intelligent internship matching</p>
      </div>

      <div className="card profile-header">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info">
          <h2>{user.fullName}</h2>
          <p>{user.courseProgram} — {user.domain} (Year {user.yearOfProgram})</p>
          <p style={{ fontSize: '0.8rem', marginTop: 4 }}>
            Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/settings" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
          <Edit size={14} /> Edit
        </Link>
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: 16, marginTop: 24 }}>Personal Information</h2>
      <div className="profile-details-grid">
        <div className="profile-field">
          <div className="profile-field-label"><User size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Full Name</div>
          <div className="profile-field-value">{user.fullName}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Age</div>
          <div className="profile-field-value">{user.age} years</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Date of Birth</div>
          <div className="profile-field-value">{new Date(user.dateOfBirth).toLocaleDateString('en-IN')}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><Globe size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Nationality</div>
          <div className="profile-field-value">{user.nationality}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><Heart size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Father's Name</div>
          <div className="profile-field-value">{user.fathersName}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><Heart size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Mother's Name</div>
          <div className="profile-field-value">{user.mothersName}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: 16, marginTop: 32 }}>Contact Information</h2>
      <div className="profile-details-grid">
        <div className="profile-field">
          <div className="profile-field-label"><Mail size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Email</div>
          <div className="profile-field-value">{user.email}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Contact Number</div>
          <div className="profile-field-value">{user.contactNumber}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Address</div>
          <div className="profile-field-value">{user.address || 'Not provided'}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: 16, marginTop: 32 }}>Academic Details</h2>
      <div className="profile-details-grid">
        <div className="profile-field">
          <div className="profile-field-label"><GraduationCap size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Course / Program</div>
          <div className="profile-field-value">{user.courseProgram}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><GraduationCap size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Domain</div>
          <div className="profile-field-value">{user.domain}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><GraduationCap size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Year</div>
          <div className="profile-field-value">Year {user.yearOfProgram}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: 16, marginTop: 32 }}>Internship Preferences</h2>
      <div className="profile-details-grid">
        <div className="profile-field">
          <div className="profile-field-label"><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Preferred States</div>
          <div className="profile-field-value">{user.preferredStates.length > 0 ? user.preferredStates.join(', ') : 'All India (no preference)'}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><Building2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Desired Company</div>
          <div className="profile-field-value">{user.desiredCompany}</div>
        </div>
        <div className="profile-field">
          <div className="profile-field-label"><Mail size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Email Alerts</div>
          <div className="profile-field-value" style={{ color: user.emailAlertsEnabled ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {user.emailAlertsEnabled ? '✓ Enabled' : '✕ Disabled'}
          </div>
        </div>
      </div>
    </main>
  )
}

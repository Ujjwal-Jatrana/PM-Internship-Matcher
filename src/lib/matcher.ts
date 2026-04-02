// Intelligent Matching Engine for PM Internship Smart Match
// Scores internships against a user profile using hard + soft constraints

import { Internship } from '../data/sampleInternships'
import { UserProfile } from '../context/AuthContext'

export interface MatchResult {
  internship: Internship
  score: number
  reasons: MatchReason[]
  isNew: boolean
  isDomainMatch: boolean
}

export interface MatchReason {
  label: string
  points: number
  maxPoints: number
  description: string
}

// ============ HARD CONSTRAINTS ============
// If any of these fail, the internship is instantly rejected

function passesHardConstraints(user: UserProfile, internship: Internship): boolean {
  // 1. Nationality must be Indian
  if (user.nationality.toLowerCase() !== 'indian') return false

  // 2. Age must be 18-25 (PM Internship Scheme rule)
  if (user.age < 18 || user.age > 25) return false

  // 3. Location filter — if user has set preferred states, ONLY show those states
  if (user.preferredStates.length > 0) {
    const intState = internship.state.toUpperCase()
    const stateMatch = user.preferredStates.some(s => s.toUpperCase() === intState)
    if (!stateMatch) return false
  }

  // 4. Company filter — if user selected specific companies, only show those
  if (user.desiredCompanies && user.desiredCompanies.length > 0) {
    const hasAny = user.desiredCompanies.some(c => c.toLowerCase() === 'any')
    if (!hasAny) {
      const companyName = internship.companyName.toLowerCase()
      const companyMatch = user.desiredCompanies.some(c =>
        companyName.includes(c.toLowerCase()) || c.toLowerCase().includes(companyName)
      )
      if (!companyMatch) return false
    }
  }

  return true
}

// ============ SOFT SCORING ============
// Each criterion contributes points. Max total = 100.

function scoreCourseMatch(user: UserProfile, internship: Internship): MatchReason {
  const maxPoints = 25
  const userCourse = user.courseProgram.toLowerCase()
  const intField = internship.fieldCategory.toLowerCase()

  // Exact match
  if (intField.includes(userCourse) || userCourse.includes(intField)) {
    return { label: 'Course Match', points: 25, maxPoints, description: `Your ${user.courseProgram} matches the required field` }
  }

  // Fuzzy: degree level match
  const degreeMap: Record<string, string[]> = {
    'b.tech': ['b.tech', 'b.e.', 'be ', 'btech'],
    'b.e.': ['b.tech', 'b.e.', 'be ', 'btech'],
    'mba': ['mba', 'management', 'bba'],
    'bba': ['bba', 'mba', 'management'],
    'bca': ['bca', 'mca', 'computer'],
    'mca': ['mca', 'bca', 'computer'],
    'iti': ['iti', 'technician', 'operator'],
    'polytechnic': ['polytechnic', 'diploma'],
    'b.sc': ['b.sc', 'bsc', 'science'],
    'm.sc': ['m.sc', 'msc', 'science'],
    'b.com': ['b.com', 'bcom', 'commerce'],
    'm.com': ['m.com', 'mcom', 'commerce'],
  }

  for (const [key, aliases] of Object.entries(degreeMap)) {
    if (userCourse.includes(key)) {
      if (aliases.some(a => intField.includes(a))) {
        return { label: 'Course Match', points: 20, maxPoints, description: `Your ${user.courseProgram} is compatible with ${internship.fieldCategory}` }
      }
    }
  }

  // Higher degree override
  const higherMatch = (userCourse.includes('m.tech') || userCourse.includes('m.e.')) && intField.includes('b.tech')
  if (higherMatch) {
    return { label: 'Course Match', points: 15, maxPoints, description: 'Your higher degree qualifies for this role' }
  }

  return { label: 'Course Match', points: 0, maxPoints, description: 'Course/field does not match this role' }
}

function scoreDomainMatch(user: UserProfile, internship: Internship): MatchReason {
  const maxPoints = 25
  const userDomains = user.domains || []
  const intFunction = internship.jobFunction.toLowerCase()
  const intRole = internship.roleTitle.toLowerCase()

  if (userDomains.length === 0) {
    return { label: 'Domain Match', points: 5, maxPoints, description: 'No domains selected (neutral)' }
  }

  // Check each selected domain for keyword matches
  let bestScore = 0
  let bestDomain = ''

  for (const userDomain of userDomains) {
    const domainLower = userDomain.toLowerCase()
    const domainKeywords = domainLower.split(/[\s/&,]+/).filter(w => w.length > 2)

    let matches = 0
    for (const keyword of domainKeywords) {
      if (intFunction.includes(keyword) || intRole.includes(keyword)) {
        matches++
      }
    }

    let score = 0
    if (matches >= 2) score = 25
    else if (matches >= 1) score = 15

    // If no direct match, check broad categories
    if (score === 0) {
      const broadMap: Record<string, string[]> = {
        'computer': ['software', 'developer', 'cloud', 'cyber', 'data', 'analyst', 'ui', 'ux', 'it'],
        'mechanical': ['manufacturing', 'production', 'cnc', 'autocad', 'automobile', 'ev'],
        'electrical': ['power', 'electrical', 'electronics', 'circuit'],
        'civil': ['construction', 'infrastructure', 'civil', 'structural'],
        'chemical': ['chemical', 'process', 'petroleum', 'refinery'],
        'finance': ['finance', 'accounting', 'audit', 'banking'],
        'marketing': ['marketing', 'sales', 'business', 'executive'],
        'data': ['data', 'analytics', 'science', 'ml', 'ai', 'analyst'],
        'cybersecurity': ['security', 'cyber', 'information security'],
        'cloud': ['cloud', 'devops', 'aws', 'azure'],
      }

      for (const [domain, keywords] of Object.entries(broadMap)) {
        if (domainLower.includes(domain)) {
          const foundKeywords = keywords.filter(k => intFunction.includes(k) || intRole.includes(k))
          if (foundKeywords.length > 0) {
            score = 18
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestDomain = userDomain
    }
  }

  if (bestScore >= 20) {
    return { label: 'Domain Match', points: bestScore, maxPoints, description: `Your ${bestDomain} domain strongly aligns with ${internship.jobFunction}` }
  }
  if (bestScore >= 10) {
    return { label: 'Domain Match', points: bestScore, maxPoints, description: `Partial domain overlap with this role via ${bestDomain}` }
  }

  return { label: 'Domain Match', points: 0, maxPoints, description: 'None of your selected domains match this role' }
}

function scoreLocationMatch(user: UserProfile, internship: Internship): MatchReason {
  const maxPoints = 15
  const intDistrict = internship.district.toUpperCase()

  // If user set preferred states, this internship already passed the hard filter
  if (user.preferredStates.length > 0) {
    const districtMatch = user.preferredDistricts.length === 0 || user.preferredDistricts.some(d => d.toUpperCase() === intDistrict)
    if (districtMatch) {
      return { label: 'Location Match', points: 15, maxPoints, description: `Located in your preferred area: ${internship.state}` }
    }
    return { label: 'Location Match', points: 10, maxPoints, description: `In your preferred state: ${internship.state}` }
  }

  // No preferences set — neutral score
  return { label: 'Location Match', points: 8, maxPoints, description: 'Open to all locations (no preference set)' }
}

function scoreCompanyMatch(user: UserProfile, internship: Internship): MatchReason {
  const maxPoints = 15
  const companies = user.desiredCompanies || []

  if (companies.length === 0 || companies.some(c => c.toLowerCase() === 'any')) {
    return { label: 'Company Match', points: 10, maxPoints, description: 'Open to any company' }
  }

  // If user specified companies, this internship already passed the hard filter
  return { label: 'Company Match', points: 15, maxPoints, description: `Matches your desired company: ${internship.companyName}` }
}

function scoreDesignationMatch(user: UserProfile, internship: Internship): MatchReason {
  const maxPoints = 10
  const desired = (user.desiredDesignation || 'Any').toLowerCase()

  if (desired === 'any' || desired === '') {
    return { label: 'Designation Match', points: 5, maxPoints, description: 'Open to any designation' }
  }

  const roleTitle = internship.roleTitle.toLowerCase()
  const jobFunction = internship.jobFunction.toLowerCase()

  // Check if desired designation keywords appear in role or job function
  const desiredWords = desired.split(/[\s/]+/).filter(w => w.length > 2)
  const matchCount = desiredWords.filter(w => roleTitle.includes(w) || jobFunction.includes(w)).length

  if (matchCount >= 2) {
    return { label: 'Designation Match', points: 10, maxPoints, description: `Role matches your desired designation: ${user.desiredDesignation}` }
  }
  if (matchCount >= 1) {
    return { label: 'Designation Match', points: 6, maxPoints, description: `Role partially matches your desired designation` }
  }

  return { label: 'Designation Match', points: 0, maxPoints, description: `Role doesn't match desired designation (${user.desiredDesignation})` }
}

function scoreSectorMatch(user: UserProfile, internship: Internship): MatchReason {
  const maxPoints = 10
  const userDomains = user.domains || []
  const intSector = internship.sector.toLowerCase()

  const sectorDomainMap: Record<string, string[]> = {
    'information technology': ['computer', 'it', 'data', 'cybersecurity', 'cloud', 'software'],
    'aviation': ['aerospace', 'mechanical', 'electronics', 'electrical'],
    'oil': ['chemical', 'mechanical', 'environmental', 'petroleum'],
    'manufacturing': ['mechanical', 'manufacturing', 'operations', 'production'],
    'automobile': ['mechanical', 'automobile', 'electrical', 'electronics'],
    'banking': ['finance', 'accounting', 'commerce'],
    'infrastructure': ['civil', 'construction', 'structural'],
    'pharmaceutical': ['chemical', 'biotechnology', 'healthcare'],
    'power': ['electrical', 'electronics', 'mechanical'],
    'metals': ['mechanical', 'metallurgy', 'chemical', 'mining'],
  }

  for (const [sector, domains] of Object.entries(sectorDomainMap)) {
    if (intSector.includes(sector)) {
      for (const userDomain of userDomains) {
        if (domains.some(d => userDomain.toLowerCase().includes(d))) {
          return { label: 'Sector Match', points: 10, maxPoints, description: `${internship.sector} aligns with your ${userDomain} background` }
        }
      }
    }
  }

  return { label: 'Sector Match', points: 2, maxPoints, description: 'Sector partially aligns' }
}

// ============ MAIN MATCHER ============

export function matchInternships(user: UserProfile, internships: Internship[]): MatchResult[] {
  // Only process active internships
  const activeInternships = internships.filter(i => i.isActive)

  const results: MatchResult[] = []

  for (const internship of activeInternships) {
    // Apply hard constraints
    if (!passesHardConstraints(user, internship)) continue

    // Calculate scores
    const domainReason = scoreDomainMatch(user, internship)
    const reasons: MatchReason[] = [
      scoreCourseMatch(user, internship),
      domainReason,
      scoreLocationMatch(user, internship),
      scoreCompanyMatch(user, internship),
      scoreDesignationMatch(user, internship),
      scoreSectorMatch(user, internship)
    ]

    const totalScore = reasons.reduce((sum, r) => sum + r.points, 0)

    // Only include matches scoring ≥ 30%
    if (totalScore >= 30) {
      // Mark as "new" if first seen within last 3 days
      const daysSinceFirstSeen = (Date.now() - new Date(internship.firstSeen).getTime()) / (1000 * 60 * 60 * 24)
      
      results.push({
        internship,
        score: totalScore,
        reasons,
        isNew: daysSinceFirstSeen <= 3,
        isDomainMatch: domainReason.points > 0
      })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results
}

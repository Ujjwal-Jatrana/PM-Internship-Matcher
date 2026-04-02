"""
PM Internship Smart Match — Full Pipeline
Runs: Scrape → Match → Email Alert

This is the master script that GitHub Actions (or you manually) runs.
It orchestrates the entire flow:
  1. Scrapes the portal for new internships
  2. Loads all user profiles from the local DB
  3. Runs the matching engine against new internships
  4. Sends email alerts to users with high-scoring new matches

Usage:
    python run_pipeline.py

Environment Variables (for email):
    SMTP_EMAIL     - Your Gmail address
    SMTP_PASSWORD  - Gmail App Password (NOT your regular password)
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from scraper import scrape_internships, DATA_FILE
from emailer import send_alert


def load_user_profiles() -> list:
    """
    Load user profiles from the frontend's localStorage export.
    In production with Supabase, this would query the database.
    For now, reads from a JSON file that can be exported from the browser.
    """
    profiles_file = Path(__file__).parent / "user_profiles.json"
    
    if profiles_file.exists():
        with open(profiles_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Handle both formats: direct list or localStorage format
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                return [entry["profile"] for entry in data.values() if "profile" in entry]
    
    print("⚠ No user_profiles.json found. Email alerts skipped.")
    print("  To enable: export your profiles from the browser using the Export button in Settings.")
    return []


def simple_match(user: dict, internship: dict) -> dict | None:
    """
    Simplified matching for the Python pipeline.
    Returns a match dict with score, or None if no match.
    """
    score = 0
    
    # Hard constraints
    nationality = user.get("nationality", "").lower()
    if nationality != "indian":
        return None
    
    age = user.get("age", 0)
    if age < 18 or age > 25:
        return None
    
    # Location hard filter
    preferred_states = [s.upper() for s in user.get("preferredStates", [])]
    int_state = internship.get("state", "").upper()
    if preferred_states and int_state not in preferred_states:
        return None
    
    # Company hard filter
    desired_company = user.get("desiredCompany", "Any").lower()
    if desired_company and desired_company != "any":
        if desired_company not in internship.get("companyName", "").lower():
            return None
    
    # ---- Soft Scoring ----
    
    # Course match (30 pts max)
    user_course = user.get("courseProgram", "").lower()
    int_field = internship.get("fieldCategory", "").lower()
    if user_course and int_field:
        if user_course in int_field or int_field in user_course:
            score += 30
        elif any(alias in int_field for alias in _get_course_aliases(user_course)):
            score += 25
    
    # Domain match (20 pts max)
    user_domain = user.get("domain", "").lower()
    int_function = internship.get("jobFunction", "").lower()
    int_role = internship.get("roleTitle", "").lower()
    domain_keywords = [w for w in user_domain.split() if len(w) > 2]
    domain_hits = sum(1 for kw in domain_keywords if kw in int_function or kw in int_role)
    if domain_hits >= 2:
        score += 20
    elif domain_hits >= 1:
        score += 12
    
    # Location match (20 pts max)
    if preferred_states:
        score += 20  # Already passed hard filter
    else:
        score += 10  # Neutral
    
    # Company match (15 pts max)
    if desired_company == "any" or not desired_company:
        score += 10
    else:
        score += 15  # Already passed hard filter
    
    # Sector match (15 pts max)
    score += 5  # Base partial match
    
    if score >= 30:
        return {
            "companyName": internship.get("companyName", ""),
            "roleTitle": internship.get("roleTitle", ""),
            "sector": internship.get("sector", ""),
            "state": internship.get("state", ""),
            "score": score
        }
    
    return None


def _get_course_aliases(course: str) -> list:
    """Get fuzzy aliases for a course name."""
    aliases_map = {
        "b.tech": ["b.e.", "btech", "engineering"],
        "b.e.": ["b.tech", "btech", "engineering"],
        "mba": ["management", "bba"],
        "bba": ["management", "mba"],
        "bca": ["mca", "computer"],
        "mca": ["bca", "computer"],
        "iti": ["technician", "operator"],
    }
    for key, aliases in aliases_map.items():
        if key in course:
            return aliases
    return []


def run_pipeline():
    """Run the full scrape → match → alert pipeline."""
    print("=" * 60)
    print("PM Internship Smart Match — Full Pipeline")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Step 1: Scrape
    print("\n📡 STEP 1: Scraping portal...")
    try:
        scraped_data = scrape_internships()
        new_internships = [i for i in scraped_data.get("internships", []) if i.get("isActive", True)]
        print(f"  Found {len(new_internships)} active internships")
    except Exception as e:
        print(f"  ⚠ Scraping failed: {e}")
        print("  Falling back to existing data...")
        if DATA_FILE.exists():
            with open(DATA_FILE, 'r') as f:
                scraped_data = json.load(f)
            new_internships = [i for i in scraped_data.get("internships", []) if i.get("isActive", True)]
        else:
            new_internships = []
    
    if not new_internships:
        print("  No internships to process. Exiting.")
        return
    
    # Step 2: Load user profiles
    print("\n👤 STEP 2: Loading user profiles...")
    users = load_user_profiles()
    print(f"  Found {len(users)} user(s)")
    
    if not users:
        print("  No users to alert. Pipeline complete.")
        return
    
    # Step 3: Match & Alert
    print("\n🎯 STEP 3: Running matching & sending alerts...")
    smtp_configured = bool(os.getenv("SMTP_EMAIL")) and bool(os.getenv("SMTP_PASSWORD"))
    
    if not smtp_configured:
        print("  ⚠ SMTP not configured — will show matches but NOT send emails")
        print("  To enable email: set SMTP_EMAIL and SMTP_PASSWORD environment variables")
    
    alerts_sent = 0
    for user in users:
        email = user.get("email", "unknown")
        alerts_enabled = user.get("emailAlertsEnabled", True)
        
        if not alerts_enabled:
            print(f"  ⏭ {email}: alerts disabled, skipping")
            continue
        
        # Run matching
        matches = []
        for intern in new_internships:
            result = simple_match(user, intern)
            if result:
                matches.append(result)
        
        # Sort by score
        matches.sort(key=lambda m: m["score"], reverse=True)
        top_matches = [m for m in matches if m["score"] >= 50]  # Only alert for 50%+ matches
        
        if not top_matches:
            print(f"  ℹ {email}: {len(matches)} matches found, none above 50% threshold")
            continue
        
        print(f"  📧 {email}: {len(top_matches)} high matches found!")
        
        if smtp_configured:
            success = send_alert(email, top_matches)
            if success:
                alerts_sent += 1
        else:
            print(f"     Would send: {len(top_matches)} matches")
            for m in top_matches[:3]:
                print(f"       • {m['companyName']} — {m['roleTitle']} ({m['score']}%)")
    
    print(f"\n{'=' * 60}")
    print(f"Pipeline complete!")
    print(f"  Internships processed: {len(new_internships)}")
    print(f"  Users checked: {len(users)}")
    print(f"  Alerts sent: {alerts_sent}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    run_pipeline()

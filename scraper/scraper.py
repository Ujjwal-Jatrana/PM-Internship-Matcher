"""
PM Internship Smart Match Engine — Scraper Bot
Uses Playwright to scrape Featured Internships from pminternship.mca.gov.in

This scraper:
1. Opens the PM Internship portal
2. Iterates through state/sector/field filter combinations
3. Extracts internship card data from the publicly visible "Featured Internships" section
4. Saves results to a JSON file (or Supabase when configured)
5. Marks expired listings as inactive

Usage:
    pip install playwright
    playwright install chromium
    python scraper.py
"""

import json
import os
import time
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("ERROR: playwright not installed. Run: pip install playwright && playwright install chromium")
    exit(1)

# ============ CONFIG ============
PORTAL_URL = "https://pminternship.mca.gov.in/"
DATA_FILE = Path(__file__).parent / "scraped_internships.json"
MAX_RETRIES = 3
SCROLL_DELAY = 1.5  # seconds
EXPIRY_DAYS = 7  # Mark as inactive if not seen for this many days


def generate_id(company: str, role: str, state: str) -> str:
    """Generate a deterministic ID for deduplication."""
    raw = f"{company}|{role}|{state}".lower().strip()
    return hashlib.md5(raw.encode()).hexdigest()


def load_existing_data() -> dict:
    """Load previously scraped data."""
    if DATA_FILE.exists():
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"internships": [], "last_scraped": None}


def save_data(data: dict):
    """Save scraped data to JSON file."""
    data["last_scraped"] = datetime.now().isoformat()
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Data saved to {DATA_FILE}")


def scrape_internships():
    """Main scraping function using Playwright."""
    print("=" * 60)
    print("PM Internship Smart Match — Scraper Bot")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    existing_data = load_existing_data()
    existing_ids = {i["id"] for i in existing_data.get("internships", [])}
    new_internships = []
    seen_ids = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()

        print(f"\n→ Navigating to {PORTAL_URL}")
        try:
            page.goto(PORTAL_URL, wait_until="networkidle", timeout=30000)
            time.sleep(3)  # Wait for dynamic content
        except PlaywrightTimeout:
            print("⚠ Page load timeout, proceeding anyway...")

        # Close any chatbot popups
        try:
            close_btns = page.query_selector_all('[class*="close"], [aria-label="Close"]')
            for btn in close_btns:
                try:
                    btn.click(timeout=1000)
                except:
                    pass
        except:
            pass

        # Scroll to Featured Internships section
        print("→ Looking for Featured Internships section...")
        try:
            page.evaluate("window.scrollTo(0, 500)")
            time.sleep(1)
        except:
            pass

        # Extract internship cards from the page
        cards = extract_cards(page)
        for card in cards:
            card_id = generate_id(card["companyName"], card["roleTitle"], card["state"])
            card["id"] = card_id
            seen_ids.add(card_id)

            if card_id not in existing_ids:
                card["firstSeen"] = datetime.now().isoformat()
                card["isActive"] = True
                new_internships.append(card)
                print(f"  ✓ NEW: {card['companyName']} — {card['roleTitle']} ({card['state']})")
            
            card["lastSeen"] = datetime.now().isoformat()
            card["scrapedAt"] = datetime.now().isoformat()

        # Try scrolling the carousel for more cards
        print("\n→ Checking for more internships in carousel...")
        for _ in range(5):
            try:
                # Look for next arrow button in the carousel
                next_btn = page.query_selector('[class*="next"], [class*="arrow-right"], button[aria-label*="next"]')
                if next_btn:
                    next_btn.click()
                    time.sleep(SCROLL_DELAY)
                    more_cards = extract_cards(page)
                    for card in more_cards:
                        card_id = generate_id(card["companyName"], card["roleTitle"], card["state"])
                        if card_id not in seen_ids:
                            card["id"] = card_id
                            seen_ids.add(card_id)
                            if card_id not in existing_ids:
                                card["firstSeen"] = datetime.now().isoformat()
                                card["isActive"] = True
                                new_internships.append(card)
                                print(f"  ✓ NEW: {card['companyName']} — {card['roleTitle']} ({card['state']})")
                            card["lastSeen"] = datetime.now().isoformat()
                            card["scrapedAt"] = datetime.now().isoformat()
                else:
                    break
            except:
                break

        # Try using filter dropdowns to get more data
        print("\n→ Trying filter combinations for broader coverage...")
        try:
            scrape_with_filters(page, seen_ids, existing_ids, new_internships)
        except Exception as e:
            print(f"  ⚠ Filter scraping failed: {e}")

        browser.close()

    # Merge with existing data
    merged = merge_data(existing_data, new_internships, seen_ids)
    save_data(merged)

    print(f"\n{'=' * 60}")
    print(f"Scraping complete!")
    print(f"  New internships found: {len(new_internships)}")
    print(f"  Total in database: {len(merged['internships'])}")
    print(f"  Active listings: {sum(1 for i in merged['internships'] if i.get('isActive', True))}")
    print(f"{'=' * 60}")

    return merged


def extract_cards(page) -> list:
    """Extract internship data from visible cards on the page."""
    cards = []
    
    try:
        # Try different selectors for internship cards
        card_elements = page.query_selector_all('[class*="internship-card"], [class*="featured"] [class*="card"], [class*="slick-slide"]:not([class*="cloned"])')
        
        if not card_elements:
            # Broader fallback: look for any card-like elements in the featured section
            card_elements = page.query_selector_all('[class*="chakra-card"], [class*="css-"] > div')

        for el in card_elements:
            try:
                text = el.inner_text()
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                
                if len(lines) < 3:
                    continue

                # Parse card text — typical structure from the portal:
                # Pin / Compare
                # COMPANY NAME  
                # ROLE TITLE
                # Job Function
                # Sector / STATE
                # View Details
                
                company = ""
                role = ""
                sector = ""
                job_function = ""
                state = ""
                field_category = ""

                # Look for known patterns
                for i, line in enumerate(lines):
                    upper = line.upper()
                    # Skip UI elements
                    if upper in ['PIN', 'COMPARE', 'VIEW DETAILS', 'FROM YOUR LOCATION', 'EXPLORE MORE INTERNSHIPS']:
                        continue
                    
                    # Company names are usually all caps and contain "LIMITED", "LTD", "CORPORATION", etc.
                    if any(kw in upper for kw in ['LIMITED', 'LTD', 'CORPORATION', 'INDUSTRIES', 'FORGE', 'STEEL', 'ELECTRONICS']):
                        company = line.strip()
                        continue

                    # States are known
                    known_states = ['KARNATAKA', 'MAHARASHTRA', 'GUJARAT', 'DELHI', 'TAMIL NADU', 
                                   'TELANGANA', 'UTTAR PRADESH', 'HARYANA', 'RAJASTHAN', 'MADHYA PRADESH',
                                   'WEST BENGAL', 'KERALA', 'PUNJAB', 'JHARKHAND', 'ASSAM', 'ODISHA',
                                   'ANDHRA PRADESH', 'BIHAR', 'CHHATTISGARH', 'GOA', 'UTTARAKHAND']
                    found_state = [s for s in known_states if s in upper]
                    if found_state:
                        state = found_state[0]
                        # The line may contain "Sector / STATE"
                        remainder = line.replace(state, '').strip(' /')
                        if remainder and not sector:
                            sector = remainder.strip()
                        continue
                    
                    # Sector keywords
                    sector_keywords = ['Aviation', 'Defence', 'Oil', 'Gas', 'Energy', 'Manufacturing', 
                                      'Information Technology', 'IT', 'Banking', 'Automobile', 'Pharma',
                                      'Infrastructure', 'Power', 'Metals', 'Telecom', 'FMCG']
                    if any(kw.lower() in line.lower() for kw in sector_keywords) and not sector:
                        sector = line.strip()
                        continue

                    # Role is usually the first significant text after company
                    if not role and company and len(line) > 3:
                        role = line.strip()
                        continue

                    # Job function is usually after role
                    if not job_function and role and len(line) > 3:
                        job_function = line.strip()
                        continue

                if company and role:
                    cards.append({
                        "companyName": company,
                        "roleTitle": role.upper(),
                        "sector": sector or "General",
                        "jobFunction": job_function or "General",
                        "state": state or "PAN INDIA",
                        "district": "",
                        "fieldCategory": infer_field_category(role),
                        "sourceUrl": "https://pminternship.mca.gov.in"
                    })
            except Exception as e:
                continue
    except Exception as e:
        print(f"  ⚠ Card extraction error: {e}")
    
    return cards


def infer_field_category(role: str) -> str:
    """Infer the education field from the role title."""
    role_upper = role.upper()
    if any(kw in role_upper for kw in ['B.TECH', 'B TECH', 'BTECH', 'BE ', 'B.E.']):
        return 'B.Tech / B.E.'
    if any(kw in role_upper for kw in ['MBA', 'MANAGEMENT']):
        return 'MBA'
    if any(kw in role_upper for kw in ['ITI', 'TECHNICIAN', 'OPERATOR', 'CNC']):
        return 'ITI'
    if any(kw in role_upper for kw in ['DIPLOMA', 'POLYTECHNIC', 'AUTOCAD']):
        return 'Polytechnic Diploma'
    if any(kw in role_upper for kw in ['M.TECH', 'M TECH']):
        return 'M.Tech / M.E.'
    if any(kw in role_upper for kw in ['M.SC', 'MSC']):
        return 'M.Sc'
    if any(kw in role_upper for kw in ['B.SC', 'BSC']):
        return 'B.Sc'
    if any(kw in role_upper for kw in ['BCA', 'MCA']):
        return 'BCA'
    return 'B.Tech / B.E.'  # Default assumption


def scrape_with_filters(page, seen_ids: set, existing_ids: set, new_internships: list):
    """Try different filter combinations to get more unique listings."""
    # Get available states from the dropdown
    try:
        state_dropdown = page.query_selector('select[name*="state"], [class*="state"] select, [placeholder*="State"]')
        if state_dropdown:
            state_dropdown.click()
            time.sleep(0.5)
            
            options = page.query_selector_all('option, [role="option"]')
            states = [opt.inner_text().strip() for opt in options if opt.inner_text().strip() and opt.inner_text().strip() != "Select States"]
            
            for state in states[:10]:  # Limit to first 10 states for speed
                try:
                    state_dropdown.select_option(label=state)
                    time.sleep(SCROLL_DELAY)
                    
                    cards = extract_cards(page)
                    for card in cards:
                        card_id = generate_id(card["companyName"], card["roleTitle"], card["state"])
                        if card_id not in seen_ids:
                            card["id"] = card_id
                            seen_ids.add(card_id)
                            if card_id not in existing_ids:
                                card["firstSeen"] = datetime.now().isoformat()
                                card["isActive"] = True
                                new_internships.append(card)
                                print(f"  ✓ NEW (via filter): {card['companyName']} — {card['roleTitle']}")
                            card["lastSeen"] = datetime.now().isoformat()
                    
                except Exception:
                    continue
            
            # Reset filter
            try:
                reset_btn = page.query_selector('[class*="remove-filter"], button:has-text("Remove")')
                if reset_btn:
                    reset_btn.click()
                    time.sleep(1)
            except:
                pass
    except Exception as e:
        print(f"  ⚠ Filter interaction failed: {e}")


def merge_data(existing: dict, new_items: list, seen_ids: set) -> dict:
    """Merge new scraped data with existing database."""
    existing_map = {i["id"]: i for i in existing.get("internships", [])}
    
    # Update existing entries that were seen
    for intern_id, intern in existing_map.items():
        if intern_id in seen_ids:
            intern["lastSeen"] = datetime.now().isoformat()
            intern["isActive"] = True
        else:
            # If not seen for EXPIRY_DAYS, mark as inactive
            last_seen = datetime.fromisoformat(intern.get("lastSeen", datetime.now().isoformat()))
            if (datetime.now() - last_seen) > timedelta(days=EXPIRY_DAYS):
                intern["isActive"] = False
    
    # Add new items
    for item in new_items:
        existing_map[item["id"]] = item
    
    return {
        "internships": list(existing_map.values()),
        "last_scraped": datetime.now().isoformat()
    }


def export_for_frontend(data: dict):
    """Export scraped data as a TypeScript file for the frontend to consume."""
    ts_file = Path(__file__).parent.parent / "src" / "data" / "scrapedInternships.ts"
    
    internships = [i for i in data["internships"] if i.get("isActive", True)]
    
    lines = [
        "// AUTO-GENERATED by scraper.py — Do not edit manually",
        f"// Last scraped: {data.get('last_scraped', 'unknown')}",
        f"// Total active listings: {len(internships)}",
        "",
        "import { Internship } from './sampleInternships'",
        "",
        "export const SCRAPED_INTERNSHIPS: Internship[] = " + json.dumps(internships, indent=2),
        ""
    ]
    
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"✓ Frontend data exported to {ts_file}")


if __name__ == "__main__":
    data = scrape_internships()
    export_for_frontend(data)
    print("\nDone! You can now import SCRAPED_INTERNSHIPS in the frontend.")

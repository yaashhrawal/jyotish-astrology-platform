# Jyotish — Business & Monetization Plan

_Owner: Yash Rawal · Model: freemium SaaS for astrologers + dropship gem referrals_

---

## 1. The model in one line
**All astrology calculations are free forever. We charge ₹500/mo for the practice-management tools, and earn a margin on gemstone referrals (free to recommend, dropship-fulfilled).**

Two revenue streams:
1. **₹500/mo subscription** → business-management suite (recurring, B2B).
2. **Gem referral margin** → available on the free tier (transaction, aligns astrologer + platform incentives).

---

## 2. Feature → tier mapping

### FREE tier (no paywall — the acquisition engine)
- **Every calculation**: birth chart, 16 divisional charts + customizable board, all dasha systems, panchang (Drik-accurate), ashtakavarga, shadbala, KP, Jaimini, yogas, doshas, transits, compatibility (Ashtakoota), muhurta, prashna, varga-aware analysis, remedies
- **Gem recommendations + referral commission** (recommend → earn on the sale)
- Save a limited number of charts (e.g. 3–5) + trilingual UI + mobile app

### ₹500/mo "Practice" tier (the business-management tool — what they pay for)
- **CRM**: clients, sessions, appointments, invoices
- **Branded PDF reports** + letterhead / brand profile (logo, signature, colors)
- **Client portal** (shareable link — client sees their charts/reports)
- **Prediction tracker** (log predictions, track accuracy — credibility engine)
- **Unlimited saved charts** + bulk / priority

> Rationale: calculations are a commodity (many free tools exist) — giving them away wins users. Astrologers pay when the product **runs their practice** (clients, invoices, branded deliverables, portal). Gems stay free so every astrologer becomes a referral earner from day one.

---

## 3. Gem referral flow (dropship / partner-fulfilled)
```
Astrologer recommends gem (from 27-SKU catalog, chart-based)
      → order created (status: recommended)  [BUILT]
      → client pays via purchase link (Razorpay)  [TO WIRE]
      → order forwarded to GEM PARTNER (dropship) who sources + certifies + ships  [PROCESS/manual first]
      → on delivery, commission cleared to astrologer  [BUILT: commission ledger]
      → astrologer withdraws earnings  [payout: manual first, automate later]
```
- **Margin** = retail − partner wholesale − astrologer commission (20–25%). Platform keeps the spread.
- **Partner**: sign one certified-gem supplier who dropships with GIA/IGI certs. No inventory held.
- Astrologer earns on the free tier → incentive to stay + recommend → gem revenue funds the free calculations.

---

## 4. What's already built vs. to-do

| Piece | Status |
|---|---|
| All calculations (free) | ✅ live |
| Gem catalog (27), recommend, orders, commission ledger, earnings dashboard | ✅ built |
| CRM (clients/sessions/appointments/invoices), prediction tracker | ✅ built |
| Brand profile, PDF reports, client portal | ✅ built |
| `users.plan` field (free/trial/practitioner/professional) | ✅ exists |
| **Re-gating to this model** (gems→free, business tools→₹500) | ⚠️ TODO |
| **Razorpay** (subscription + gem checkout + webhooks) | ⚠️ TODO |
| **Gem dropship partner** (supplier agreement, cert flow) | ⚠️ business, not code |
| Payout mechanism for astrologer commissions | ⚠️ manual first |

---

## 5. Implementation phases (code)

**Phase 1 — Re-gate to the free/₹500 model** _(no payments needed; do first)_
- Move **Gems + Earnings** out of the astrologer-only "Business" section → available to **all logged-in users** (free tier earns referrals).
- Gate **CRM · Invoices · Reports · Brand · Client portal · Prediction tracker** behind `plan ∈ {trial, practitioner, professional}` — free users see an upgrade prompt.
- Add a lightweight **plan check** helper (backend dependency + frontend gate) using the existing `users.plan`.

**Phase 2 — Payments (Razorpay), when you're ready**
- Razorpay **Subscriptions** for the ₹500 plan → webhook flips `users.plan` → 'practitioner'.
- Razorpay **checkout** on the gem purchase link → on payment, order → 'paid' → commission accrues (already wired on status change).
- Trial → auto-downgrade to free on expiry (already implemented lazily).

**Phase 3 — Growth loops**
- Client portal = viral surface (clients see astrologer's brand → some become astrologers).
- Gem earnings visible on free tier = retention hook.
- "Powered by Jyotish" footer on free PDFs (Pro removes it).

---

## 6. Pricing (LOCKED direction — exact numbers TBD)
- **Single paid tier**, geo-priced: **₹500/mo (India)** · **~$10/mo (rest of world)**. (Drop the old ₹1,299 tier.)
- **30-day free trial** of the **complete business account** (all business features unlocked), then → free tier (calc + gems only).
- Build the plan/gating/trial + geo-pricing **scaffold now**; plug final numbers in later.
- Gem margin is upside on top; even free/trial users generate gem revenue.
- Infra ~₹0 (Oracle Always Free) → near-pure margin.

### Gem final-price formula (dealer finalized — dropship)
```
client price = dealer wholesale + platform margin + astrologer commission + SHIPPING
```
- **Shipping is the open variable** (owner to define: flat? by weight/carat? by pincode zone?). Build the gem price with a **configurable shipping component** so the formula can change without code edits.

---

## 7. Geo-pricing mechanics (scaffold)
- Detect region (India vs rest) → server-side by IP or user profile country; default India.
- `plans` config: `{ IN: {price: 500, currency: 'INR'}, INTL: {price: 10, currency: 'USD'} }` — numbers editable in one place.
- Upgrade prompt + (later) Razorpay picks the amount/currency by region.

---

## Open decisions for you
1. **Free-tier saved-chart limit** — 3? 5? unlimited?
2. **Shipping formula** for gem final price (flat / weight / pincode zone)?
3. Final numbers: confirm ₹500 / $10 (or adjust).

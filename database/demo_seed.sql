-- ============================================================
-- Demo environment seed data
-- Run AFTER init.sql on jyotish_demo database
-- Creates a demo user with pre-built charts and CRM data
-- ============================================================

-- Demo user (plan=professional so all features accessible)
INSERT INTO users (id, email, password_hash, name, phone, plan) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'demo@jyotish.app',
  -- password: "demo1234" (bcrypt)
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsAVMfkf.Hb3K7B.7J9F8L5zQ.ZC',
  'Demo Astrologer',
  '+91-9999999999',
  'professional'
) ON CONFLICT (id) DO NOTHING;

-- Demo clients
INSERT INTO clients (id, user_id, name, phone, email, notes, tags) VALUES
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001',
 'Rahul Sharma', '+91-9876543210', 'rahul@example.com',
 'Regular client. Interested in career and marriage timing.', ARRAY['career','marriage']),
('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001',
 'Priya Mehta', '+91-9876543211', 'priya@example.com',
 'Wants health and relationship guidance.', ARRAY['health','relationship']),
('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001',
 'Vikram Nair', '+91-9876543212', 'vikram@example.com',
 'Business timing queries.', ARRAY['business','finance'])
ON CONFLICT (id) DO NOTHING;

-- Demo charts
INSERT INTO charts (id, user_id, client_id, name, birth_date, birth_time, birth_tz, birth_place,
                    latitude, longitude, ayanamsa, chart_data, ascendant_sign, moon_sign, sun_sign,
                    atmakaraka, active_md) VALUES
(
  '00000000-0000-0000-0002-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Rahul Sharma', '1990-03-15', '06:30', 5.5, 'Mumbai, Maharashtra',
  19.0760, 72.8777, 'lahiri', '{}', 'Aquarius', 'Scorpio', 'Pisces', 'Saturn', 'Jupiter'
),
(
  '00000000-0000-0000-0002-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000002',
  'Priya Mehta', '1992-08-22', '14:15', 5.5, 'Delhi, India',
  28.6139, 77.2090, 'lahiri', '{}', 'Scorpio', 'Taurus', 'Leo', 'Moon', 'Saturn'
),
(
  '00000000-0000-0000-0002-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000003',
  'Vikram Nair', '1985-11-07', '23:45', 5.5, 'Chennai, Tamil Nadu',
  13.0827, 80.2707, 'lahiri', '{}', 'Leo', 'Capricorn', 'Scorpio', 'Jupiter', 'Mercury'
)
ON CONFLICT (id) DO NOTHING;

-- Demo sessions
INSERT INTO sessions (user_id, client_id, chart_id, session_date, duration_mins, fee_charged, currency, status, notes)
VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001',
 '00000000-0000-0000-0002-000000000001', '2026-03-10', 60, 1500, 'INR', 'completed',
 'Career guidance for Saturn mahadasha. Advised patience till 2027.'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002',
 '00000000-0000-0000-0002-000000000002', '2026-04-01', 45, 1200, 'INR', 'completed',
 'Marriage timing — Venus antardasha favorable in late 2026.'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003',
 '00000000-0000-0000-0002-000000000003', '2026-04-20', 90, 2500, 'INR', 'completed',
 'Business expansion timing. Mercury dasha favorable for tech ventures.');

-- Demo predictions
INSERT INTO predictions (user_id, chart_id, prediction_text, category, predicted_for, outcome)
VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001',
 'Job change likely between Oct–Dec 2026 during Jupiter antardasha', 'career', '2026-Q4', 'pending'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000002',
 'Marriage highly indicated in Venus antardasha, Nov 2026 – Mar 2027', 'relationship', '2026-2027', 'pending'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001',
 'Foreign travel or opportunity in Rahu sub-period around mid 2025', 'travel', '2025-mid', 'fulfilled');

-- Demo invoices
INSERT INTO invoices (user_id, client_id, amount, currency, status, issued_on, paid_on)
VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 1500, 'INR', 'paid', '2026-03-10', '2026-03-10'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 1200, 'INR', 'paid', '2026-04-01', '2026-04-02'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', 2500, 'INR', 'unpaid', '2026-04-20', NULL);

-- FUEGO IGNITE: Waitlist Table Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fdxdypspaeixfmqyfeac/sql/new

-- 1. Create waitlist table
CREATE TABLE IF NOT EXISTS ignite_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'hero',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE ignite_waitlist ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous inserts (for waitlist signup from landing page)
DROP POLICY IF EXISTS "Allow anonymous insert" ON ignite_waitlist;
CREATE POLICY "Allow anonymous insert" ON ignite_waitlist
  FOR INSERT TO anon WITH CHECK (true);

-- 4. Allow anonymous select (for spots remaining counter)
DROP POLICY IF EXISTS "Allow anonymous select" ON ignite_waitlist;
CREATE POLICY "Allow anonymous select" ON ignite_waitlist
  FOR SELECT TO anon USING (true);

-- 5. Email alert trigger (sends to info@fuego-padel.com via Resend)
-- Same pattern as signup alert trigger
CREATE OR REPLACE FUNCTION notify_ignite_waitlist()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer re_123_YOUR_RESEND_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'FUEGO PADEL <noreply@fuego-padel.com>',
      'to', ARRAY['info@fuego-padel.com'],
      'subject', '🔥 IGNITE Waitlist: ' || NEW.email,
      'html', '<div style="font-family:system-ui;background:#0D0D0D;color:#fff;padding:40px;border-radius:12px;">' ||
        '<h1 style="color:#CCFF00;margin:0 0 16px;">🔥 New IGNITE Waitlist Signup</h1>' ||
        '<p style="color:#999;margin:0 0 8px;">Email: <strong style="color:#fff;">' || NEW.email || '</strong></p>' ||
        '<p style="color:#999;margin:0 0 8px;">Source: ' || COALESCE(NEW.source, 'unknown') || '</p>' ||
        '<p style="color:#999;margin:0;">Signed up: ' || to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI') || ' UTC</p>' ||
        '</div>'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ignite_waitlist_insert ON ignite_waitlist;
CREATE TRIGGER on_ignite_waitlist_insert
  AFTER INSERT ON ignite_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION notify_ignite_waitlist();

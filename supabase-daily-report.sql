-- FUEGO IGNITE: Daily Summary Email (pg_cron)
-- Sends daily report at 08:00 UTC to info@fuego-padel.com via Resend
-- Deploy in Supabase SQL Editor

-- 1. Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the report function
CREATE OR REPLACE FUNCTION send_daily_report()
RETURNS void AS $fn$
DECLARE
  resend_api_key TEXT;
  new_waitlist INT;
  new_dna INT;
  total_waitlist INT;
  total_dna INT;
  remaining INT;
  signup_rows TEXT;
  email_html TEXT;
  today_start TIMESTAMPTZ;
BEGIN
  today_start := date_trunc('day', now() AT TIME ZONE 'UTC');

  SELECT decrypted_secret INTO resend_api_key
  FROM vault.decrypted_secrets WHERE name = 'resend_api_key' LIMIT 1;

  SELECT COUNT(*) INTO new_waitlist FROM ignite_waitlist WHERE created_at >= today_start;
  SELECT COUNT(*) INTO new_dna FROM player_dna WHERE created_at >= today_start;
  SELECT COUNT(*) INTO total_waitlist FROM ignite_waitlist;
  SELECT COUNT(*) INTO total_dna FROM player_dna;
  remaining := GREATEST(0, 1000 - total_waitlist);

  -- Build signup rows for today
  SELECT COALESCE(string_agg(
    '<tr><td style="padding:6px 12px;border-bottom:1px solid #222;">' || COALESCE(first_name,'—') || '</td>'
    || '<td style="padding:6px 12px;border-bottom:1px solid #222;">' || COALESCE(last_name,'—') || '</td>'
    || '<td style="padding:6px 12px;border-bottom:1px solid #222;">' || email || '</td>'
    || '<td style="padding:6px 12px;border-bottom:1px solid #222;">' || COALESCE(source,'—') || '</td>'
    || '<td style="padding:6px 12px;border-bottom:1px solid #222;">' || to_char(created_at, 'HH24:MI') || ' UTC</td></tr>',
    ''
  ), '') INTO signup_rows
  FROM ignite_waitlist WHERE created_at >= today_start ORDER BY created_at;

  -- Build email HTML
  email_html :=
    '<div style="font-family:system-ui;background:#0D0D0D;color:#fff;padding:40px;border-radius:12px;max-width:700px;">'
    || '<h1 style="color:#CCFF00;margin:0 0 24px;font-size:24px;">FUEGO IGNITE Daily Report</h1>'
    || '<p style="color:#999;margin:0 0 8px;">' || to_char(now(), 'DD Mon YYYY') || '</p>'
    || '<div style="display:flex;gap:16px;margin:24px 0;">'
    || '<div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:20px;flex:1;text-align:center;">'
    || '<p style="color:#666;margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;">New Waitlist</p>'
    || '<p style="color:#CCFF00;margin:0;font-size:32px;font-weight:800;">' || new_waitlist || '</p></div>'
    || '<div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:20px;flex:1;text-align:center;">'
    || '<p style="color:#666;margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;">New DNA</p>'
    || '<p style="color:#CCFF00;margin:0;font-size:32px;font-weight:800;">' || new_dna || '</p></div></div>'
    || '<table style="width:100%;margin:16px 0;color:#999;font-size:13px;">'
    || '<tr><td>Waitlist Total</td><td style="text-align:right;color:#fff;font-weight:700;">' || total_waitlist || '</td></tr>'
    || '<tr><td>DNA Total</td><td style="text-align:right;color:#fff;font-weight:700;">' || total_dna || '</td></tr>'
    || '<tr><td>Counter shows</td><td style="text-align:right;color:#CCFF00;font-weight:700;">' || remaining || ' of 1,000 remaining</td></tr>'
    || '</table>';

  IF new_waitlist > 0 THEN
    email_html := email_html
      || '<h2 style="color:#fff;font-size:16px;margin:32px 0 12px;">Today''s Signups</h2>'
      || '<table style="width:100%;border-collapse:collapse;font-size:12px;color:#ccc;">'
      || '<tr style="color:#666;text-transform:uppercase;letter-spacing:1px;font-size:10px;">'
      || '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #333;">First</th>'
      || '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #333;">Last</th>'
      || '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #333;">Email</th>'
      || '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #333;">Source</th>'
      || '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #333;">Time</th></tr>'
      || signup_rows || '</table>';
  ELSE
    email_html := email_html
      || '<p style="color:#666;margin:32px 0 0;font-style:italic;">No new signups today.</p>';
  END IF;

  email_html := email_html || '</div>';

  -- Send via Resend
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'FUEGO PADEL <noreply@fuego-padel.com>',
      'to', ARRAY['info@fuego-padel.com'],
      'subject', 'FUEGO IGNITE Daily Report — ' || to_char(now(), 'DD Mon YYYY'),
      'html', email_html
    )
  );
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule daily at 08:00 UTC
SELECT cron.schedule(
  'daily-ignite-report',
  '0 8 * * *',
  'SELECT send_daily_report();'
);

-- To test manually:
-- SELECT send_daily_report();

-- To unschedule:
-- SELECT cron.unschedule('daily-ignite-report');

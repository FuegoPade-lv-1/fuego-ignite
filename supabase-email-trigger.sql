-- FUEGO IGNITE: Waitlist Email Trigger
-- Sends TWO emails on each ignite_waitlist INSERT:
--   1. Branded confirmation email to the user
--   2. Alert email to info@fuego-padel.com
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION notify_ignite_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  resend_api_key TEXT;
  position_number INT;
  logo_url TEXT := 'https://app.fuego-padel.com/icon-512x512.png';
BEGIN
  -- Get Resend API key from vault
  SELECT decrypted_secret INTO resend_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'resend_api_key'
  LIMIT 1;

  -- Calculate position number (order of signup)
  SELECT COUNT(*) INTO position_number FROM ignite_waitlist WHERE created_at <= NEW.created_at;

  -- ════════════════════════════════════════════
  -- MAIL 1: Branded confirmation to the user
  -- ════════════════════════════════════════════
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'FUEGO PADEL <noreply@fuego-padel.com>',
      'to', ARRAY[NEW.email],
      'subject', 'You''re on the list — FUEGO IGNITE',
      'html',
        '<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:system-ui,-apple-system,sans-serif;">'
        || '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0D0D0D;">'
        || '<tr><td align="center" style="padding:40px 20px;">'
        || '<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">'

        -- Logo
        || '<tr><td align="center" style="padding:0 0 32px 0;">'
        || '<img src="' || logo_url || '" alt="FUEGO PADEL" width="80" height="80" style="display:block;border:0;outline:none;" />'
        || '</td></tr>'

        -- Headline
        || '<tr><td align="center" style="padding:0 0 24px 0;">'
        || '<h1 style="margin:0;font-size:36px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;">You''re on the list.</h1>'
        || '</td></tr>'

        -- Body text
        || '<tr><td align="center" style="padding:0 0 32px 0;">'
        || '<p style="margin:0;font-size:16px;line-height:1.6;color:#999999;max-width:440px;">'
        || 'Welcome to the FUEGO IGNITE Founding Members Programme. '
        || 'You''re one step closer to becoming one of 1,000 Founding Members. '
        || 'We''ll notify you the moment spots open up.'
        || '</p>'
        || '</td></tr>'

        -- Position badge
        || '<tr><td align="center" style="padding:0 0 40px 0;">'
        || '<div style="display:inline-block;padding:16px 32px;border-radius:12px;background:rgba(204,255,0,0.08);border:1px solid rgba(204,255,0,0.2);">'
        || '<p style="margin:0 0 4px 0;font-size:11px;letter-spacing:3px;color:#999999;text-transform:uppercase;font-family:monospace;">Your position</p>'
        || '<p style="margin:0;font-size:32px;font-weight:800;color:#CCFF00;letter-spacing:-1px;">#' || LPAD(position_number::TEXT, 4, '0') || '</p>'
        || '</div>'
        || '</td></tr>'

        -- CTA Button
        || '<tr><td align="center" style="padding:0 0 48px 0;">'
        || '<a href="https://fuego-padel.com" target="_blank" style="display:inline-block;padding:16px 40px;background:#CCFF00;color:#000000;font-weight:700;font-size:14px;letter-spacing:0.5px;text-decoration:none;border-radius:12px;">VISIT FUEGO PADEL</a>'
        || '</td></tr>'

        -- Divider
        || '<tr><td style="padding:0 0 24px 0;border-top:1px solid rgba(255,255,255,0.06);"></td></tr>'

        -- Footer
        || '<tr><td align="center" style="padding:0;">'
        || '<p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#CCFF00;">FUEGO PADEL</p>'
        || '<p style="margin:0;font-size:11px;letter-spacing:2px;color:#444444;text-transform:uppercase;font-family:monospace;">Nobody knows the score. We do.</p>'
        || '</td></tr>'

        || '</table></td></tr></table></body>'
    )
  );

  -- ════════════════════════════════════════════
  -- MAIL 2: Alert to info@fuego-padel.com
  -- ════════════════════════════════════════════
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'FUEGO PADEL <noreply@fuego-padel.com>',
      'to', ARRAY['info@fuego-padel.com'],
      'subject', 'IGNITE Waitlist #' || position_number || ': ' || NEW.email,
      'html',
        '<div style="font-family:system-ui;background:#0D0D0D;color:#fff;padding:40px;border-radius:12px;">'
        || '<h1 style="color:#CCFF00;margin:0 0 16px;font-size:24px;">IGNITE Waitlist Signup #' || position_number || '</h1>'
        || '<p style="color:#999;margin:0 0 8px;">Email: <strong style="color:#fff;">' || NEW.email || '</strong></p>'
        || '<p style="color:#999;margin:0 0 8px;">Source: ' || COALESCE(NEW.source, 'unknown') || '</p>'
        || '<p style="color:#999;margin:0 0 8px;">Position: #' || position_number || '</p>'
        || '<p style="color:#999;margin:0;">Signed up: ' || to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI') || ' UTC</p>'
        || '</div>'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_ignite_waitlist_insert ON ignite_waitlist;
CREATE TRIGGER on_ignite_waitlist_insert
  AFTER INSERT ON ignite_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION notify_ignite_waitlist();

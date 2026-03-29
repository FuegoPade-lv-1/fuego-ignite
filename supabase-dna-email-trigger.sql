-- FUEGO IGNITE: Player DNA Email Trigger
-- Sends a Player DNA Report email on each player_dna INSERT
-- Run this in Supabase SQL Editor after supabase-email-trigger.sql
-- https://supabase.com/dashboard/project/fdxdypspaeixfmqyfeac/sql/new

CREATE OR REPLACE FUNCTION notify_player_dna()
RETURNS TRIGGER AS $$
DECLARE
  resend_api_key TEXT;
  logo_url TEXT := 'https://app.fuego-padel.com/icon-192x192.png';
  display_name TEXT;
  tier_label TEXT;
  user_html TEXT;
BEGIN
  -- Get Resend API key from vault
  SELECT decrypted_secret INTO resend_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'resend_api_key'
  LIMIT 1;

  -- Build display name
  display_name := COALESCE(NULLIF(TRIM(NEW.first_name), ''), 'Player');

  -- Calculate tier from score
  tier_label := CASE
    WHEN NEW.score >= 8.6 THEN 'ELITE'
    WHEN NEW.score >= 7.1 THEN 'ADVANCED'
    WHEN NEW.score >= 5.1 THEN 'ADVANCED INTERMEDIATE'
    WHEN NEW.score >= 3.1 THEN 'INTERMEDIATE'
    ELSE 'BEGINNER'
  END;

  -- ════════════════════════════════════════════
  -- MAIL 1: Player DNA Report to user
  -- ════════════════════════════════════════════
  user_html :=
    '<!DOCTYPE html>'
    || '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
    || '<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:''Inter'',system-ui,-apple-system,''Segoe UI'',sans-serif;-webkit-font-smoothing:antialiased;">'

    -- Outer wrapper table
    || '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0D0D0D;">'
    || '<tr><td align="center" style="padding:48px 16px;">'

    -- Inner card
    || '<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">'

    -- ── Top accent line ──
    || '<tr><td style="height:3px;background:linear-gradient(90deg,#CCFF00 0%,rgba(204,255,0,0.3) 100%);font-size:0;line-height:0;">&nbsp;</td></tr>'

    -- ── Logo section ──
    || '<tr><td align="center" style="padding:40px 40px 0 40px;">'
    || '<img src="' || logo_url || '" alt="FUEGO PADEL" width="64" height="64" style="display:block;border:0;outline:none;border-radius:12px;" />'
    || '</td></tr>'

    -- ── "FUEGO PADEL" text ──
    || '<tr><td align="center" style="padding:16px 40px 0 40px;">'
    || '<p style="margin:0;font-size:13px;font-weight:800;letter-spacing:4px;color:rgba(255,255,255,0.4);text-transform:uppercase;font-family:''Courier New'',monospace;">FUEGO PADEL</p>'
    || '</td></tr>'

    -- ── Divider ──
    || '<tr><td style="padding:24px 40px 0 40px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>'

    -- ── Headline: YOUR PLAYER DNA ──
    || '<tr><td align="center" style="padding:32px 40px 0 40px;">'
    || '<h1 style="margin:0;font-size:32px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;line-height:1.1;">YOUR PLAYER DNA</h1>'
    || '</td></tr>'

    -- ── Subtext ──
    || '<tr><td align="center" style="padding:12px 40px 0 40px;">'
    || '<p style="margin:0;font-size:16px;line-height:1.6;color:#888888;max-width:440px;">'
    || display_name || ', here is your personalised FUEGO performance profile.'
    || '</p>'
    || '</td></tr>'

    -- ── Score box ──
    || '<tr><td align="center" style="padding:32px 40px 0 40px;">'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">'
    || '<tr><td align="center" style="padding:24px 48px;border-radius:16px;background-color:#1A1A1A;border:1px solid #2A2A2A;">'
    || '<p style="margin:0 0 8px 0;font-size:11px;letter-spacing:4px;color:#666666;text-transform:uppercase;font-family:''Courier New'',monospace;">FUEGO SCORE</p>'
    || '<p style="margin:0;font-size:56px;font-weight:800;color:#CCFF00;letter-spacing:-2px;font-family:''Courier New'',monospace;line-height:1;">' || TO_CHAR(NEW.score, 'FM9.0') || '</p>'
    || '<p style="margin:8px 0 0 0;font-size:13px;color:#888888;font-family:''Courier New'',monospace;">' || tier_label || '</p>'
    || '</td></tr>'
    || '</table>'
    || '</td></tr>'

    -- ── Accent line separator ──
    || '<tr><td style="padding:32px 40px 0 40px;"><div style="height:2px;background:#CCFF00;opacity:0.15;border-radius:1px;"></div></td></tr>'

    -- ── WHAT THIS MEANS section ──
    || '<tr><td style="padding:32px 40px 0 40px;">'
    || '<p style="margin:0 0 20px 0;font-size:11px;letter-spacing:4px;color:#CCFF00;text-transform:uppercase;font-family:''Courier New'',monospace;font-weight:700;">WHAT THIS MEANS</p>'

    || '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">'
    || '<tr>'
    || '<td width="32" valign="top" style="padding-top:2px;font-size:14px;">&#128200;</td>'
    || '<td style="padding-left:8px;">'
    || '<p style="margin:0;font-size:14px;font-weight:700;color:#FFFFFF;">Your Performance Profile</p>'
    || '<p style="margin:4px 0 0 0;font-size:13px;color:#666666;line-height:1.5;">Your FUEGO Score of ' || TO_CHAR(NEW.score, 'FM9.0') || '/10 places you in the ' || tier_label || ' tier. This score is calculated across 8 performance axes.</p>'
    || '</td></tr></table>'

    || '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">'
    || '<tr>'
    || '<td width="32" valign="top" style="padding-top:2px;font-size:14px;">&#127942;</td>'
    || '<td style="padding-left:8px;">'
    || '<p style="margin:0;font-size:14px;font-weight:700;color:#FFFFFF;">Imported Into Your App</p>'
    || '<p style="margin:4px 0 0 0;font-size:13px;color:#666666;line-height:1.5;">When FUEGO PADEL launches, your Player DNA will be imported automatically. You won''t start from zero.</p>'
    || '</td></tr></table>'

    || '<table role="presentation" cellpadding="0" cellspacing="0" width="100%">'
    || '<tr>'
    || '<td width="32" valign="top" style="padding-top:2px;font-size:14px;">&#128640;</td>'
    || '<td style="padding-left:8px;">'
    || '<p style="margin:0;font-size:14px;font-weight:700;color:#FFFFFF;">Track Your Growth</p>'
    || '<p style="margin:4px 0 0 0;font-size:13px;color:#666666;line-height:1.5;">Every match you play with FUEGO updates your score in real time. Watch your game evolve.</p>'
    || '</td></tr></table>'

    || '</td></tr>'

    -- ── Accent line separator ──
    || '<tr><td style="padding:32px 40px 0 40px;"><div style="height:2px;background:#CCFF00;opacity:0.15;border-radius:1px;"></div></td></tr>'

    -- ── CTA Button ──
    || '<tr><td align="center" style="padding:32px 40px 0 40px;">'
    || '<a href="https://ignite.fuego-padel.com" target="_blank" style="display:inline-block;padding:18px 48px;background:#CCFF00;color:#000000;font-weight:800;font-size:14px;letter-spacing:1px;text-decoration:none;border-radius:14px;text-transform:uppercase;">VIEW FULL RESULTS</a>'
    || '</td></tr>'

    -- ── Bottom divider ──
    || '<tr><td style="padding:32px 40px 0 40px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>'

    -- ── Footer ──
    || '<tr><td align="center" style="padding:24px 40px 32px 40px;">'
    || '<p style="margin:0 0 8px 0;font-size:14px;font-weight:800;color:#CCFF00;letter-spacing:1px;">FUEGO PADEL</p>'
    || '<p style="margin:0 0 16px 0;font-size:11px;letter-spacing:3px;color:#444444;text-transform:uppercase;font-family:''Courier New'',monospace;">Nobody knows the score. We do.</p>'
    || '<p style="margin:0;font-size:11px;color:#333333;">'
    || '<a href="https://fuego-padel.com" style="color:#555555;text-decoration:none;">fuego-padel.com</a>'
    || '&nbsp;&nbsp;·&nbsp;&nbsp;'
    || '<a href="https://app.fuego-padel.com/terms" style="color:#555555;text-decoration:none;">Terms</a>'
    || '&nbsp;&nbsp;·&nbsp;&nbsp;'
    || '<a href="https://app.fuego-padel.com/privacy" style="color:#555555;text-decoration:none;">Privacy</a>'
    || '</p>'
    || '<p style="margin:12px 0 0 0;font-size:11px;color:#333333;">'
    || 'Don''t want to hear from us? <a href="mailto:legal@fuego-padel.com?subject=Unsubscribe&body=Please%20remove%20me%20from%20the%20FUEGO%20IGNITE%20mailing%20list.%20Email:%20' || NEW.email || '" style="color:#555555;text-decoration:underline;">Unsubscribe</a>'
    || '</p>'
    || '</td></tr>'

    -- ── Bottom accent line ──
    || '<tr><td style="height:3px;background:linear-gradient(90deg,rgba(204,255,0,0.3) 0%,#CCFF00 100%);font-size:0;line-height:0;">&nbsp;</td></tr>'

    || '</table>'
    || '</td></tr></table>'
    || '</body></html>';

  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'FUEGO PADEL <noreply@fuego-padel.com>',
      'to', ARRAY[NEW.email],
      'subject', 'Your Player DNA — FUEGO Score ' || TO_CHAR(NEW.score, 'FM9.0') || '/10',
      'html', user_html
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
      'subject', 'Player DNA Completed: ' || NEW.email || ' — Score ' || TO_CHAR(NEW.score, 'FM9.0'),
      'html',
        '<div style="font-family:system-ui;background:#0D0D0D;color:#fff;padding:40px;border-radius:12px;">'
        || '<h1 style="color:#CCFF00;margin:0 0 16px;font-size:24px;">Player DNA Assessment Completed</h1>'
        || '<p style="color:#999;margin:0 0 8px;">Email: <strong style="color:#fff;">' || NEW.email || '</strong></p>'
        || '<p style="color:#999;margin:0 0 8px;">Name: ' || COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || '</p>'
        || '<p style="color:#999;margin:0 0 8px;">FUEGO Score: <strong style="color:#CCFF00;">' || TO_CHAR(NEW.score, 'FM9.0') || '/10</strong></p>'
        || '<p style="color:#999;margin:0;">Completed: ' || to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI') || ' UTC</p>'
        || '</div>'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_player_dna_insert ON player_dna;
CREATE TRIGGER on_player_dna_insert
  AFTER INSERT ON player_dna
  FOR EACH ROW
  EXECUTE FUNCTION notify_player_dna();

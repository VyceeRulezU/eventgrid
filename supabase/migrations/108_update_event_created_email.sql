-- Migration 108: Update "Congratulations - First Event Created" email template

UPDATE public.email_templates
SET name = 'Congratulations - Event Created',
    subject = REPLACE(REPLACE(subject, 'First Event', 'Event'), 'first event', 'event'),
    body_html = REPLACE(REPLACE(body_html, 'First Event', 'Event'), 'first event', 'event')
WHERE name = 'Congratulations - First Event Created';

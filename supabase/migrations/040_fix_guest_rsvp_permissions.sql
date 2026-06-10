-- Grant service_role access to tables used by the guest-rsvp edge function
GRANT ALL ON TABLE guests TO service_role;
GRANT ALL ON TABLE events TO service_role;

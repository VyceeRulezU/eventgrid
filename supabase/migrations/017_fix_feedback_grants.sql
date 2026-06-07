-- Grant permissions for feedback table to authenticated, anon and service_role
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON feedback TO anon;
GRANT ALL ON feedback TO service_role;

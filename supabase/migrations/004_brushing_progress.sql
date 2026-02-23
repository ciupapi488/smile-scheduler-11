-- Brushing sessions and progress tracking for kids
-- COPPA compliant: minimal data, no PII beyond first name

-- Brushing sessions table
CREATE TABLE IF NOT EXISTS brushing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id TEXT NOT NULL, -- Anonymous ID, not linked to patient accounts
    child_name TEXT DEFAULT 'Anonymous',
    duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 300),
    score INTEGER DEFAULT 0,
    bacteria_killed INTEGER DEFAULT 0,
    badges_earned TEXT[] DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Brushing progress table (aggregated stats per child)
CREATE TABLE IF NOT EXISTS brushing_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id TEXT NOT NULL UNIQUE,
    child_name TEXT DEFAULT 'Anonymous',
    total_sessions INTEGER DEFAULT 0,
    total_bacteria_killed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date TIMESTAMP WITH TIME ZONE,
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_brushing_sessions_child_id ON brushing_sessions(child_id);
CREATE INDEX idx_brushing_sessions_completed_at ON brushing_sessions(completed_at);
CREATE INDEX idx_brushing_progress_streak ON brushing_progress(current_streak DESC);

-- Function to update progress trigger
CREATE OR REPLACE FUNCTION update_brushing_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_brushing_progress_timestamp ON brushing_progress;
CREATE TRIGGER update_brushing_progress_timestamp
    BEFORE UPDATE ON brushing_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_brushing_progress_timestamp();

-- RLS Policies (open for kids app, no auth required for child gameplay)
ALTER TABLE brushing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brushing_progress ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert/update for gameplay
CREATE POLICY "Allow anonymous brushing sessions"
    ON brushing_sessions
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous brushing progress"
    ON brushing_progress
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE brushing_sessions IS 'Individual brushing sessions for kids dental hygiene training';
COMMENT ON TABLE brushing_progress IS 'Aggregated brushing statistics per child';
COMMENT ON COLUMN brushing_sessions.child_id IS 'Anonymous identifier, not linked to patient accounts for COPPA compliance';

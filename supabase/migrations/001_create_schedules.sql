-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly')),
  presenters_per_session INTEGER NOT NULL
);

-- Create schedule_sessions table
CREATE TABLE IF NOT EXISTS schedule_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  presenters JSONB NOT NULL
);

-- Create indexes
CREATE INDEX idx_schedule_sessions_schedule_id ON schedule_sessions(schedule_id);
CREATE INDEX idx_schedule_sessions_date ON schedule_sessions(date);

-- Enable RLS (Row Level Security)
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (adjust based on your auth strategy)
CREATE POLICY "Allow anonymous read" ON schedules FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read" ON schedule_sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON schedule_sessions FOR INSERT WITH CHECK (true);
-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slack_id TEXT
);

-- Create indexes
CREATE INDEX idx_participants_name ON participants(name);
CREATE INDEX idx_participants_slack_id ON participants(slack_id);

-- Enable RLS (Row Level Security)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (adjust based on your auth strategy)
CREATE POLICY "Allow anonymous read" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON participants FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON participants FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_participants_updated_at 
  BEFORE UPDATE ON participants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  category TEXT NOT NULL,
  model TEXT DEFAULT 'openai',
  functions JSONB DEFAULT '[]',
  examples JSONB DEFAULT '[]',
  version TEXT DEFAULT '1.0.0',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  agent_id UUID REFERENCES agents(id),
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  task_id UUID REFERENCES tasks(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin full access on users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access on agents" ON agents
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access on tasks" ON tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access on activity_logs" ON activity_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

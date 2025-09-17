-- LEGACORE™ Multi-Agent System Database Schema
-- Enable RLS for all tables

-- Agents table to store agent configurations
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  functions JSONB DEFAULT '[]'::jsonb,
  examples JSONB DEFAULT '[]'::jsonb,
  version TEXT NOT NULL DEFAULT '1.0.0',
  provider TEXT NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai', 'gemini')),
  model TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent tasks table for tracking executions
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES public.agents(agent_id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent threads for conversation management
CREATE TABLE IF NOT EXISTS public.agent_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES public.agents(agent_id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent messages for thread conversations
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.agent_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents (admin-only access)
CREATE POLICY "Allow admin to view all agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Allow admin to insert agents" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin to update agents" ON public.agents FOR UPDATE USING (true);
CREATE POLICY "Allow admin to delete agents" ON public.agents FOR DELETE USING (true);

-- RLS Policies for agent_tasks (user can only access their own tasks)
CREATE POLICY "Users can view their own tasks" ON public.agent_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.agent_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.agent_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.agent_tasks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for agent_threads (user can only access their own threads)
CREATE POLICY "Users can view their own threads" ON public.agent_threads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own threads" ON public.agent_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own threads" ON public.agent_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own threads" ON public.agent_threads FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for agent_messages (user can only access messages from their threads)
CREATE POLICY "Users can view messages from their threads" ON public.agent_messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.agent_threads 
  WHERE agent_threads.id = agent_messages.thread_id 
  AND agent_threads.user_id = auth.uid()
));

CREATE POLICY "Users can insert messages to their threads" ON public.agent_messages FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.agent_threads 
  WHERE agent_threads.id = agent_messages.thread_id 
  AND agent_threads.user_id = auth.uid()
));

-- RLS Policies for activity_logs (user can only access their own logs)
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON public.agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_category ON public.agents(category);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON public.agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON public.agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_threads_user_id ON public.agent_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_threads_agent_id ON public.agent_threads(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_thread_id ON public.agent_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_tasks_updated_at BEFORE UPDATE ON public.agent_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_threads_updated_at BEFORE UPDATE ON public.agent_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

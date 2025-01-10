-- Create employees table with necessary constraints
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 2,
  remaining_scans INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policies for data access
CREATE POLICY "employees_select_policy" 
  ON employees FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "employees_insert_policy" 
  ON employees FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "employees_update_policy" 
  ON employees FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);
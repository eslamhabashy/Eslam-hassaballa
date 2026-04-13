
-- Create Profile Table
CREATE TABLE IF NOT EXISTS public.profile (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  photo_url TEXT,
  photo_pos INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read profile" ON public.profile FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated update profile" ON public.profile FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated insert profile" ON public.profile FOR INSERT TO authenticated WITH CHECK (true);

-- Insert initial record if not exists
INSERT INTO public.profile (id, photo_url, photo_pos)
SELECT 1, 'assets/robot.png', 50
WHERE NOT EXISTS (SELECT 1 FROM public.profile WHERE id = 1)
ON CONFLICT (id) DO NOTHING;

-- Add tags column to knowledge_files for image search by tag
ALTER TABLE public.knowledge_files
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add contact_name column to conversations table for contacts directory
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS contact_name TEXT;

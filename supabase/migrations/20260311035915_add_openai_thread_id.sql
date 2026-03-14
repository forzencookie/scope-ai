-- Add openai_thread_id to track OpenAI Assistant threads
ALTER TABLE companies ADD COLUMN IF NOT EXISTS openai_thread_id text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS openai_thread_id text;

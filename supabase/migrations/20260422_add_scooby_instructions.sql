-- Migration to allow companies to have individual AI instructions

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS scooby_instructions TEXT;

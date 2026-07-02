-- Add agent persona fields to vendors table
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "agentName" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "agentTone" TEXT DEFAULT 'Friendly';
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "agentGreeting" TEXT;

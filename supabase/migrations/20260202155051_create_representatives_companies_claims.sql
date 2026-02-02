/*
  # Create Claims Management System Tables

  1. New Tables
    - `representatives`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamptz)
    
    - `companies`
      - `id` (uuid, primary key)
      - `representative_id` (uuid, foreign key)
      - `name` (text)
      - `phone` (text)
      - `address` (text)
      - `license` (text, optional)
      - `email` (text)
      - `logo_url` (text, optional)
      - `created_at` (timestamptz)
    
    - `claims`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `representative_id` (uuid, foreign key)
      - `claim_number` (text)
      - `stage` (text)
      - `created_at` (timestamptz)
      - Homeowner information fields
      - Insurance information fields
      - Intake questions (jsonb)
      - Documents (jsonb for file references)
      - Agreements (jsonb)
      - Invoices/Receipts (jsonb)
      - Financial data (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Representatives table
CREATE TABLE IF NOT EXISTS representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage representatives"
  ON representatives
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id uuid REFERENCES representatives(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  license text,
  email text NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  representative_id uuid REFERENCES representatives(id) ON DELETE CASCADE,
  claim_number text NOT NULL,
  stage text DEFAULT 'New',
  
  -- Homeowner Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text,
  state text,
  zip_code text,
  
  -- Insurance Information
  insurance_company text,
  date_of_loss date,
  loss_description text,
  adjuster_name text,
  adjuster_phone text,
  adjuster_email text,
  
  -- Intake Questions (stored as JSONB)
  intake_questions jsonb DEFAULT '{}',
  
  -- Documents (URLs/references stored as JSONB)
  documents jsonb DEFAULT '{}',
  
  -- Agreements (URLs/references stored as JSONB)
  agreements jsonb DEFAULT '{}',
  
  -- Invoices and Receipts (stored as JSONB arrays)
  invoices jsonb DEFAULT '[]',
  receipts jsonb DEFAULT '[]',
  
  -- Financial Information
  total_client_budget numeric DEFAULT 0,
  payments jsonb DEFAULT '[]',
  client_balance numeric DEFAULT 0,
  
  -- To-Do items
  todos jsonb DEFAULT '[]',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage claims"
  ON claims
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
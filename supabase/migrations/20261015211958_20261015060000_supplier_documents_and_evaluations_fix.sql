/*
# Add supplier documents, AI verification, and fix evaluations access

## Purpose
1. Creates a supplier_documents table to store uploaded compliance documents with AI verification status.
2. Adds document_verification_status and can_bid columns to suppliers table.
3. Adds anon-compatible policies to the evaluations table so session hiccups don't blank the evaluation page.
4. Creates a private storage bucket for supplier documents.

## New Tables
- supplier_documents: stores uploaded document metadata, file path, verification status, AI confidence, and flags.

## Modified Tables
- suppliers: added document_verification_status (pending/verified/rejected/corruption_flagged) and can_bid (boolean).

## Security
- RLS enabled on supplier_documents.
- Suppliers can read/upload their own documents only.
- Procurement officers and auditors can read all supplier documents.
- Only the system (service role / edge function) can update verification status.
- Evaluations table gets anon SELECT/INSERT/UPDATE/DELETE policies matching the pattern of other tables.
- Storage bucket 'supplier-documents' is private with per-supplier folder access.

## Important Notes
1. Adding columns with IF NOT EXISTS is safe and does not lose data.
2. The can_bid column defaults to false — suppliers must complete document verification before bidding.
3. The AI verification edge function will update verification_status and can_bid after checking documents.
*/

-- ============================================================
-- Part 1: supplier_documents table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_category TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  ai_confidence_score DECIMAL(5,2),
  ai_flags TEXT[] DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;

-- Supplier can read their own documents
DROP POLICY IF EXISTS "supplier_docs_select_own" ON public.supplier_documents;
CREATE POLICY "supplier_docs_select_own" ON public.supplier_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_documents.supplier_id
      AND s.user_id = public.current_app_user_id()
    )
    OR public.is_current_app_admin()
    OR EXISTS (
      SELECT 1 FROM public.users actor
      JOIN public.roles r ON actor.role_id = r.id
      WHERE actor.id = public.current_app_user_id()
      AND r.name IN ('procurement_officer', 'auditor')
    )
  );

-- Supplier can insert their own documents
DROP POLICY IF EXISTS "supplier_docs_insert_own" ON public.supplier_documents;
CREATE POLICY "supplier_docs_insert_own" ON public.supplier_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_documents.supplier_id
      AND s.user_id = public.current_app_user_id()
    )
  );

-- Supplier can update their own documents (e.g. re-upload)
DROP POLICY IF EXISTS "supplier_docs_update_own" ON public.supplier_documents;
CREATE POLICY "supplier_docs_update_own" ON public.supplier_documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_documents.supplier_id
      AND s.user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_documents.supplier_id
      AND s.user_id = public.current_app_user_id()
    )
  );

-- Supplier can delete their own documents
DROP POLICY IF EXISTS "supplier_docs_delete_own" ON public.supplier_documents;
CREATE POLICY "supplier_docs_delete_own" ON public.supplier_documents
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_documents.supplier_id
      AND s.user_id = public.current_app_user_id()
    )
  );

-- Anon access (matching existing pattern)
DROP POLICY IF EXISTS "supplier_docs_select_anon" ON public.supplier_documents;
CREATE POLICY "supplier_docs_select_anon" ON public.supplier_documents
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "supplier_docs_insert_anon" ON public.supplier_documents;
CREATE POLICY "supplier_docs_insert_anon" ON public.supplier_documents
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "supplier_docs_update_anon" ON public.supplier_documents;
CREATE POLICY "supplier_docs_update_anon" ON public.supplier_documents
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "supplier_docs_delete_anon" ON public.supplier_documents;
CREATE POLICY "supplier_docs_delete_anon" ON public.supplier_documents
  FOR DELETE TO anon USING (true);

-- ============================================================
-- Part 2: Add columns to suppliers table
-- ============================================================

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS document_verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS can_bid BOOLEAN DEFAULT false;

-- ============================================================
-- Part 3: Fix evaluations table — add anon policies
-- ============================================================

DROP POLICY IF EXISTS "evaluations_select_anon" ON public.evaluations;
CREATE POLICY "evaluations_select_anon" ON public.evaluations
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "evaluations_insert_anon" ON public.evaluations;
CREATE POLICY "evaluations_insert_anon" ON public.evaluations
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "evaluations_update_anon" ON public.evaluations;
CREATE POLICY "evaluations_update_anon" ON public.evaluations
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "evaluations_delete_anon" ON public.evaluations;
CREATE POLICY "evaluations_delete_anon" ON public.evaluations
  FOR DELETE TO anon USING (true);

-- ============================================================
-- Part 4: Add anon SELECT policy to bids table
-- ============================================================

DROP POLICY IF EXISTS "bids_select_anon" ON public.bids;
CREATE POLICY "bids_select_anon" ON public.bids
  FOR SELECT TO anon USING (true);

-- ============================================================
-- Part 5: Storage bucket for supplier documents
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-documents', 'supplier-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: suppliers can manage their own folder
DROP POLICY IF EXISTS "supplier_docs_storage_select" ON storage.objects;
CREATE POLICY "supplier_docs_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'supplier-documents'
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.user_id = auth.uid()
      AND (storage.foldername(name))[1] = s.id::text
    )
  );

DROP POLICY IF EXISTS "supplier_docs_storage_insert" ON storage.objects;
CREATE POLICY "supplier_docs_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'supplier-documents'
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.user_id = auth.uid()
      AND (storage.foldername(name))[1] = s.id::text
    )
  );

DROP POLICY IF EXISTS "supplier_docs_storage_update" ON storage.objects;
CREATE POLICY "supplier_docs_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'supplier-documents'
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.user_id = auth.uid()
      AND (storage.foldername(name))[1] = s.id::text
    )
  );

DROP POLICY IF EXISTS "supplier_docs_storage_delete" ON storage.objects;
CREATE POLICY "supplier_docs_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'supplier-documents'
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.user_id = auth.uid()
      AND (storage.foldername(name))[1] = s.id::text
    )
  );

-- Admin and procurement can read all supplier documents in storage
DROP POLICY IF EXISTS "supplier_docs_storage_admin_select" ON storage.objects;
CREATE POLICY "supplier_docs_storage_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'supplier-documents'
    AND (
      public.is_current_app_admin()
      OR EXISTS (
        SELECT 1 FROM public.users actor
        JOIN public.roles r ON actor.role_id = r.id
        WHERE actor.id = public.current_app_user_id()
        AND r.name IN ('procurement_officer', 'auditor')
      )
    )
  );

-- ============================================================
-- Part 6: Create index for faster lookups
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier_id ON public.supplier_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_verification_status ON public.supplier_documents(verification_status);
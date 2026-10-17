import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function response(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface VerificationResult {
  status: "verified" | "rejected" | "corruption_flagged";
  confidence: number;
  notes: string;
  flags: string[];
}

function verifyDocument(
  docCategory: string,
  docType: string,
  fileName: string,
  fileSize: number | null,
  mimeType: string | null
): VerificationResult {
  const flags: string[] = [];
  let confidence = 85;
  let notes = "";

  const lowerName = fileName.toLowerCase();

  if (fileSize !== null && fileSize < 1000) {
    flags.push("file_too_small");
    confidence -= 30;
    notes = "File size is suspiciously small for an official document. ";
  }

  if (fileSize !== null && fileSize > 50_000_000) {
    flags.push("file_excessively_large");
    confidence -= 10;
    notes += "File size is unusually large. ";
  }

  const validMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (mimeType && !validMimeTypes.includes(mimeType)) {
    flags.push("invalid_file_type");
    confidence -= 40;
    notes += "File type is not a recognised document format. ";
  }

  const suspiciousExtensions = [".exe", ".bat", ".sh", ".js", ".html", ".svg"];
  if (suspiciousExtensions.some((ext) => lowerName.endsWith(ext))) {
    flags.push("suspicious_file_extension");
    confidence -= 50;
    notes += "File extension is not appropriate for an official document. ";
  }

  const suspiciousKeywords = ["fake", "copy_of", "template", "sample", "test", "dummy"];
  if (suspiciousKeywords.some((kw) => lowerName.includes(kw))) {
    flags.push("suspicious_filename");
    confidence -= 45;
    notes += "Filename contains keywords suggesting this may not be an authentic document. ";
  }

  const categoryDocTypes: Record<string, string[]> = {
    "company_registration": [
      "CIPC Registration Certificate (COR14.3)",
      "Notice of Incorporation (COR14.1)",
      "Director ID Copies",
      "Board Resolution",
      "Proof of Business Address",
    ],
    "tax_compliance": [
      "SARS Tax Compliance Status (TCS) PIN",
      "Tax Clearance Certificate",
      "CSD Registration Summary Report",
      "B-BBEE Certificate",
      "B-BBEE Sworn Affidavit",
    ],
    "sbd_forms": [
      "SBD 1 - Invitation to Bid",
      "SBD 3.3 - Pricing Schedule",
      "SBD 4 - Declaration of Interest",
      "SBD 6.1 - Preference Points Claim Form",
      "SBD 8 - Past Supply Chain Practices",
      "SBD 9 - Independent Bid Determination",
    ],
    "technical": [
      "Company Profile",
      "Staff CVs & Qualifications",
      "CIDB Grading Certificate",
      "COIDA Letter of Good Standing",
      "PSIRA Registration",
      "NHBRC Registration",
      "Industry-Specific Compliance",
    ],
  };

  const allowedDocTypes = categoryDocTypes[docCategory] || [];
  if (allowedDocTypes.length > 0 && !allowedDocTypes.includes(docType)) {
    flags.push("document_type_mismatch");
    confidence -= 20;
    notes += "Document type does not match the expected type for this category. ";
  }

  const mandatoryDocs = ["SBD 9 - Independent Bid Determination"];
  if (mandatoryDocs.includes(docType) && flags.length > 0) {
    flags.push("mandatory_document_issue");
    confidence -= 25;
    notes += "This is a mandatory document with verification issues — automatic disqualification risk. ";
  }

  confidence = Math.max(0, Math.min(100, confidence));
  notes = notes.trim() || "Document appears to meet basic authenticity criteria.";

  let status: VerificationResult["status"];
  if (flags.includes("suspicious_filename") || flags.includes("suspicious_file_extension") || flags.includes("invalid_file_type") || flags.includes("file_too_small")) {
    status = "corruption_flagged";
  } else if (flags.length > 0 || confidence < 60) {
    status = "rejected";
  } else {
    status = "verified";
  }

  return { status, confidence, notes, flags };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

    const { document_id } = await req.json();
    if (!document_id) return response({ error: "Document ID is required" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: doc, error: docError } = await adminClient
      .from("supplier_documents")
      .select("*")
      .eq("id", document_id)
      .maybeSingle();

    if (docError || !doc) return response({ error: "Document not found" }, 404);

    const result = verifyDocument(
      doc.document_category,
      doc.document_type,
      doc.document_name,
      doc.file_size,
      doc.mime_type
    );

    const { error: updateError } = await adminClient
      .from("supplier_documents")
      .update({
        verification_status: result.status,
        verification_notes: result.notes,
        verified_at: new Date().toISOString(),
        ai_confidence_score: result.confidence,
        ai_flags: result.flags,
      })
      .eq("id", document_id);

    if (updateError) {
      console.error("Failed to update document verification:", updateError);
      return response({ error: "Verification completed but could not save results" }, 500);
    }

    const { data: allDocs } = await adminClient
      .from("supplier_documents")
      .select("verification_status")
      .eq("supplier_id", doc.supplier_id);

    const allDocStatuses = allDocs || [];
    const hasCorruption = allDocStatuses.some((d) => d.verification_status === "corruption_flagged");
    const allVerified = allDocStatuses.length > 0 && allDocStatuses.every((d) => d.verification_status === "verified");
    const anyRejected = allDocStatuses.some((d) => d.verification_status === "rejected");

    let supplierStatus = "pending";
    let canBid = false;

    if (hasCorruption) {
      supplierStatus = "corruption_flagged";
      canBid = false;
    } else if (allVerified) {
      supplierStatus = "verified";
      canBid = true;
    } else if (anyRejected) {
      supplierStatus = "rejected";
      canBid = false;
    }

    await adminClient
      .from("suppliers")
      .update({
        document_verification_status: supplierStatus,
        can_bid: canBid,
      })
      .eq("id", doc.supplier_id);

    if (hasCorruption) {
      const { data: supplier } = await adminClient
        .from("suppliers")
        .select("company_name")
        .eq("id", doc.supplier_id)
        .maybeSingle();

      const alertRef = `RA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      await adminClient.from("risk_alerts").insert({
        alert_reference: alertRef,
        alert_title: `Suspicious document uploaded by ${supplier?.company_name || "supplier"}`,
        detection_type: "document_fraud",
        risk_level: "high",
        risk_score: 85,
        status: "new",
        description: `AI verification flagged document "${doc.document_name}" (${doc.document_type}) as a potential corruption attempt. Flags: ${result.flags.join(", ")}. Confidence: ${result.confidence}%.`,
        amount_involved: 0,
        supplier_id: doc.supplier_id,
      });
    }

    return response({
      success: true,
      verification: result,
      supplier_status: supplierStatus,
      can_bid: canBid,
    }, 200);
  } catch (error) {
    console.error("Verification error:", error);
    return response({ error: "Verification failed" }, 500);
  }
});

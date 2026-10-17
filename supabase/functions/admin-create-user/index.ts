import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id: string;
  department_id?: string | null;
  employee_id?: string | null;
  phone?: string | null;
  company_name?: string | null;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function response(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return response({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const sessionClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: authData, error: authError } = await sessionClient.auth.getUser(token);
    if (authError || !authData.user) return response({ error: 'Unauthorized' }, 401);

    const { data: actor } = await adminClient.from('users').select('id, role:roles(name)').eq('auth_user_id', authData.user.id).eq('is_active', true).maybeSingle();
    if (!actor || (actor.role as { name?: string } | null)?.name !== 'admin') return response({ error: 'Only administrators can create staff accounts.' }, 403);

    const input: CreateUserRequest = await req.json();
    if (!input.email || !input.password || input.password.length < 6 || !input.first_name || !input.last_name || !input.role_id) {
      return response({ error: 'Please provide valid account details.' }, 400);
    }

    const { data: role } = await adminClient.from('roles').select('id, name').eq('id', input.role_id).maybeSingle();
    if (!role || !['supplier', 'procurement_officer', 'auditor'].includes(role.name)) return response({ error: 'That account role is not permitted.' }, 400);

    if (role.name === 'supplier' && !input.company_name?.trim()) {
      return response({ error: 'Company name is required for supplier accounts.' }, 400);
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({ email: normalizedEmail, password: input.password, email_confirm: true });
    if (createAuthError || !createdAuth.user) return response({ error: 'Unable to create this account. Please check the email and try again.' }, 400);

    const { data: createdProfile, error: insertError } = await adminClient.from('users').insert({
      email: normalizedEmail,
      auth_user_id: createdAuth.user.id,
      password_hash: await hashPassword(input.password),
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      role_id: role.id,
      department_id: input.department_id || null,
      employee_id: input.employee_id || null,
      phone: input.phone || null,
      is_active: true,
      email_verified: true,
    }).select('id').maybeSingle();

    if (insertError || !createdProfile) {
      await adminClient.auth.admin.deleteUser(createdAuth.user.id);
      return response({ error: 'Unable to create this account. Please try again.' }, 500);
    }

    if (role.name === 'supplier') {
      const { error: supplierError } = await adminClient.from('suppliers').insert({
        user_id: createdProfile.id,
        company_name: input.company_name!.trim(),
        company_registration_number: `PENDING-${createdProfile.id}`,
        contact_person: `${input.first_name.trim()} ${input.last_name.trim()}`,
        contact_email: normalizedEmail,
        contact_phone: input.phone?.trim() || 'Pending profile completion',
        physical_address: 'Pending profile completion',
        can_bid: false,
        document_verification_status: 'pending',
      });

      if (supplierError) {
        await adminClient.from('users').delete().eq('id', createdProfile.id);
        await adminClient.auth.admin.deleteUser(createdAuth.user.id);
        return response({ error: 'Unable to create the supplier company profile.' }, 500);
      }
    }

    return response({ success: true, user_id: createdProfile.id }, 200);
  } catch (error) {
    console.error('Admin create user error:', error);
    return response({ error: 'Unable to create this account.' }, 500);
  }
});

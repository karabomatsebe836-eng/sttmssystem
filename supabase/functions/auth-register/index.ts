import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function response(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
    const { email, password, first_name, last_name }: RegisterRequest = await req.json();

    if (!email || !password || !first_name || !last_name || password.length < 6) {
      return response({ error: 'Please provide valid registration details.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const normalizedEmail = email.trim().toLowerCase();

    const { data: roleData, error: roleError } = await adminClient.from('roles').select('id').eq('name', 'public').maybeSingle();
    if (roleError || !roleData) return response({ error: 'Registration is temporarily unavailable.' }, 503);

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });
    if (authError || !authData.user) return response({ error: 'Unable to create this account. Please check the email and try again.' }, 400);

    const { data: newUser, error: insertError } = await adminClient.from('users').insert({
      email: normalizedEmail,
      auth_user_id: authData.user.id,
      password_hash: await hashPassword(password),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role_id: roleData.id,
      is_active: true,
      email_verified: true,
    }).select('id').maybeSingle();

    if (insertError || !newUser) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return response({ error: 'Unable to create this account. Please try again.' }, 500);
    }

    return response({ success: true, user_id: newUser.id }, 200);
  } catch (error) {
    console.error('Register error:', error);
    return response({ error: 'Registration is temporarily unavailable.' }, 500);
  }
});

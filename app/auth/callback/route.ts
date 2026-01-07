import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  console.log("=== Auth Callback Start ===");
  console.log("Request URL:", request.url);
  console.log("Request Headers:", Object.fromEntries(request.headers.entries()));
  
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  console.log("Query Params:", {
    code: code ? `${code.slice(0, 8)}...` : undefined,
    error,
    errorDescription,
  });

  if (error) {
    console.error("OAuth Error:", error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  if (code) {
    console.log("Exchanging code for session...");
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log("Exchange Result:", { 
      success: !!data.session, 
      user: data.user?.email,
      error: exchangeError 
    });

    if (exchangeError) {
      console.error("Exchange Error:", exchangeError);
      return NextResponse.redirect(new URL(`/login?error=exchange_failed`, request.url));
    }
  }

  console.log("Redirecting to dashboard...");
  const dashboardUrl = new URL("/dashboard", request.url);
  console.log("Dashboard URL:", dashboardUrl.toString());
  
  return NextResponse.redirect(dashboardUrl);
}

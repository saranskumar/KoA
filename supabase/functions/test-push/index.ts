import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.1";

serve(async (req) => {
  // Setup CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    // Initialize Supabase Service Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Setup Web Push VAPID keys
    const vaporSubject = "mailto:hello@s4tracker.app";
    const vaporPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vaporPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    
    if (!vaporPublic || !vaporPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured on server" }), { status: 500 });
    }

    webpush.setVapidDetails(vaporSubject, vaporPublic, vaporPrivate);

    // Retrieve subscriptions for the user
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ status: "success", message: "No active push subscriptions found for user." }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      });
    }

    const payload = JSON.stringify({ 
      title: "Test Notification", 
      body: "Loud and clear! Push notifications are working correctly.", 
      icon: '/icon.ico', 
      url: '/' 
    });

    let successCount = 0;

    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload);
        successCount++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
           await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ status: "success", successCount, totalTried: subs.length }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", error: error.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 500,
    });
  }
});

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.1";

serve(async (req) => {
  // 1. Initialize Supabase Client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 2. Setup Web Push VAPID keys
  const vaporSubject = "mailto:hello@s4tracker.app"; // Set to your email
  const vaporPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? ""; // Pass via supabase secrets
  const vaporPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? ""; // Pass via supabase secrets
  
  if (!vaporPublic || !vaporPrivate) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured in Denos environment secrets" }), { status: 500 });
  }

  webpush.setVapidDetails(vaporSubject, vaporPublic, vaporPrivate);

  try {
    // 3. Find users whose reminder time roughly matches now
    // Example: This cron triggered every hour (e.g. 14:00 UTC).
    // We check preferences to see if their local time roughly matches their `reminder_time_utc`.
    // For simplicity, we just fetch all actively enabled preferences. (Optimize with time filters later).
    
    // In a prod scenario, you'd trigger this cron every 15m or 1 hour, calculating UTC target times based on tz_offset.
    const { data: prefs, error: prefsErr } = await supabase
      .from('notification_preferences')
      .select('user_id, enabled, tone, active_plan_id')
      .eq('enabled', true);

    if (prefsErr) throw prefsErr;

    const results = [];

    // 4. For each active user, check their plan and send a web push
    for (const pref of prefs) {
      if (!pref.user_id) continue;

      // Get user subscriptions
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', pref.user_id);

      if (!subs || subs.length === 0) continue;

      // 5. Gather personalized motivation data
      // Read today's tasks directly for this user based on active_plan_id.
      const todayStr = new Date().toISOString().split('T')[0];
      
      const { data: activeTasks } = await supabase
        .from('study_plan')
        .select('id, title, status, date')
        .eq('user_id', pref.user_id)
        .eq('plan_id', pref.active_plan_id)
        .eq('date', todayStr);

      const pendingCount = activeTasks?.filter(t => t.status === 'pending').length || 0;
      const completedCount = activeTasks?.filter(t => t.status === 'completed').length || 0;
      
      // Select tone
      let title = "S4 Study Reminder";
      let body = "It's time to hit the books!";
      
      if (pendingCount > 0) {
        if (pref.tone === 'strict') {
          title = "Get to Work.";
          body = `You still have ${pendingCount} tasks pending for today. No excuses.`;
        } else if (pref.tone === 'minimal') {
          title = "Pending Tasks";
          body = `${pendingCount} tasks remaining today.`;
        } else { // motivating
          title = "Your Study Plan awaits!";
          body = `You have ${pendingCount} tasks queued up for today. Just start the first one and build momentum!`;
        }
      } else if (completedCount > 0 && pendingCount === 0) {
        title = "All caught up!";
        body = "You completed all tasks for today. Outstanding work.";
      } else {
        // No tasks scheduled for today
        title = "Rest or Get Ahead";
        body = "No tasks explicitly scheduled for today. Double check your upcoming exam slots.";
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: '/icon.jpg', // Client icon URL path
        url: '/' // When clicked opens app
      });

      // 6. Push to all their registered devices
      for (const sub of subs) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          results.push({ userId: pref.user_id, status: 'success' });
        } catch (pushErr) {
          console.error('Push error:', pushErr);
          // If status code 410 or 404, the subscription is expired/invalid. We should delete it.
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
             await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          results.push({ userId: pref.user_id, status: 'failed', error: pushErr.message });
        }
      }
    }

    return new Response(JSON.stringify({ status: "success", processed: results.length, details: results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

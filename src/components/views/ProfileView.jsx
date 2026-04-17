import React, { useState } from 'react';
import { User, LogOut, BookOpen, Bell, BellOff, Info, Trophy, Save, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../hooks/useNotifications';
import { useDataMutation } from '../../hooks/useData';
import { generateRandomName, generateNameOptions } from '../../lib/names';

export default function ProfileView({ data, session }) {
  const { profile, activePlan, userPreferences } = data || {};
  const notificationState = useNotifications(session);
  const mutation = useDataMutation();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(!!profile?.show_on_leaderboard);
  const [reminderTime, setReminderTime] = useState(userPreferences?.reminder_time || '09:00');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handlePushToggle = async () => {
    if (!notificationState.isSubscribed) {
      const success = await notificationState.subscribeToPush();
      if (success) {
        mutation.mutate({
          action: 'updateNotificationPreferences',
          patch: { 
            enabled: true, 
            reminder_time: reminderTime,
            active_plan_id: activePlan?.id || null,
            tz_offset: new Date().getTimezoneOffset()
          }
        });
      }
    } else {
      const success = await notificationState.unsubscribeFromPush();
      if (success) {
        mutation.mutate({
          action: 'updateNotificationPreferences',
          patch: { enabled: false }
        });
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await mutation.mutateAsync({
        action: 'updateProfile',
        patch: {
          display_name: displayName,
          show_on_leaderboard: showOnLeaderboard
        }
      });
      // Also update notification prefs if time changed
      if (notificationState.isSubscribed) {
        await mutation.mutateAsync({
          action: 'updateNotificationPreferences',
          patch: { 
             reminder_time: reminderTime,
             active_plan_id: activePlan?.id || null 
          }
        });
      }
    } catch (e) {
      alert("Failed to save settings: " + e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const userName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Student';
  const userEmail = session?.user?.email || '';

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300 max-w-lg mx-auto">

      {/* User card */}
      <div className="clay-card p-7 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#bfd8bd]/30 border border-[#dde7c7] flex items-center justify-center flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <User size={28} className="text-[#3c7f65]" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#313c1a] truncate">{userName}</h2>
          <p className="text-sm text-[#627833] font-medium truncate">{userEmail}</p>
          {activePlan && (
            <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-[#50a987]">
              <div className="w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0">
                <img src="/icon.jpg" alt="Icon" className="w-full h-full object-cover" />
              </div>
              {activePlan.title}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Settings */}
      <div className="clay-card overflow-hidden p-5">
        <h3 className="font-bold text-[#313c1a] mb-4 flex items-center gap-2.5">
          <Trophy size={18} className="text-[#fb923c]" /> Leaderboard Privacy
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#313c1a] text-sm">Opt-in to Public Leaderboard</div>
              <div className="text-xs text-[#627833] mt-0.5 max-w-[200px]">Show your streak and rank to other users. Private data stays hidden.</div>
            </div>
            <button
              onClick={() => setShowOnLeaderboard(!showOnLeaderboard)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none flex-shrink-0 ${showOnLeaderboard ? 'bg-[#fb923c]' : 'bg-[#dde7c7]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${showOnLeaderboard ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {showOnLeaderboard && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#627833]">Public Display Name</label>
                <button 
                  onClick={() => setNameSuggestions(generateNameOptions(4))}
                  className="text-[10px] font-bold text-[#fb923c] hover:text-[#d97706] flex items-center gap-1 transition-colors"
                >
                  <Sparkles size={10} /> Need ideas?
                </button>
              </div>
              
              <div className="relative group">
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Anonymous Fox"
                  className="w-full p-3 pr-11 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#fb923c]/50"
                />
                <button 
                  onClick={() => setDisplayName(generateRandomName())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98c9a3] hover:text-[#fb923c] transition-colors p-1"
                  title="Randomize"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {nameSuggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 animate-in zoom-in-95 duration-200">
                  {nameSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDisplayName(suggestion);
                        setNameSuggestions([]);
                      }}
                      className="text-[10px] font-bold px-2.5 py-1.5 bg-white border border-[#edeec9] text-[#627833] rounded-lg hover:border-[#fb923c] hover:text-[#fb923c] transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Push Notifications Setup */}
      <div className="clay-card overflow-hidden p-5">
        <h3 className="font-bold text-[#313c1a] mb-4 flex items-center gap-2.5">
          <Bell size={18} className="text-[#3c7f65]" /> Daily Study Reminders
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#313c1a] text-sm">Push Notifications</div>
              <div className="text-xs text-[#627833] mt-0.5 max-w-[200px]">Get daily alerts even when the app is closed.</div>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={notificationState.isLoading}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none flex-shrink-0 disabled:opacity-50 ${notificationState.isSubscribed ? 'bg-[#77bfa3]' : 'bg-[#dde7c7]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${notificationState.isSubscribed ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {notificationState.isSubscribed && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-1">
              <label className="block text-xs font-semibold text-[#627833] mb-1.5">Preferred Reminder Time</label>
              <input 
                type="time" 
                value={reminderTime} 
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]/50"
              />
            </div>
          )}

          {notificationState.permission === 'denied' && (
             <div className="text-xs text-red-500 font-medium px-3 py-2 bg-red-50 rounded-lg">
               You have blocked notifications in your browser. Please allow them in site settings.
             </div>
          )}
        </div>
      </div>

      {/* Special: Master Schedule (Only available until Apr 24) */}
      {(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const isPast = todayStr > '2026-04-24';
        const hasSchedule = activePlan?.has_master_schedule;

        if (isPast) return null;

        return (
          <div className="clay-card overflow-hidden p-5 border-2 border-indigo-100 bg-indigo-50/20">
            <h3 className="font-bold text-[#313c1a] mb-2 flex items-center gap-2.5">
              <BookOpen size={18} className="text-indigo-500" /> SR AI Master Schedule
            </h3>
            <p className="text-xs text-indigo-700/80 font-medium mb-4">
              Apply the recommended Apr 17–24 roadmap to your active plan.
            </p>
            <button
              onClick={() => mutation.mutate({ action: 'seedSchedule', planId: activePlan?.id })}
              disabled={hasSchedule}
              className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border-2 ${
                hasSchedule 
                  ? 'bg-white border-indigo-200 text-indigo-300 cursor-default'
                  : 'bg-white border-indigo-500 text-indigo-600 hover:bg-indigo-50 shadow-sm'
              }`}
            >
              {hasSchedule ? <><Check size={16} /> Roadmap Already Active</> : 'Generate April Roadmap'}
            </button>
          </div>
        );
      })()}

      <button
        onClick={handleSaveProfile}
        disabled={isSavingProfile}
        className="w-full py-4 bg-[#313c1a] hover:bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_4px_14px_rgba(49,60,26,0.3)]"
      >
        {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Settings</>}
      </button>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full p-4 flex items-center justify-center gap-2.5 text-red-500 font-bold rounded-2xl border-2 border-red-100 bg-red-50/50 hover:bg-red-50 transition-all"
      >
        <LogOut size={18} /> Sign Out
      </button>

      <div className="flex items-center justify-center gap-2 pt-4 pb-2 opacity-50">
          <Info size={14} className="text-[#627833]" />
          <div className="text-[10px] text-[#627833] font-bold tracking-widest uppercase">S4 Study Planner · v2.0</div>
      </div>

    </div>
  );
}


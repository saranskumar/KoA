import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Flame, CheckCircle2, User, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function LeaderboardView({ data }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = data || {};
  const setView = useAppStore(state => state.setCurrentView);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: records, error } = await supabase
        .from('public_leaderboard')
        .select('*')
        // Order by streak, then best streak, then tasks
        .order('current_streak', { ascending: false })
        .order('best_streak', { ascending: false })
        .order('completed_tasks', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setLeaderboard(records || []);
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (streak) => {
    if (streak >= 30) return { label: 'Legendary', color: 'bg-purple-100 text-purple-600 border-purple-200' };
    if (streak >= 14) return { label: 'Deep Focus', color: 'bg-blue-100 text-blue-600 border-blue-200' };
    if (streak >= 7) return { label: '7-Day Club', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' };
    if (streak >= 3) return { label: 'On Fire', color: 'bg-orange-100 text-orange-600 border-orange-200' };
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#77bfa3]" />
        <p className="text-sm font-semibold text-[#627833]">Loading Ranks...</p>
      </div>
    );
  }

  const isOptedIn = profile?.show_on_leaderboard && profile?.display_name;
  
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300 max-w-lg mx-auto">
      
      {/* Header */}
      <div className="clay-card p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-white to-[#f8faf4]">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#fb923c]/10 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-2xl md:text-3xl font-bold text-[#313c1a] tracking-tight flex items-center gap-3 mb-2 relative z-10">
          <Trophy size={28} className="text-[#fb923c]" /> Hall of Focus
        </h2>
        <p className="text-sm font-medium text-[#627833] relative z-10">
          Compete with fellow S4 students. Maintain your streak to climb the ranks.
        </p>
      </div>

      {/* User Opt-In CTA */}
      {!isOptedIn && (
        <div className="bg-[#fb923c]/10 border border-[#fb923c]/30 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="font-bold text-[#b45309] text-sm mb-1">You're invisible</h3>
            <p className="text-xs text-[#b45309]/80 font-medium">Opt-in via your Profile settings to join the public rankings.</p>
          </div>
          <button onClick={() => setView('Profile')} className="flex-shrink-0 h-9 px-4 bg-white text-[#b45309] border border-[#fb923c]/30 font-bold text-xs rounded-xl hover:bg-[#fb923c]/5 transition-all">
            Open Settings
          </button>
        </div>
      )}

      {/* Podium (Top 3) */}
      {topThree.length > 0 && (
        <div className="flex items-end justify-center gap-2 md:gap-4 pt-6 pb-2">
          {/* Rank 2 */}
          {topThree[1] && (
            <div className="w-[30%] flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full border-4 border-[#e2e8f0] flex items-center justify-center mb-2 shadow-sm text-gray-400">
                <User size={20} />
              </div>
              <div className="text-[10px] font-bold text-[#627833] uppercase tracking-wide truncate w-full text-center px-1 mb-1">{topThree[1].display_name}</div>
              <div className="w-full bg-gradient-to-t from-[#f1f5f9] to-white border border-[#e2e8f0] rounded-t-2xl shadow-sm flex flex-col items-center justify-start pt-3 h-24">
                <div className="text-xl font-bold text-[#313c1a] flex items-center gap-1"><Flame size={14} className="text-orange-500"/> {topThree[1].current_streak}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">2nd</div>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {topThree[0] && (
            <div className="w-[35%] flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-full border-4 border-yellow-400 flex items-center justify-center mb-2 shadow-md text-yellow-600 relative">
                <div className="absolute -top-3 text-xl">👑</div>
                <User size={24} />
              </div>
              <div className="text-xs font-bold text-[#313c1a] uppercase tracking-wide truncate w-full text-center px-1 mb-1">{topThree[0].display_name}</div>
              <div className="w-full bg-gradient-to-t from-yellow-100/50 to-white border border-yellow-200 rounded-t-2xl shadow-md flex flex-col items-center justify-start pt-4 h-32 relative z-10">
                <div className="text-2xl font-bold text-[#313c1a] flex items-center gap-1"><Flame size={16} className="text-orange-500"/> {topThree[0].current_streak}</div>
                <div className="text-[11px] text-yellow-700 font-bold uppercase mt-1">1st</div>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <div className="w-[30%] flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-full border-4 border-orange-200 flex items-center justify-center mb-2 shadow-sm text-orange-400">
                <User size={20} />
              </div>
              <div className="text-[10px] font-bold text-[#627833] uppercase tracking-wide truncate w-full text-center px-1 mb-1">{topThree[2].display_name}</div>
              <div className="w-full bg-gradient-to-t from-orange-50 to-white border border-orange-100 rounded-t-2xl shadow-sm flex flex-col items-center justify-start pt-3 h-20">
                <div className="text-lg font-bold text-[#313c1a] flex items-center gap-1"><Flame size={12} className="text-orange-500"/> {topThree[2].current_streak}</div>
                <div className="text-[10px] text-orange-600/80 font-bold uppercase mt-1">3rd</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rest of the list */}
      <div className="space-y-3">
        {rest.map((user, idx) => {
          const rank = idx + 4;
          const isCurrentUser = user.user_id === profile?.id;
          const badge = getBadge(user.current_streak);

          return (
            <div key={user.user_id} className={`clay-card p-4 flex items-center gap-4 transition-all ${isCurrentUser ? 'border-[#fb923c] ring-2 ring-[#fb923c]/20' : ''}`}>
              <div className="w-8 text-center font-bold text-gray-400 text-sm">#{rank}</div>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[#313c1a] truncate">{user.display_name}</h4>
                  {isCurrentUser && <span className="text-[9px] font-bold text-white bg-[#fb923c] px-1.5 py-0.5 rounded uppercase">You</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs font-medium text-[#627833]">
                  <span className="flex items-center gap-1 text-[#b45309] font-bold"><Flame size={12} /> {user.current_streak} Day{user.current_streak !== 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1 opacity-70"><CheckCircle2 size={12} /> {user.completed_tasks} Tasks</span>
                </div>
              </div>
              {badge && (
                <div className={`text-[10px] font-bold px-2 py-1 rounded-md border ${badge.color} whitespace-nowrap`}>
                  {badge.label}
                </div>
              )}
            </div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="clay-card p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#f8faf4] rounded-full flex items-center justify-center mb-3">
              <Trophy size={24} className="text-[#aebf8a]" />
            </div>
            <h3 className="font-bold text-[#313c1a] text-lg mb-1">No ranks yet</h3>
            <p className="text-sm font-medium text-[#627833]">Opt-in via profile to become the first on the board.</p>
          </div>
        )}
      </div>
    </div>
  );
}

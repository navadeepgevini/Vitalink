import { NextResponse } from 'next/server';
import { getStreaks } from '@/lib/dataStore';

export async function GET() {
  const streaks = getStreaks();

  // Create anonymous leaderboard sorted by current streak
  const leaderboard = streaks
    .filter(s => s.currentStreak > 0)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 10)
    .map((s, i) => ({
      rank: i + 1,
      anonymousName: `Health Warrior #${(s.username.charCodeAt(0) * 17 + s.username.charCodeAt(1) * 31) % 9000 + 1000}`,
      streak: s.currentStreak,
      points: s.totalPoints,
      tier: s.currentStreak >= 90 ? '👑 Legend' : s.currentStreak >= 30 ? '⭐ Champion' : s.currentStreak >= 7 ? '🔥 Streaker' : '🌱 Starter',
    }));

  // Add demo entries if < 5 real entries
  const demoEntries = [
    { rank: 0, anonymousName: 'Health Warrior #2847', streak: 45, points: 900, tier: '⭐ Champion' },
    { rank: 0, anonymousName: 'Health Warrior #7312', streak: 32, points: 640, tier: '⭐ Champion' },
    { rank: 0, anonymousName: 'Health Warrior #1089', streak: 21, points: 420, tier: '🔥 Streaker' },
    { rank: 0, anonymousName: 'Health Warrior #5543', streak: 14, points: 280, tier: '🔥 Streaker' },
    { rank: 0, anonymousName: 'Health Warrior #9201', streak: 8, points: 160, tier: '🔥 Streaker' },
  ];

  const combined = [...leaderboard, ...demoEntries.slice(0, Math.max(0, 5 - leaderboard.length))];
  combined.sort((a, b) => b.streak - a.streak);
  combined.forEach((entry, i) => { entry.rank = i + 1; });

  return NextResponse.json({ leaderboard: combined.slice(0, 10) });
}

import { NextResponse } from 'next/server';
import { getStreakForUser, upsertStreak, getStreaks, type HealthStreak } from '@/lib/dataStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  let streak = getStreakForUser(username);
  if (!streak) {
    streak = {
      username,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      lastCheckIn: '',
      dailyLog: [],
      rewards: [],
    };
  }

  // Calculate milestone progress
  const nextMilestone = streak.currentStreak < 7 ? 7 : streak.currentStreak < 30 ? 30 : streak.currentStreak < 90 ? 90 : 365;
  const progress = Math.round((streak.currentStreak / nextMilestone) * 100);

  return NextResponse.json({
    ...streak,
    nextMilestone,
    progress,
    milestones: [
      { days: 7, reward: '10% off next consultation', emoji: '🔥', unlocked: streak.currentStreak >= 7 },
      { days: 30, reward: 'Free teleconsult', emoji: '⭐', unlocked: streak.currentStreak >= 30 },
      { days: 90, reward: 'Premium upgrade (1 month)', emoji: '👑', unlocked: streak.currentStreak >= 90 },
      { days: 365, reward: 'VitaLink Lifetime Badge', emoji: '💎', unlocked: streak.currentStreak >= 365 },
    ],
  });
}

export async function POST(request: Request) {
  try {
    const { username, medication, vitals, steps, water } = await request.json();
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const today = new Date().toISOString().split('T')[0];
    let streak = getStreakForUser(username);

    if (!streak) {
      streak = { username, currentStreak: 0, longestStreak: 0, totalPoints: 0, lastCheckIn: '', dailyLog: [], rewards: [] };
    }

    // Check if already logged today
    const existingLog = streak.dailyLog.find(d => d.date === today);
    if (existingLog) {
      // Update existing log
      existingLog.medication = medication ?? existingLog.medication;
      existingLog.vitals = vitals ?? existingLog.vitals;
      existingLog.steps = steps ?? existingLog.steps;
      existingLog.water = water ?? existingLog.water;
      const completed = [existingLog.medication, existingLog.vitals, existingLog.steps, existingLog.water].filter(Boolean).length;
      existingLog.points = completed * 5;
    } else {
      // New log
      const completed = [medication, vitals, steps, water].filter(Boolean).length;
      const points = completed * 5;
      streak.dailyLog.push({ date: today, medication: !!medication, vitals: !!vitals, steps: !!steps, water: !!water, points });
    }

    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const todayLog = streak.dailyLog.find(d => d.date === today);
    const allDone = todayLog && todayLog.medication && todayLog.vitals && todayLog.steps && todayLog.water;

    if (allDone) {
      if (streak.lastCheckIn === yesterday || streak.lastCheckIn === '') {
        streak.currentStreak++;
      } else if (streak.lastCheckIn !== today) {
        streak.currentStreak = 1; // Reset
      }
      streak.lastCheckIn = today;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    }

    streak.totalPoints = streak.dailyLog.reduce((sum, d) => sum + d.points, 0);

    // Check milestone rewards
    const milestones = [7, 30, 90, 365];
    for (const m of milestones) {
      if (streak.currentStreak >= m && !streak.rewards.find(r => r.milestone === m)) {
        const rewardNames: Record<number, string> = { 7: '10% off consultation', 30: 'Free teleconsult', 90: 'Premium upgrade', 365: 'Lifetime Badge' };
        streak.rewards.push({ milestone: m, rewardName: rewardNames[m], claimedAt: new Date().toISOString() });
      }
    }

    upsertStreak(streak);

    return NextResponse.json({ message: 'Health log updated', streak });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

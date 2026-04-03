/**
 * Doctor Integrity Score Calculator
 * Aggregates 5 dimensions into a 0-100 score with tier badges
 */

import { getAppointmentsByDoctor, type IntegrityRecord } from './dataStore';

interface IntegrityBreakdown {
  cancellationRate: number;  // 30 pts max
  avgDelay: number;          // 20 pts max
  patientNoShow: number;     // 20 pts max
  rating: number;            // 20 pts max
  prescriptionQuality: number; // 10 pts max
}

export function calculateIntegrityScore(doctorUsername: string): IntegrityRecord {
  const appointments = getAppointmentsByDoctor(doctorUsername);
  const total = appointments.length;

  // 1. Cancellation Rate (30 pts) — fewer cancellations = higher score
  const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
  const cancellationRate = total > 0 ? Math.max(0, 30 - Math.round((cancelled / total) * 100)) : 28;

  // 2. Average Delay (20 pts) — simulated: based on completed vs total ratio
  const completed = appointments.filter(a => a.status === 'Completed').length;
  const avgDelay = total > 0 ? Math.round(18 + (completed / total) * 2) : 17;

  // 3. Patient No-Show Rate (20 pts) — lower is better for the doctor
  const pending = appointments.filter(a => a.status === 'Pending').length;
  const patientNoShow = total > 0 ? Math.max(0, 20 - Math.round((pending / total) * 40)) : 18;

  // 4. Rating (20 pts) — simulated: high baseline with adjustment based on completions
  const rating = total > 0 ? Math.min(20, Math.round(14 + (completed / Math.max(total, 1)) * 6)) : 16;

  // 5. Prescription Quality (10 pts) — simulated based on completion rate
  const prescriptionQuality = total > 0 ? Math.min(10, Math.round(6 + (completed / Math.max(total, 1)) * 4)) : 7;

  const score = Math.min(100, cancellationRate + avgDelay + patientNoShow + rating + prescriptionQuality);

  let tier: IntegrityRecord['tier'];
  if (score >= 90) tier = 'Platinum';
  else if (score >= 75) tier = 'Gold';
  else if (score >= 60) tier = 'Silver';
  else tier = 'Bronze';

  return {
    doctorUsername,
    score,
    tier,
    breakdown: { cancellationRate, avgDelay, patientNoShow, rating, prescriptionQuality },
    calculatedAt: new Date().toISOString(),
  };
}

export function getTierEmoji(tier: IntegrityRecord['tier']): string {
  switch (tier) {
    case 'Platinum': return '💎';
    case 'Gold': return '🥇';
    case 'Silver': return '🥈';
    case 'Bronze': return '🥉';
  }
}

export function getTierColor(tier: IntegrityRecord['tier']): string {
  switch (tier) {
    case 'Platinum': return 'from-cyan-400 to-blue-500';
    case 'Gold': return 'from-yellow-400 to-amber-500';
    case 'Silver': return 'from-gray-300 to-gray-400';
    case 'Bronze': return 'from-orange-400 to-orange-600';
  }
}

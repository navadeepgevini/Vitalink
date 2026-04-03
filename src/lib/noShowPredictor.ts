/**
 * Smart No-Show Predictor
 * Lightweight ML scoring for appointment no-show risk (0-100)
 */

import { getAppointmentsByPatient } from './dataStore';

interface NoShowResult {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: { name: string; impact: number; description: string }[];
  interventions: string[];
}

export function calculateNoShowRisk(
  appointment: {
    patientUsername: string;
    date: string;
    time: string;
    type: string;
    createdAt: string;
  }
): NoShowResult {
  const factors: NoShowResult['factors'] = [];
  let score = 0;

  // 1. Gap between booking and appointment (0-25 pts)
  const bookDate = new Date(appointment.createdAt);
  const aptDate = new Date(appointment.date);
  const dayGap = Math.floor((aptDate.getTime() - bookDate.getTime()) / (1000 * 60 * 60 * 24));
  const gapScore = dayGap > 14 ? 25 : dayGap > 7 ? 18 : dayGap > 3 ? 10 : 3;
  score += gapScore;
  factors.push({ name: 'Booking Gap', impact: gapScore, description: `${dayGap} days between booking and appointment` });

  // 2. Day of week (0-15 pts)
  const dayOfWeek = aptDate.getDay();
  const dayScore = dayOfWeek === 1 ? 15 : dayOfWeek === 5 ? 12 : dayOfWeek === 0 || dayOfWeek === 6 ? 8 : 5;
  score += dayScore;
  factors.push({ name: 'Day Factor', impact: dayScore, description: `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]} appointments have ${dayScore > 10 ? 'higher' : 'lower'} no-show rates` });

  // 3. Historical no-show rate (0-30 pts)
  const history = getAppointmentsByPatient(appointment.patientUsername);
  const totalPast = history.filter(a => a.id !== appointment.date).length;
  const cancelled = history.filter(a => a.status === 'Cancelled').length;
  const historyRate = totalPast > 0 ? (cancelled / totalPast) : 0.15; // default 15%
  const historyScore = Math.round(historyRate * 30);
  score += historyScore;
  factors.push({ name: 'History', impact: historyScore, description: `Patient cancelled ${cancelled}/${totalPast} past appointments (${Math.round(historyRate * 100)}%)` });

  // 4. Appointment type (0-15 pts) — In-person higher risk
  const typeScore = appointment.type === 'In-Person' ? 15 : appointment.type === 'Home Visit' ? 12 : 3;
  score += typeScore;
  factors.push({ name: 'Type', impact: typeScore, description: `${appointment.type} appointments have ${typeScore > 10 ? 'higher' : 'lower'} no-show risk` });

  // 5. Time of day (0-15 pts) — early morning and late afternoon higher
  const hour = parseInt(appointment.time);
  const timeScore = hour <= 9 ? 12 : hour >= 16 ? 10 : 4;
  score += timeScore;
  factors.push({ name: 'Time Slot', impact: timeScore, description: `${appointment.time} slots have ${timeScore > 8 ? 'elevated' : 'normal'} risk` });

  score = Math.min(100, score);

  let riskLevel: NoShowResult['riskLevel'];
  const interventions: string[] = [];

  if (score < 40) {
    riskLevel = 'low';
    interventions.push('Standard SMS reminder at T-24h');
    interventions.push('Standard SMS reminder at T-1h');
  } else if (score < 70) {
    riskLevel = 'medium';
    interventions.push('SMS reminder at T-24h and T-1h');
    interventions.push('WhatsApp "Confirm Attendance" at T-12h');
    interventions.push('Push notification at T-3h');
  } else {
    riskLevel = 'high';
    interventions.push('SMS + WhatsApp + Push at T-24h');
    interventions.push('Twilio voice call at T-3h');
    interventions.push('Caregiver notification at T-2h');
    interventions.push('Auto-release slot to waitlist if no confirmation');
  }

  return { score, riskLevel, factors, interventions };
}

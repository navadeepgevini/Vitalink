import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const APPOINTMENTS_FILE = join(DATA_DIR, 'appointments.json');
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// Ensure directories exist
function ensureDirs() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ========== USERS ==========
export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // bcrypt hashed
  role: 'patient' | 'doctor' | 'admin';
  fullName: string;
  specialty?: string; // for doctors
  createdAt: string;
}

export function getUsers(): User[] {
  ensureDirs();
  if (!existsSync(USERS_FILE)) {
    writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
}

export function saveUsers(users: User[]) {
  ensureDirs();
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByUsername(username: string): User | undefined {
  return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function addUser(user: User) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function getDoctors(): User[] {
  return getUsers().filter(u => u.role === 'doctor');
}

// ========== APPOINTMENTS ==========
export interface Appointment {
  id: string;
  patientUsername: string;
  patientName: string;
  doctorUsername: string;
  doctorName: string;
  age: number;
  problem: string;
  type: 'Virtual' | 'In-Person' | 'Home Visit';
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  reportFile?: string;
  payment: string;
  createdAt: string;
}

export function getAppointments(): Appointment[] {
  ensureDirs();
  if (!existsSync(APPOINTMENTS_FILE)) {
    writeFileSync(APPOINTMENTS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(readFileSync(APPOINTMENTS_FILE, 'utf-8'));
}

export function saveAppointments(appointments: Appointment[]) {
  ensureDirs();
  writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
}

export function addAppointment(appointment: Appointment) {
  const appointments = getAppointments();
  appointments.push(appointment);
  saveAppointments(appointments);
}

export function getAppointmentsByDoctor(doctorUsername: string): Appointment[] {
  return getAppointments()
    .filter(a => a.doctorUsername === doctorUsername)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getAppointmentsByPatient(patientUsername: string): Appointment[] {
  return getAppointments()
    .filter(a => a.patientUsername === patientUsername)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateAppointmentStatus(id: string, status: Appointment['status']): boolean {
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx === -1) return false;
  appointments[idx].status = status;
  saveAppointments(appointments);
  return true;
}

export { UPLOAD_DIR };

// ========== EMERGENCIES ==========
const EMERGENCIES_FILE = join(DATA_DIR, 'emergencies.json');

export interface EmergencyAlert {
  id: string;
  patientUsername: string;
  patientName: string;
  lat: number;
  lng: number;
  bloodGroup: string;
  allergies: string[];
  vitals: { heartRate: number; bp: string; spo2: number; temp: number };
  problem: string;
  status: 'searching' | 'alerted' | 'accepted' | 'declined_all' | 'cancelled';
  doctorQueue: { username: string; fullName: string; specialty: string; distance: number; lat: number; lng: number; status: 'pending' | 'alerted' | 'accepted' | 'declined' }[];
  currentDoctorIndex: number;
  acceptedDoctor?: { username: string; fullName: string; specialty: string; distance: number; eta: number; lat: number; lng: number };
  alertedAt?: string;
  acceptedAt?: string;
  createdAt: string;
}

export function getEmergencies(): EmergencyAlert[] {
  ensureDirs();
  if (!existsSync(EMERGENCIES_FILE)) { writeFileSync(EMERGENCIES_FILE, '[]'); return []; }
  return JSON.parse(readFileSync(EMERGENCIES_FILE, 'utf-8'));
}

export function saveEmergencies(data: EmergencyAlert[]) {
  ensureDirs();
  writeFileSync(EMERGENCIES_FILE, JSON.stringify(data, null, 2));
}

export function addEmergency(e: EmergencyAlert) {
  const all = getEmergencies(); all.push(e); saveEmergencies(all);
}

export function getEmergencyById(id: string): EmergencyAlert | undefined {
  return getEmergencies().find(e => e.id === id);
}

export function updateEmergency(id: string, updates: Partial<EmergencyAlert>) {
  const all = getEmergencies();
  const idx = all.findIndex(e => e.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...updates };
  saveEmergencies(all);
}

export function getActiveEmergencyForDoctor(doctorUsername: string): EmergencyAlert | undefined {
  return getEmergencies().find(e =>
    (e.status === 'searching' || e.status === 'alerted') &&
    e.doctorQueue[e.currentDoctorIndex]?.username === doctorUsername &&
    e.doctorQueue[e.currentDoctorIndex]?.status === 'alerted'
  );
}

// ========== WALLET ==========
const WALLET_FILE = join(DATA_DIR, 'wallet.json');

export interface WalletTransaction {
  id: string;
  username: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  appointmentId?: string;
  createdAt: string;
}

export function getWalletTransactions(): WalletTransaction[] {
  ensureDirs();
  if (!existsSync(WALLET_FILE)) { writeFileSync(WALLET_FILE, '[]'); return []; }
  return JSON.parse(readFileSync(WALLET_FILE, 'utf-8'));
}

export function saveWalletTransactions(data: WalletTransaction[]) {
  ensureDirs();
  writeFileSync(WALLET_FILE, JSON.stringify(data, null, 2));
}

export function addWalletTransaction(t: WalletTransaction) {
  const all = getWalletTransactions(); all.push(t); saveWalletTransactions(all);
}

export function getWalletBalance(username: string): number {
  return getWalletTransactions()
    .filter(t => t.username === username)
    .reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0);
}

export function getUserWalletTransactions(username: string): WalletTransaction[] {
  return getWalletTransactions().filter(t => t.username === username);
}

// ========== HEALTH STREAKS ==========
const STREAKS_FILE = join(DATA_DIR, 'streaks.json');

export interface HealthStreak {
  username: string;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  lastCheckIn: string; // ISO date
  dailyLog: { date: string; medication: boolean; vitals: boolean; steps: boolean; water: boolean; points: number }[];
  rewards: { milestone: number; rewardName: string; claimedAt: string }[];
}

export function getStreaks(): HealthStreak[] {
  ensureDirs();
  if (!existsSync(STREAKS_FILE)) { writeFileSync(STREAKS_FILE, '[]'); return []; }
  return JSON.parse(readFileSync(STREAKS_FILE, 'utf-8'));
}

export function saveStreaks(data: HealthStreak[]) {
  ensureDirs();
  writeFileSync(STREAKS_FILE, JSON.stringify(data, null, 2));
}

export function getStreakForUser(username: string): HealthStreak | undefined {
  return getStreaks().find(s => s.username === username);
}

export function upsertStreak(streak: HealthStreak) {
  const all = getStreaks();
  const idx = all.findIndex(s => s.username === streak.username);
  if (idx >= 0) all[idx] = streak; else all.push(streak);
  saveStreaks(all);
}

// ========== INTEGRITY SCORES ==========
const INTEGRITY_FILE = join(DATA_DIR, 'integrity.json');

export interface IntegrityRecord {
  doctorUsername: string;
  score: number;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  breakdown: { cancellationRate: number; avgDelay: number; patientNoShow: number; rating: number; prescriptionQuality: number };
  calculatedAt: string;
}

export function getIntegrityRecords(): IntegrityRecord[] {
  ensureDirs();
  if (!existsSync(INTEGRITY_FILE)) { writeFileSync(INTEGRITY_FILE, '[]'); return []; }
  return JSON.parse(readFileSync(INTEGRITY_FILE, 'utf-8'));
}

export function saveIntegrityRecords(data: IntegrityRecord[]) {
  ensureDirs();
  writeFileSync(INTEGRITY_FILE, JSON.stringify(data, null, 2));
}

export function getIntegrityForDoctor(doctorUsername: string): IntegrityRecord | undefined {
  return getIntegrityRecords().find(r => r.doctorUsername === doctorUsername);
}

export function upsertIntegrity(record: IntegrityRecord) {
  const all = getIntegrityRecords();
  const idx = all.findIndex(r => r.doctorUsername === record.doctorUsername);
  if (idx >= 0) all[idx] = record; else all.push(record);
  saveIntegrityRecords(all);
}

// ========== FCM TOKENS ==========
const FCM_TOKENS_FILE = join(DATA_DIR, "fcmTokens.json");

export interface FcmTokenRecord {
  username: string;
  token: string;
  createdAt: string;
}

export function getFcmTokenRecords(): FcmTokenRecord[] {
  ensureDirs();
  if (!existsSync(FCM_TOKENS_FILE)) {
    writeFileSync(FCM_TOKENS_FILE, "[]");
    return [];
  }
  return JSON.parse(readFileSync(FCM_TOKENS_FILE, "utf-8")) as FcmTokenRecord[];
}

export function upsertFcmToken(username: string, token: string) {
  const all = getFcmTokenRecords();
  const idx = all.findIndex((r) => r.username === username && r.token === token);
  if (idx >= 0) return; // keep the existing record

  all.push({ username, token, createdAt: new Date().toISOString() });
  writeFileSync(FCM_TOKENS_FILE, JSON.stringify(all, null, 2));
}

export function getFcmTokensForUsername(username: string): string[] {
  return getFcmTokenRecords()
    .filter((r) => r.username === username)
    .map((r) => r.token);
}

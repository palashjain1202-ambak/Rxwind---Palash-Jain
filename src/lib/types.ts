export type Lang = "en" | "hi";
export type Slot = "morning" | "afternoon" | "evening" | "night";
export const SLOTS: Slot[] = ["morning", "afternoon", "evening", "night"];

export type Food = "before" | "after" | "with" | "empty" | "any";
export type Form =
  | "tablet"
  | "capsule"
  | "syrup"
  | "drops"
  | "cream"
  | "inhaler"
  | "injection"
  | "gargle"
  | "spray"
  | "powder"
  | "other";

export type Category =
  | "eye"
  | "respiratory"
  | "skin"
  | "infection"
  | "digestive"
  | "fever"
  | "pain"
  | "chronic"
  | "other";

export type Verdict = "helped" | "no-change" | "side-effect" | "unsure";

export interface Medicine {
  id: string;
  name: string;
  generic?: string;
  strength?: string;
  form: Form;
  dose: string; // e.g. "1 tablet", "2 drops each eye"
  frequencyCode?: string; // e.g. "1-0-1", "BD"
  slots: Record<Slot, boolean>;
  sos?: boolean;
  food: Food;
  durationDays?: number | null;
  purpose: { en: string; hi: string };
  confidence: number; // 0..1
  verdict?: Verdict;
  sideEffects?: string[];
}

export interface Prescription {
  id: string;
  doctor: string;
  specialty?: string;
  clinic?: string;
  date: string; // ISO yyyy-mm-dd
  diagnosis?: string;
  medicines: Medicine[];
  advice?: string[];
  followUp?: string | null;
  thumb?: string; // small data URL
  source: "demo" | "scan";
}

export interface CheckIn {
  date: string; // ISO
  feeling: 1 | 2 | 3 | 4 | 5; // 1 awful .. 5 great
  sideEffects: string[];
  note?: string;
}

export interface Episode {
  id: string;
  memberId: string;
  title: string;
  category: Category;
  startDate: string;
  endDate?: string | null;
  status: "active" | "resolved" | "ongoing";
  city?: string;
  prescriptions: Prescription[];
  checkIns: CheckIn[];
  outcome?: { en: string; hi: string } | null;
  doses?: Record<string, Partial<Record<string, boolean>>>; // date -> medId:slot -> taken
}

export interface Member {
  id: string;
  name: string;
  relation: { en: string; hi: string };
  age: number;
  city: string;
  allergies: string[];
  conditions: string[];
  tint: string;
}

export interface MemoryState {
  version: number;
  mode: "demo" | "mine";
  members: Member[];
  episodes: Episode[];
  activeMemberId: string;
  city: { name: string; lat: number; lon: number };
}

export interface ScanResult {
  isPrescription: boolean;
  legibility: "clear" | "partly" | "poor";
  doctor: string;
  specialty?: string;
  clinic?: string;
  date?: string | null;
  patientName?: string | null;
  diagnosis?: string;
  category: Category;
  episodeTitle: { en: string; hi: string };
  medicines: Omit<Medicine, "id" | "verdict" | "sideEffects">[];
  advice: string[];
  followUp?: string | null;
  warnings: string[];
}

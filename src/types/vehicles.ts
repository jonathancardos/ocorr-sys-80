// Temporary Vehicle type until Supabase types are regenerated
export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  technology: string[] | null;
  has_workshop?: boolean | null;
  priority?: number | null; // NEW FIELD
  blocker_installed?: boolean | null; // NEW FIELD
  raw_blocker_installed_text?: string | null; // NEW FIELD
  raw_priority_text?: string | null; // NEW FIELD
  created_at: string | null;
  updated_at: string | null;
}

export interface VehicleInsert {
  plate: string;
  model: string;
  technology?: string[] | null;
  has_workshop?: boolean | null;
  priority?: number | null; // NEW FIELD
  blocker_installed?: boolean | null; // NEW FIELD
  raw_blocker_installed_text?: string | null; // NEW FIELD
  raw_priority_text?: string | null; // NEW FIELD
}

export interface VehicleUpdate {
  plate?: string;
  model?: string;
  technology?: string[] | null;
  has_workshop?: boolean | null;
  priority?: number | null; // NEW FIELD
  blocker_installed?: boolean | null; // NEW FIELD
  raw_blocker_installed_text?: string | null; // NEW FIELD
  raw_priority_text?: string | null; // NEW FIELD
}
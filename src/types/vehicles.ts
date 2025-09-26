// Temporary Vehicle type until Supabase types are regenerated
export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  technology: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VehicleInsert {
  plate: string;
  model: string;
  technology?: string[] | null;
}

export interface VehicleUpdate {
  plate?: string;
  model?: string;
  technology?: string[] | null;
}
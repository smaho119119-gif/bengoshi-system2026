// データベース型定義

export interface Client {
  id: string;
  name: string;
  name_kana: string | null;
  client_type: "individual" | "corporate";
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Matter {
  id: string;
  client_id: string;
  title: string;
  matter_type: string | null;
  status: "active" | "hold" | "closed";
  description: string | null;
  owner_user_id: string | null;
  court_name: string | null;
  case_number: string | null;
  opponent_name: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  // リレーション
  client?: Client;
}

export interface Document {
  id: string;
  matter_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number | null;
  sha256: string | null;
  doc_type: "contract" | "evidence" | "claim" | "mail" | "image" | "other";
  is_latest: boolean;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface MatterStore {
  matter_id: string;
  store_name: string;
  store_display_name: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  matter_id: string;
  role: "user" | "assistant";
  content: string;
  user_id: string | null;
  created_at: string;
}

// フォーム用
export interface ClientFormData {
  name: string;
  name_kana?: string;
  client_type: "individual" | "corporate";
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface MatterFormData {
  client_id: string;
  title: string;
  matter_type?: string;
  status: "active" | "hold" | "closed";
  description?: string;
  court_name?: string;
  case_number?: string;
  opponent_name?: string;
  deadline?: string;
}

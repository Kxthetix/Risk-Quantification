// Phase 13: File Import Types

export interface FileImportPreview {
  import_id: string;
  filename: string;
  total_rows: number;
  detected_columns: string[];
  suggested_mappings: Record<string, string>;
  preview_rows: Record<string, any>[];
  valid_rows_count: number;
  invalid_rows_count: number;
  warnings: string[];
}

export interface FileImportItem {
  id: string;
  organization_id: string;
  user_id?: string | null;
  filename: string;
  file_type: string;
  import_type: string;
  status: "UPLOADED" | "PREVIEWED" | "PROCESSING" | "COMPLETED" | "FAILED";
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  column_mapping: Record<string, any>;
  created_at: string;
  completed_at?: string | null;
}

export interface ImportErrorDetail {
  row_number: number;
  field?: string | null;
  error: string;
  raw_row_data?: Record<string, any> | null;
}

import { apiClient } from "@/lib/api/client";
import type { FileImportItem, FileImportPreview, ImportErrorDetail } from "./types";

const BASE = "/imports";

export async function getImports(): Promise<FileImportItem[]> {
  return apiClient.get(BASE);
}

export async function uploadFileForImport(payload: {
  filename: string;
  file_type?: string;
  import_type?: string;
  raw_csv_text: string;
}): Promise<FileImportPreview> {
  return apiClient.post(`${BASE}/upload`, payload);
}

export async function getImportPreview(importId: string): Promise<FileImportPreview> {
  return apiClient.get(`${BASE}/${importId}/preview`);
}

export async function executeImport(
  importId: string,
  payload: { column_mapping: Record<string, string>; skip_invalid_rows?: boolean }
): Promise<FileImportItem> {
  return apiClient.post(`${BASE}/${importId}/execute`, payload);
}

export async function getImportErrors(importId: string): Promise<ImportErrorDetail[]> {
  return apiClient.get(`${BASE}/${importId}/errors`);
}

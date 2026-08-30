import { z } from "zod";

export const FileImportUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  file_type: z.enum(["CSV", "XLSX"]),
  import_type: z.enum(["ASSETS", "VULNERABILITIES", "BUSINESS_SERVICES", "CONTROLS"]),
  raw_csv_text: z.string().min(1, "CSV data content cannot be empty"),
});

export const FileImportExecuteSchema = z.object({
  column_mapping: z.record(z.string()),
  skip_invalid_rows: z.boolean().default(true),
});

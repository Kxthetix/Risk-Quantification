import { describe, expect, it } from "vitest";
import { FileImportUploadSchema, FileImportExecuteSchema } from "../schemas";

describe("File Import schemas validation", () => {
  it("should validate a valid file upload payload", () => {
    const payload = {
      filename: "cmdb_export.csv",
      file_type: "CSV" as const,
      import_type: "ASSETS" as const,
      raw_csv_text: "hostname,ip\nsrv1,10.0.0.1",
    };
    const res = FileImportUploadSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should fail validation if raw_csv_text is empty", () => {
    const payload = {
      filename: "empty.csv",
      file_type: "CSV" as const,
      import_type: "ASSETS" as const,
      raw_csv_text: "",
    };
    const res = FileImportUploadSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should validate a valid column mapping execution payload", () => {
    const payload = {
      column_mapping: {
        host_name: "name",
        ip_addr: "ip_address",
        os_ver: "operating_system",
      },
      skip_invalid_rows: true,
    };
    const res = FileImportExecuteSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });
});

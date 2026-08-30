import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executeImport, getImportErrors, getImportPreview, getImports, uploadFileForImport } from "./api";

export const IMPORT_KEYS = {
  all: ["imports"] as const,
  list: ["imports", "list"] as const,
  preview: (id: string) => ["imports", "preview", id] as const,
  errors: (id: string) => ["imports", "errors", id] as const,
};

export function useImports() {
  return useQuery({
    queryKey: IMPORT_KEYS.list,
    queryFn: getImports,
  });
}

export function useImportPreview(importId: string | null) {
  return useQuery({
    queryKey: IMPORT_KEYS.preview(importId || ""),
    queryFn: () => getImportPreview(importId!),
    enabled: Boolean(importId),
  });
}

export function useUploadFileImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadFileForImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_KEYS.all });
    },
  });
}

export function useExecuteImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      importId,
      payload,
    }: {
      importId: string;
      payload: { column_mapping: Record<string, string>; skip_invalid_rows?: boolean };
    }) => executeImport(importId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_KEYS.all });
    },
  });
}

export function useImportErrors(importId: string | null) {
  return useQuery({
    queryKey: IMPORT_KEYS.errors(importId || ""),
    queryFn: () => getImportErrors(importId!),
    enabled: Boolean(importId),
  });
}

"use client";

import React, { useState, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadOrganizationLogo } from "../hooks";
import { useOrganization } from "@/providers/OrganizationProvider";
import { useToast } from "@/providers/ToastProvider";
import { Can } from "@/components/auth/Can";

export function BrandingSettings() {
  const { organization } = useOrganization();
  const uploadMutation = useUploadOrganizationLogo();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(organization?.logo_url || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Organization logo must be smaller than 2MB.",
        variant: "error",
      });
      return;
    }

    // Validate type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please select a PNG, JPG, WebP, or SVG file.",
        variant: "error",
      });
      return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      await uploadMutation.mutateAsync({ file });
    } catch {
      // Handled by mutation
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast({
      title: "Logo Removed",
      description: "Organization branding logo reset to default placeholder.",
      variant: "info",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Logo Preview */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={organization?.name || "Logo"}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>

        {/* Upload Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Can permission="settings:edit">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploadMutation.isPending}
              >
                <Upload className="h-4 w-4" />
                <span>{previewUrl ? "Replace Logo" : "Upload Logo"}</span>
              </Button>
            </Can>

            {previewUrl && (
              <Can permission="settings:edit">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove</span>
                </Button>
              </Can>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Recommended dimensions: 256x256px. Max file size: 2MB (PNG, JPG, SVG, WebP).
          </p>
        </div>
      </div>
    </div>
  );
}

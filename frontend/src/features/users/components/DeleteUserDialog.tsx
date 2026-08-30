"use client";

import React, { useState } from "react";
import { useDeleteUser } from "../hooks";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

export interface DeleteUserDialogProps {
  userId: string;
  userName: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({
  userId,
  userName,
  userEmail,
  open,
  onOpenChange,
}: DeleteUserDialogProps) {
  const [typedEmail, setTypedEmail] = useState("");
  const deleteMutation = useDeleteUser();

  const isMatched = typedEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isMatched) return;
    try {
      await deleteMutation.mutateAsync(userId);
      setTypedEmail("");
      onOpenChange(false);
    } catch {
      // Handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle>Permanently Delete User</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            This action cannot be undone. All personal associations, assignments, and API sessions for{" "}
            <strong>{userName}</strong> will be permanently purged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            Please type <strong className="font-mono underline">{userEmail}</strong> below to
            confirm account deletion.
          </div>

          <FormField label="Confirmation Email" htmlFor="delete-confirm-email">
            <Input
              id="delete-confirm-email"
              placeholder={userEmail}
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
              className="font-mono text-xs"
            />
          </FormField>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setTypedEmail("");
              onOpenChange(false);
            }}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isMatched}
            isLoading={deleteMutation.isPending}
          >
            Permanently Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

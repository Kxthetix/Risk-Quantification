"use client";

import React from "react";
import { useRevokeSession, useRevokeAllOtherSessions } from "../hooks";
import { UserSession } from "../types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert } from "lucide-react";

export interface RevokeSessionDialogProps {
  session: UserSession | null;
  revokeAll?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RevokeSessionDialog({
  session,
  revokeAll = false,
  open,
  onOpenChange,
}: RevokeSessionDialogProps) {
  const revokeSingleMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllOtherSessions();

  const isPending = revokeSingleMutation.isPending || revokeAllMutation.isPending;

  const handleConfirm = async () => {
    if (revokeAll) {
      await revokeAllMutation.mutateAsync();
    } else if (session) {
      await revokeSingleMutation.mutateAsync(session.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle>
              {revokeAll ? "Revoke All Other Sessions?" : "Terminate Active Session?"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed">
            {revokeAll ? (
              "This action will immediately disconnect all active devices and browsers across your organization account except for this current browser."
            ) : (
              <>
                Terminate session on{" "}
                <strong>
                  {session?.browser || "Browser"} on {session?.os || "Operating System"}
                </strong>
                ? The user on that device will be prompted to re-authenticate.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleConfirm}
            isLoading={isPending}
          >
            {revokeAll ? "Revoke All Other Sessions" : "Terminate Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import useProjects from "@/hooks/use-project";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, UserPlus } from "lucide-react";

const InviteButton = () => {
  const { project } = useProjects();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite teammates</DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground text-sm">
            Share this link. Anyone with access can join the project.
          </p>

          <div className="flex items-center gap-2">
            <Input
              readOnly
              className="font-mono text-xs"
              value={`${window.location.origin}/join/${project?.id}`}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/join/${project?.id}`,
                );
                toast.success("Invite link copied");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" />
        Invite
      </Button>
    </>
  );
};

export default InviteButton;

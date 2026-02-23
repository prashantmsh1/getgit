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

const InviteButton = () => {
  const { project } = useProjects();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-500">
            Ask them to copy and paste this link.
          </p>

          <Input
            readOnly
            className="mt-4"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/join/${project?.id}`,
              );
              toast.success("Copied to clipboard");
            }}
            value={`${window.location.origin}/join/${project?.id}`}
          />
        </DialogContent>
      </Dialog>

      <Button size="sm" onClick={() => setOpen(true)}>
        Invite Members
      </Button>
    </>
  );
};

export default InviteButton;

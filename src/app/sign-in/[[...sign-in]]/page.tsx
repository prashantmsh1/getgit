import React from "react";
import { SignIn } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { GitBranch } from "lucide-react";

const page = () => {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center bg-background p-4 text-foreground">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg shadow-xs">
            <GitBranch className="text-primary-foreground h-4 w-4" />
          </div>
          <span className="text-foreground text-lg font-bold tracking-tight">getgit</span>
        </Link>
      </div>
      <div className="absolute top-6 right-6">
        <ModeToggle />
      </div>
      <SignIn />
    </div>
  );
};

export default page;

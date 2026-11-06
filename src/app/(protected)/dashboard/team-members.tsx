"use client";

import useProjects from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";
import Image from "next/image";

const TeamMembers = () => {
  const { projectId } = useProjects();

  const { data: members, isLoading } = api.project.getTeamMembers.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2"></div>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return null;
  }

  return (
    <div className="mr-1 flex items-center -space-x-2">
      {members.map((member) => (
        <div
          key={member.user.id}
          className="group relative flex items-center justify-center"
        >
          {member.user.imageUrl ? (
            <Image
              src={member.user.imageUrl}
              alt={member.user.name}
              width={32}
              height={32}
              className="ring-card h-8 w-8 rounded-full object-cover ring-2 transition-transform group-hover:z-10 group-hover:scale-105"
              title={member.user.name}
            />
          ) : (
            <div
              className="bg-primary text-primary-foreground ring-card flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-2 transition-transform group-hover:z-10 group-hover:scale-105"
              title={member.user.name}
            >
              {member.user.firstName?.charAt(0) ||
                member.user.name?.charAt(0) ||
                "U"}
            </div>
          )}

          <div className="bg-foreground text-background pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 scale-95 rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-sm transition-all group-hover:scale-100 group-hover:opacity-100">
            {member.user.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamMembers;

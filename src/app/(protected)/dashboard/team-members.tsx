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
    <div className="flex items-center gap-2">
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
              className="h-8 w-8 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110"
              title={member.user.name}
            />
          ) : (
            <div
              className="bg-primary flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm transition-transform group-hover:scale-110"
              title={member.user.name}
            >
              {member.user.firstName?.charAt(0) ||
                member.user.name?.charAt(0) ||
                "U"}
            </div>
          )}

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
            {member.user.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamMembers;

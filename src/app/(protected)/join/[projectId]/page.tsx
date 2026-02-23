import { db } from "@/server/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{ projectId: string }>;
};

const JoinProjectPage = async ({ params }: Props) => {
  const { projectId } = await params;
  
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const dbUser = await db.user.findUnique({
    where: {
      id: userId,
    },
  });
  const client = await clerkClient();

  const user = await client.users.getUser(userId);
  if (!dbUser && user.emailAddresses[0]) {
    await db.user.create({
      data: {
        id: userId,
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl,
        firstName: user.firstName!,
        lastName: user.lastName!,
        name: `${user.firstName} ${user.lastName}`,
      },
    });
  }

  const project = await db.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    return redirect("/projects");
  }

  try {
    await db.userToProject.create({
      data: {
        userId,
        projectId,
      },
    });

    
  } catch (error) {
    console.log(error);
    return redirect("/projects");
  }

  return redirect(`/dashboard/${projectId}`);
};

export default JoinProjectPage;

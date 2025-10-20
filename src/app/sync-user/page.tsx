import React from "react";

import { db } from "@/server/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

const SyncUser = async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User is not found");
  }

  const client = await clerkClient();

  const user = await client.users.getUser(userId);

  await db.user.upsert({
    where: { email: user.emailAddresses[0]?.emailAddress ?? "" },
    update: {
      imageUrl: user.imageUrl,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
    },
    create: {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      name: user.fullName ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      imageUrl: user.imageUrl,
    },
  });

  return redirect("/dashboard");
};

export default SyncUser;

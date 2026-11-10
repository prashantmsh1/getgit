import React from "react";

import { db } from "@/server/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const SyncUser = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const profile = {
    name: user.fullName ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    imageUrl: user.imageUrl,
  };

  const byId = await db.user.findUnique({ where: { id: userId } });
  if (byId) {
    await db.user.update({
      where: { id: userId },
      data: {
        ...profile,
        ...(email ? { email } : {}),
      },
    });
    return redirect("/dashboard");
  }

  const byEmail = email
    ? await db.user.findUnique({ where: { email } })
    : null;

  if (!byEmail) {
    await db.user.create({
      data: {
        id: userId,
        email,
        ...profile,
      },
    });
    return redirect("/dashboard");
  }

  // Related rows follow this id through ON UPDATE CASCADE.
  await db.user.update({
    where: { id: byEmail.id },
    data: {
      id: userId,
      ...profile,
    },
  });

  return redirect("/dashboard");
};

export default SyncUser;

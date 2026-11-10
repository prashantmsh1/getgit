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

  await db.$transaction(async (tx) => {
    const byId = await tx.user.findUnique({ where: { id: userId } });
    if (byId) {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...profile,
          ...(email ? { email } : {}),
        },
      });
      return;
    }

    const byEmail = email
      ? await tx.user.findUnique({ where: { email } })
      : null;

    if (!byEmail) {
      await tx.user.create({
        data: {
          id: userId,
          email,
          ...profile,
        },
      });
      return;
    }

    const oldId = byEmail.id;

    await tx.user.create({
      data: {
        id: userId,
        email: `pending:${userId}`,
        ...profile,
        credits: byEmail.credits,
        createdAt: byEmail.createdAt,
      },
    });

    await tx.userToProject.updateMany({
      where: { userId: oldId },
      data: { userId },
    });
    await tx.question.updateMany({
      where: { userId: oldId },
      data: { userId },
    });
    await tx.stripeTransaction.updateMany({
      where: { userId: oldId },
      data: { userId },
    });
    await tx.creditLedgerEntry.updateMany({
      where: { userId: oldId },
      data: { userId },
    });
    await tx.paypalTransaction.updateMany({
      where: { userId: oldId },
      data: { userId },
    });

    await tx.user.delete({ where: { id: oldId } });
    await tx.user.update({
      where: { id: userId },
      data: { email },
    });
  });

  return redirect("/dashboard");
};

export default SyncUser;

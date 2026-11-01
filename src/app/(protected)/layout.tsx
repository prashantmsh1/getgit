import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import React from "react";
import { AppSidebar } from "./app-sidebar";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

const Layout = async ({ children }: Props) => {
  const { userId } = await auth();

  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      redirect("/sync-user");
    }
  }

  return (
    <div className="">
      <SidebarProvider className="flex">
        <AppSidebar />

        <main className="flex min-h-svh min-w-0 flex-1 flex-col p-2">
          <div className="border-sidebar-border flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <UserButton />
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-1">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default Layout;

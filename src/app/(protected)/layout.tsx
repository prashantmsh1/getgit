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

        <main className="m-2 w-full">
          <div className="border-sidebar-border flex w-full items-center justify-between rounded-md border bg-white p-2 shadow-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              {/* <Search /> */}
            </div>
            <UserButton />
          </div>
          <div className="h-4"></div>
          <div className="h-screen">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default Layout;

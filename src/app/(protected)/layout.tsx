import { SidebarProvider } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import React from "react";
import { AppSidebar } from "./app-sidebar";

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <div className="">
      <SidebarProvider className="flex">
        <AppSidebar />

        <main className="mx-2 w-full">
          <div className="border-sidebar-border flex w-full items-center justify-between">
            {/* <Search */}
            <div></div>
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

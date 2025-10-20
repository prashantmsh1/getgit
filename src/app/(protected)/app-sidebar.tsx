"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import useProjects from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import {
  Bot,
  CreditCard,
  LayoutDashboard,
  Plus,
  Presentation,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Q&A",
    url: "/qa",
    icon: Bot,
  },
  {
    title: "Meetings",
    url: "/meetings",
    icon: Presentation,
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { projects = [], projectId, setProjectId } = useProjects();
  return (
    <Sidebar collapsible="icon" variant={"sidebar"} className="z-30">
      <SidebarHeader>Logo</SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent className="list-none space-y-2">
            {items.map((item) => (
              <SidebarMenuItem key={item.title} title={item.title}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className={cn(
                      {
                        "bg-primary text-white": pathname === item.url,
                      },
                      "",
                    )}
                  >
                    <item.icon />
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>

          <SidebarGroupContent className="list-none space-y-2">
            {projects.map((project, index) => (
              <SidebarMenuItem className=" " key={index} title={project.name}>
                <SidebarMenuButton className="" asChild>
                  <Link
                    onClick={() => setProjectId(project.id)}
                    href={"dashboard?projectId=" + project.id}
                    className={cn({
                      "bg-primary p-0 text-white": pathname === project.name,
                    })}
                  >
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded bg-gray-300 font-semibold text-gray-800",
                        {
                          "bg-blue-700 text-gray-50": projectId === project.id,
                        },
                      )}
                    >
                      {project.name[0]}
                    </span>
                    {open && <span>{project.name}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            <SidebarMenuItem>
              {open && (
                <Link href="/create" className="text-primary flex items-center">
                  <Button variant={"outline"}>
                    <Plus /> Create New Project
                  </Button>
                </Link>
              )}
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

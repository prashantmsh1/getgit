import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { GitBranch } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export const Navbar = () => {
  return (
    <nav className="fixed top-6 left-1/2 z-50 w-full max-w-5xl -translate-x-1/2 px-4 sm:px-6">
      <div className="dark:border-deep-space-blue-800/20 dark:bg-deep-space-blue-100/40 dark:shadow-yale-blue-500/10 flex h-14 items-center justify-between rounded-full border border-gray-200/50 bg-white/40 px-6 shadow-2xl shadow-gray-200/20 backdrop-blur-xl transition-all">
        <Link href="/" className="group flex items-center gap-2">
          <div className="bg-yale-blue-500 shadow-yale-blue-500/30 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <span className="bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-lg font-black tracking-tight text-transparent dark:from-white dark:to-sky-400">
            getgit
          </span>
        </Link>
        <div className="dark:text-deep-space-blue-900/70 hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          <Link
            href="#features"
            className="transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            How it Works
          </Link>
          <Link
            href="#pricing"
            className="transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            Pricing
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />

          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 dark:text-sky-400 dark:hover:text-white"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 sm:block dark:text-sky-400 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/create"
              className="from-yale-blue-600 to-rich-cerulean-500 shadow-rich-cerulean-500/20 hover:shadow-rich-cerulean-500/40 rounded-full bg-linear-to-r px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

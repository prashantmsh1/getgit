import { GitBranch } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="dark:border-deep-space-blue-800/20 dark:bg-deep-space-blue-50 border-t border-gray-200 bg-gray-50 transition-colors">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <GitBranch className="text-yale-blue-600 dark:text-yale-blue-500 h-5 w-5" />
          <span className="text-lg font-bold tracking-tight text-gray-900 transition-colors dark:text-white">
            getgit
          </span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500 md:mt-0 dark:text-gray-400">
          <Link
            href="/privacy"
            className="transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            Terms of Service
          </Link>
        </div>
        <div className="mt-4 md:mt-0">
          <p className="text-center text-xs leading-5 text-gray-500 transition-colors dark:text-gray-400">
            &copy; {new Date().getFullYear()} GetGit, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

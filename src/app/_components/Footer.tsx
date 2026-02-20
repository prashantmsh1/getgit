import { GitBranch } from "lucide-react";

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
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="dark:text-deep-space-blue-800 text-center text-xs leading-5 text-gray-500 transition-colors">
            &copy; 2026 GetGit, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

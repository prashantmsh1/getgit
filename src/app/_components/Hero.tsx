import { ArrowRight, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-36 pb-24 transition-colors lg:pt-52 lg:pb-32">
      {/* Premium Spotlight Background */}
      <div className="dark:from-yale-blue-400/20 dark:via-deep-space-blue-50/5 dark:to-deep-space-blue-50 absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-sky-400/20 via-white to-gray-50 transition-colors"></div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

      <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
        <Link
          href="/create"
          className="text-rich-cerulean-600 dark:border-yale-blue-600/30 dark:bg-yale-blue-500/10 dark:hover:bg-yale-blue-500/20 mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/50 px-4 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-white dark:text-sky-400 dark:shadow-none"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-gray-900 dark:text-gray-50">
            Introducing GetGit
          </span>
          <ArrowRight className="h-3 w-3" />
        </Link>

        <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tighter text-gray-900 transition-colors sm:text-7xl lg:text-8xl dark:text-white">
          Master any codebase in{" "}
          <span className="from-rich-cerulean-500 via-yale-blue-500 to-rich-cerulean-600 dark:from-rich-cerulean-300 bg-linear-to-br bg-clip-text text-transparent drop-shadow-sm dark:via-sky-400 dark:to-white">
            seconds.
          </span>
        </h1>
        <p className="dark:text-deep-space-blue-800 mx-auto mt-8 max-w-2xl text-lg leading-relaxed font-medium text-gray-600 transition-colors sm:text-xl">
          Drop in a GitHub link and our AI instantly summarizes the
          architecture, explains complex files, and answers unlimited questions
          about the code.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 gap-x-6 sm:flex-row">
          <Link
            href="/create"
            className="group dark:text-deep-space-blue-50 flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-8 py-4 text-base font-bold text-white shadow-xl shadow-gray-900/10 transition-all hover:scale-105 hover:bg-gray-800 sm:w-auto dark:bg-white dark:shadow-white/10 dark:hover:bg-gray-100"
          >
            Analyze Repository
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#demo"
            className="dark:border-deep-space-blue-800/30 dark:bg-deep-space-blue-100/30 dark:hover:bg-deep-space-blue-100/50 flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white/50 px-8 py-4 text-base font-bold text-gray-900 shadow-sm backdrop-blur-sm transition-all hover:bg-gray-100 sm:w-auto dark:text-white dark:shadow-none"
          >
            View Live Demo
          </a>
        </div>
      </div>

      {/* Premium Mock Terminal Glass Window */}
      <div className="mx-auto mt-20 max-w-5xl px-4 sm:mt-32 sm:px-6 lg:px-8">
        <div className="dark:bg-deep-space-blue-100/40 relative -rotate-2 skew-y-0 transform-gpu rounded-2xl border border-gray-200/50 bg-white/40 p-2 shadow-2xl backdrop-blur-2xl transition-transform duration-700 ease-out hover:rotate-0 sm:p-4 dark:border-white/10">
          {/* Glow effect behind the terminal */}
          <div className="from-rich-cerulean-400 dark:from-rich-cerulean-500 dark:to-yale-blue-500 absolute -inset-1 -z-10 rounded-2xl bg-linear-to-r to-sky-500 opacity-20 blur-2xl"></div>

          <div className="overflow-hidden rounded-xl bg-white shadow-inner ring-1 ring-gray-900/5 dark:bg-[#0d1117] dark:ring-white/10">
            {/* Mac window controls */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-white/5">
              <div className="h-3 w-3 rounded-full bg-[#ff5f56]"></div>
              <div className="h-3 w-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="h-3 w-3 rounded-full bg-[#27c93f]"></div>
              <div className="mx-auto flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Terminal className="h-3.5 w-3.5" /> getgit-cli
              </div>
            </div>
            {/* Terminal Content */}
            <div className="p-6 font-mono text-sm leading-relaxed text-gray-600 sm:p-8 sm:text-base dark:text-gray-300">
              <p className="flex items-center gap-2">
                <span className="text-rich-cerulean-500 dark:text-rich-cerulean-400 font-bold">
                  ~
                </span>{" "}
                <span className="text-gray-900 dark:text-white">
                  getgit init https://github.com/facebook/react
                </span>
              </p>
              <p className="mt-2 text-gray-400 dark:text-gray-500">
                Cloning repository...
              </p>
              <p className="text-gray-400 dark:text-gray-500">
                Indexing 15,234 files...
              </p>
              <p className="font-medium text-emerald-500 dark:text-emerald-400">
                ✓ Indexing complete (2.4s)
              </p>
              <br />
              <p className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                <span className="text-rich-cerulean-500 dark:text-rich-cerulean-400 font-bold">
                  ~
                </span>{" "}
                <span className="text-gray-900 dark:text-white">
                  getgit ask &quot;Explain the fiber reconciliation engine&quot;
                </span>
              </p>
              <div className="dark:border-yale-blue-500/20 dark:bg-yale-blue-500/10 mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-yale-blue-600 mb-2 font-semibold dark:text-sky-400">
                  GetGit AI:
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  The React Fiber reconciler uses a linked-list structure to
                  pause, abort, or yield work. Unlike the old stack reconciler,
                  it breaks rendering work down into units called
                  &apos;fibers&apos; which represent component instances...
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                    packages/react-reconciler/src/ReactFiber.js
                  </span>
                  <span className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                    ...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

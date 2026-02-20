import { Bot, FileCode2, GitCommit, Zap } from "lucide-react";

export const Features = () => {
  return (
    <div
      id="features"
      className="relative overflow-hidden py-24 transition-colors sm:py-32"
    >
      {/* Background glow for the section */}
      <div className="dark:bg-rich-cerulean-500/10 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-[120px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="dark:border-rich-cerulean-500/30 dark:bg-rich-cerulean-500/10 mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-600 dark:text-sky-400">
            <Zap className="h-4 w-4" />
            <span>Unmatched Capabilities</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 transition-colors sm:text-5xl dark:text-white">
            Everything you need to{" "}
            <span className="from-rich-cerulean-600 dark:from-rich-cerulean-400 bg-linear-to-r to-sky-500 bg-clip-text text-transparent dark:to-sky-400">
              master a codebase
            </span>
          </h2>
          <p className="dark:text-deep-space-blue-800 mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600 transition-colors">
            Whether you are onboarding to a new team, reviewing a massive PR, or
            just trying to understand an open-source library, GetGit has your
            back.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: AI Code Q&A (Wide) */}
          <div className="group hover:border-rich-cerulean-400/50 dark:bg-deep-space-blue-50/50 dark:hover:border-rich-cerulean-500/50 relative overflow-hidden rounded-3xl border border-gray-200 bg-white/60 p-8 shadow-2xl shadow-gray-200/20 backdrop-blur-xl transition-all md:col-span-2 dark:border-white/10 dark:shadow-none">
            <div className="from-rich-cerulean-500/5 dark:from-rich-cerulean-500/10 absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-8 md:gap-0">
              <div className="from-yale-blue-500 to-rich-cerulean-500 shadow-rich-cerulean-500/20 mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  AI Code Q&A
                </h3>
                <p className="dark:text-deep-space-blue-800 max-w-md text-lg leading-relaxed text-gray-600">
                  Ask natural language questions about your codebase. GetGit
                  understands the context and provides accurate answers with
                  exact file references.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Instant Summaries (Square) */}
          <div className="group hover:border-yale-blue-400/50 dark:bg-deep-space-blue-50/50 dark:hover:border-yale-blue-500/50 relative overflow-hidden rounded-3xl border border-gray-200 bg-white/60 p-8 shadow-2xl shadow-gray-200/20 backdrop-blur-xl transition-all md:col-span-1 dark:border-white/10 dark:shadow-none">
            <div className="from-yale-blue-500/5 dark:from-yale-blue-500/10 absolute inset-0 bg-linear-to-b to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="from-deep-space-blue-800 to-yale-blue-500 mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-lg">
                <FileCode2 className="h-6 w-6 text-white" />
              </div>
              <div className="mt-auto">
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  Instant Summaries
                </h3>
                <p className="dark:text-deep-space-blue-800 text-gray-600">
                  Get a high-level overview of any repository&apos;s
                  architecture and purpose in seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Commit Flow (Square) */}
          <div className="group dark:bg-deep-space-blue-50/50 relative overflow-hidden rounded-3xl border border-gray-200 bg-white/60 p-8 shadow-2xl shadow-gray-200/20 backdrop-blur-xl transition-all hover:border-sky-400/50 md:col-span-1 dark:border-white/10 dark:shadow-none dark:hover:border-sky-500/30">
            {/* Decorative dots */}
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 bg-[radial-gradient(#0000001a_1px,transparent_1px)] bg-size-[12px_12px] opacity-30 dark:bg-[radial-gradient(#ffffff22_1px,transparent_1px)]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="to-rich-cerulean-600 mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 shadow-lg">
                <GitCommit className="h-6 w-6 text-white" />
              </div>
              <div className="mt-auto">
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  Commit Flow
                </h3>
                <p className="dark:text-deep-space-blue-800 text-gray-600">
                  Understand how features evolved. Analyze commit histories
                  automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Indexing (Wide) */}
          <div className="group hover:border-yale-blue-300 dark:bg-deep-space-blue-50/50 relative overflow-hidden rounded-3xl border border-gray-200 bg-white/60 p-8 shadow-2xl shadow-gray-200/20 backdrop-blur-xl transition-all md:col-span-2 dark:border-white/10 dark:shadow-none dark:hover:border-white/30">
            {/* Soft glow in corner */}
            <div className="bg-yale-blue-500/10 group-hover:bg-yale-blue-500/20 dark:bg-yale-blue-500/30 dark:group-hover:bg-yale-blue-500/40 absolute -right-24 -bottom-24 h-64 w-64 rounded-full blur-3xl transition-colors" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-8 md:gap-0">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-gray-500/10 bg-linear-to-br from-gray-50/20 to-gray-50/5 shadow-lg backdrop-blur-md dark:border-white/10 dark:from-white/20 dark:to-white/5">
                <Zap className="h-6 w-6 text-gray-800 dark:text-white" />
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  Blazing Fast Indexing
                </h3>
                <p className="dark:text-deep-space-blue-800 max-w-md text-lg leading-relaxed text-gray-600">
                  We use advanced vector embeddings to index your codebase
                  rapidly, so you spend less time waiting and more time coding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

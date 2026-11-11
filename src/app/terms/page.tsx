import { type Metadata } from "next";
import Link from "next/link";
import { Navbar } from "../_components/Navbar";
import { Footer } from "../_components/Footer";
import { FileText, ArrowLeft, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | GetGit",
  description: "Terms of Service governing the use of GetGit.",
};

export default function TermsPage() {
  const lastUpdated = "November 11, 2026";

  return (
    <div className="dark:bg-deep-space-blue-50 selection:bg-yale-blue-500/30 min-h-screen bg-white transition-colors">
      <Navbar />

      <main className="container mx-auto max-w-4xl px-4 pt-36 pb-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-rich-cerulean-600 dark:text-sky-400 mb-8 inline-flex items-center gap-2 text-sm font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="border-b border-gray-200 pb-8 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
            <FileText className="h-3.5 w-3.5" />
            Legal Terms
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last Updated: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 pt-8 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p className="mt-3 leading-relaxed">
              By accessing or using GetGit (&quot;Service&quot;) available at{" "}
              <a
                href="https://getgit.prashantai.com"
                className="text-rich-cerulean-600 dark:text-sky-400 font-medium underline"
                target="_blank"
                rel="noreferrer"
              >
                https://getgit.prashantai.com
              </a>
              , you agree to be bound by these Terms of Service. If you do not agree with any part of these terms,
              you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              2. Description of Service
            </h2>
            <p className="mt-3 leading-relaxed">
              GetGit provides AI-assisted code repository indexing, questioning, architecture summaries, and meeting
              transcript analysis for developers and teams.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              3. User Accounts and Responsibilities
            </h2>
            <p className="mt-3 leading-relaxed">
              You are responsible for safeguarding your login credentials and maintaining the confidentiality of your account.
              You agree not to use the Service for any unlawful or abusive activities, including uploading malicious code,
              violating third-party intellectual property rights, or attempting to compromise the security of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              4. Code and Intellectual Property
            </h2>
            <p className="mt-3 leading-relaxed">
              You retain all ownership rights to any source code, documentation, or assets you submit or index with GetGit.
              By submitting repositories, you grant GetGit only the limited license necessary to process, index, and generate
              AI responses for you. We do not claim ownership over your code.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              5. Disclaimers and Limitation of Liability
            </h2>
            <p className="mt-3 leading-relaxed">
              The Service and AI-generated outputs are provided &quot;as is&quot; without warranties of any kind. While our AI
              tools strive for high accuracy, code explanations and suggestions should be reviewed and verified by qualified developers.
              GetGit will not be liable for any indirect, incidental, or consequential damages resulting from the use of the Service.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-8 dark:border-gray-800">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Mail className="h-5 w-5 text-sky-500" />
              6. Contact Information
            </h2>
            <p className="mt-3 leading-relaxed">
              For any questions regarding these Terms of Service, please contact us at{" "}
              <a
                href="mailto:support@prashantai.com"
                className="text-rich-cerulean-600 dark:text-sky-400 font-medium underline"
              >
                support@prashantai.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { type Metadata } from "next";
import Link from "next/link";
import { Navbar } from "../_components/Navbar";
import { Footer } from "../_components/Footer";
import { ShieldCheck, ArrowLeft, Lock, Database, UserCheck, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | GetGit",
  description:
    "Privacy Policy for GetGit explaining how we collect, use, and protect your information, including Google OAuth user data compliance.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "November 11, 2026";

  return (
    <div className="dark:bg-deep-space-blue-50 selection:bg-yale-blue-500/30 min-h-screen bg-white transition-colors">
      <Navbar />

      <main className="container mx-auto max-w-4xl px-4 pt-36 pb-20 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="text-rich-cerulean-600 dark:text-sky-400 mb-8 inline-flex items-center gap-2 text-sm font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="border-b border-gray-200 pb-8 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Legal & Compliance
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-10 pt-8 text-gray-700 dark:text-gray-300">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              1. Introduction
            </h2>
            <p className="mt-3 leading-relaxed">
              Welcome to <strong>GetGit</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), accessible via{" "}
              <a
                href="https://getgit.prashantai.com"
                className="text-rich-cerulean-600 dark:text-sky-400 font-medium underline"
                target="_blank"
                rel="noreferrer"
              >
                https://getgit.prashantai.com
              </a>
              . GetGit is an AI-powered developer tool designed to assist software engineers in understanding,
              querying, and indexing code repositories.
            </p>
            <p className="mt-3 leading-relaxed">
              We respect your privacy and are committed to protecting your personal data. This Privacy Policy details
              how we collect, use, store, and disclose your information when you access or use our web application,
              APIs, and related services (collectively, the &quot;Service&quot;).
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              2. Information We Collect
            </h2>
            <p className="mt-3 leading-relaxed">
              We collect information in the following ways depending on your interaction with GetGit:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <UserCheck className="h-4 w-4 text-sky-500" />
                  Account & Profile Information
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  When you sign up or log in (via Google, GitHub, or email through our authentication provider Clerk),
                  we collect your name, email address, avatar image, and unique user identifier.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <Database className="h-4 w-4 text-sky-500" />
                  Repository & Code Metadata
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  When you link a repository to GetGit, we index repository structures, commit history, and code snippets
                  solely to provide AI explanations, architectural summaries, and Q&amp;A features.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <p className="leading-relaxed">
                <strong>Meeting & Audio Transcripts (Optional):</strong> If you utilize our meeting summarization features,
                we process uploaded audio files or transcripts solely to produce summaries and action items.
              </p>
              <p className="leading-relaxed">
                <strong>Payment & Billing Data:</strong> Payment transactions are handled directly by certified third-party
                payment processors (Stripe or PayPal). We do not collect or store full credit card numbers or banking credentials.
              </p>
              <p className="leading-relaxed">
                <strong>Log & Device Data:</strong> We automatically log basic diagnostic information such as IP addresses,
                browser types, operating systems, and page request timestamps to ensure security and prevent abuse.
              </p>
            </div>
          </section>

          {/* Section 3 - Google Specific */}
          <section className="rounded-2xl border border-sky-200 bg-sky-50/40 p-6 dark:border-sky-900/50 dark:bg-sky-950/20">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Lock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              3. Google OAuth &amp; API Services User Data Policy
            </h2>
            <p className="mt-3 leading-relaxed">
              GetGit allows you to authenticate using your Google account via OAuth. When you choose to sign in with Google,
              we access only the basic profile information you have authorized (such as your name, email address, and avatar).
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-900 dark:text-white">
                Compliance with Google API Services User Data Policy:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  GetGit&apos;s use and transfer of information received from Google APIs adheres to the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-rich-cerulean-600 dark:text-sky-400 underline"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the <strong>Limited Use</strong> requirements.
                </li>
                <li>
                  <strong>No Human Inspection:</strong> We do not allow humans to read your raw user data received from Google
                  unless required for security investigations, compliance with applicable laws, or with your affirmative consent.
                </li>
                <li>
                  <strong>No Generalized AI Model Training:</strong> We explicitly do <strong>not</strong> use Google user
                  data to train, retrain, or fine-tune generalized, public, or foundation artificial intelligence and machine learning models.
                </li>
                <li>
                  <strong>No Data Selling or Advertising:</strong> We never sell, rent, or trade Google user data to third parties,
                  data brokers, or advertisers under any circumstances.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              4. How We Use Your Information
            </h2>
            <p className="mt-3 leading-relaxed">
              We use the information we collect strictly for the following purposes:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>To create, authenticate, and maintain your account on GetGit.</li>
              <li>To provide the core features of the platform: repository parsing, code search, AI Q&amp;A, and architecture breakdowns.</li>
              <li>To process transactions, subscription credits, and send billing receipts.</li>
              <li>To communicate important service announcements, security alerts, and customer support responses.</li>
              <li>To monitor, secure, and defend our infrastructure against unauthorized access, malicious attacks, and fraudulent activity.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              5. Third-Party Service Providers
            </h2>
            <p className="mt-3 leading-relaxed">
              We work with trusted third-party service providers who assist us in operating our platform. These third parties
              have access to personal data only to perform specific tasks on our behalf and are obligated not to disclose or use it
              for any other purpose:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li><strong>Clerk:</strong> For secure authentication and user session management.</li>
              <li><strong>Google Cloud &amp; AI Providers (e.g., Google Gemini API):</strong> For processing specific user-submitted Q&amp;A queries and code summaries strictly on-demand.</li>
              <li><strong>Stripe &amp; PayPal:</strong> For payment gateway processing and invoicing.</li>
              <li><strong>Inngest &amp; Cloud Database Providers:</strong> For asynchronous task execution, background indexing, and encrypted persistent storage.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              6. Data Storage, Retention, and Security
            </h2>
            <p className="mt-3 leading-relaxed">
              We implement industry-standard security safeguards designed to protect personal data from loss, unauthorized
              access, disclosure, alteration, and destruction. All web traffic is encrypted in transit via HTTPS/TLS 1.3,
              and sensitive stored tokens are encrypted at rest using industry-standard AES encryption.
            </p>
            <p className="mt-3 leading-relaxed">
              We retain personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy,
              or until you delete your account or request data purging.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              7. Your Rights, Data Deletion, and Revoking Permissions
            </h2>
            <p className="mt-3 leading-relaxed">
              Depending on your location, you may have rights under applicable privacy laws (such as GDPR or CCPA/CPRA),
              including the right to access, rectify, port, or erase your personal information.
            </p>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                How to exercise your data rights:
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                <li>
                  <strong>Revoke Google Access:</strong> You can disconnect GetGit or revoke OAuth access to your Google account
                  at any time via the{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noreferrer"
                    className="text-rich-cerulean-600 dark:text-sky-400 font-medium underline"
                  >
                    Google Account Permissions Page
                  </a>
                  .
                </li>
                <li>
                  <strong>Project &amp; Repository Removal:</strong> You can remove indexed repositories or project data
                  directly within your GetGit dashboard settings.
                </li>
                <li>
                  <strong>Complete Account &amp; Data Deletion:</strong> To request complete deletion of your account and all
                  associated data, please email us at{" "}
                  <a
                    href="mailto:support@prashantai.com"
                    className="text-rich-cerulean-600 dark:text-sky-400 font-medium underline"
                  >
                    support@prashantai.com
                  </a>
                  . We will process your deletion request within 30 days.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              8. Children&apos;s Privacy
            </h2>
            <p className="mt-3 leading-relaxed">
              GetGit is not directed to individuals under the age of 13 (or under 16 in certain jurisdictions), and we do not
              knowingly collect personal information from children. If you become aware that a child has provided us with personal
              data, please contact us and we will delete such information promptly.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              9. Changes to this Policy
            </h2>
            <p className="mt-3 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or applicable legal
              obligations. If material changes are made, we will update the &quot;Last Updated&quot; date at the top of this
              document and, where appropriate, notify you via our website or email.
            </p>
          </section>

          {/* Section 10 */}
          <section className="border-t border-gray-200 pt-8 dark:border-gray-800">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <Mail className="h-5 w-5 text-sky-500" />
              10. Contact Us
            </h2>
            <p className="mt-3 leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices,
              please reach out to us at:
            </p>
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="font-semibold text-gray-900 dark:text-white">GetGit / Prashant AI</p>
              <p className="text-gray-600 dark:text-gray-400">
                Email:{" "}
                <a
                  href="mailto:support@prashantai.com"
                  className="text-rich-cerulean-600 dark:text-sky-400 underline"
                >
                  support@prashantai.com
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Website:{" "}
                <a
                  href="https://getgit.prashantai.com"
                  className="text-rich-cerulean-600 dark:text-sky-400 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://getgit.prashantai.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

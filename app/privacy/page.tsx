import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { Navbar } from "@/components/Navbar";

export default async function PrivacyPage() {
    const session = await auth0.getSession();
    const authenticated = Boolean(session);

    return (
        <main className="min-h-screen bg-vigil-bgPri text-vigil-textPri">
            <Navbar authenticated={authenticated} email={session?.user?.email ?? ""} />

            <section className="pt-[140px] pb-20 px-6 max-w-[920px] mx-auto">
                <p className="text-vigil-textSec text-[11px] font-sans uppercase tracking-[0.16em] mb-6">
                    PRIVACY POLICY
                </p>
                <h1 className="font-serif text-[52px] md:text-[72px] font-light leading-[1.05] tracking-tight mb-6">
                    Vigil Privacy Policy
                </h1>
                <p className="text-vigil-textSec text-[14px] leading-relaxed mb-4">
                    Effective date: April 7, 2026
                </p>
                <p className="text-vigil-textSec text-[14px] leading-relaxed mb-12">
                    This policy reflects the current hackathon MVP. Vigil is a prototype,
                    not a production-grade legal or estate platform.
                </p>

                <div className="space-y-10">
                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            1. What Vigil Is
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Vigil is a digital estate agent prototype built for a hackathon.
                            It lets users configure actions (for example, sending a message,
                            archiving a folder, or transferring a repository) that may run
                            after a prolonged silence period plus a confirmation window.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            2. Data We Collect
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed mb-3">
                            We store only the minimum data needed to run this MVP:
                        </p>
                        <ul className="list-disc pl-6 text-[15px] text-vigil-textSec leading-relaxed space-y-2 marker:text-vigil-accentPri">
                            <li>Auth identity information from Auth0 (for example, user id and email).</li>
                            <li>Configuration data such as silence threshold and grace window.</li>
                            <li>Heartbeat/check-in timing data used to determine last-seen status.</li>
                            <li>Staged actions and related setup data.</li>
                            <li>Contact context that you provide to personalize messages.</li>
                            <li>Audit log entries for system and action events.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            3. Credentials and Token Handling
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Vigil uses Auth0 Token Vault for connected-account credentials.
                            OAuth tokens are fetched at runtime for specific actions. The app
                            database is designed not to store OAuth access tokens or refresh
                            tokens. Token values are intended to never be written to audit logs.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            4. How We Use Data
                        </h2>
                        <ul className="list-disc pl-6 text-[15px] text-vigil-textSec leading-relaxed space-y-2 marker:text-vigil-accentPri">
                            <li>Authenticate you and maintain your session.</li>
                            <li>Support onboarding and setup conversations.</li>
                            <li>Evaluate silence windows and confirmation/grace timing.</li>
                            <li>Execute staged actions when conditions are met.</li>
                            <li>Generate and display an event audit trail.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            5. AI Usage
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed mb-3">
                            In this MVP, AI is used for:
                        </p>
                        <ul className="list-disc pl-6 text-[15px] text-vigil-textSec leading-relaxed space-y-2 marker:text-vigil-accentPri">
                            <li>Parsing setup intent from conversational input.</li>
                            <li>Drafting personalized message content at activation time.</li>
                        </ul>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed mt-3">
                            Silence detection logic is arithmetic on timestamps and does not
                            rely on AI inference.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            6. Data Sharing
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            We do not sell personal data. Data is shared only with services
                            required to run Vigil (for example, Auth0, model providers, and
                            connected third-party APIs) and only as necessary for the feature
                            you use.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            7. Security and Limitations
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            This is a hackathon build and may contain bugs, service limits,
                            and incomplete controls. Do not treat Vigil as a substitute for
                            legal planning, professional estate tools, or high-assurance
                            production infrastructure.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            8. Your Choices
                        </h2>
                        <ul className="list-disc pl-6 text-[15px] text-vigil-textSec leading-relaxed space-y-2 marker:text-vigil-accentPri">
                            <li>You can stop using Vigil at any time.</li>
                            <li>You can modify staged actions and relationship context.</li>
                            <li>You can disconnect connected accounts to revoke delegated access.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            9. Contact
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Questions about this policy can be directed to the project team
                            through the hackathon submission channel.
                        </p>
                    </section>
                </div>

                <div className="mt-14 pt-6 border-t border-vigil-borderSubtle flex flex-wrap gap-6 text-[12px] uppercase tracking-[0.12em] text-vigil-textSec">
                    <Link href="/" className="hover:text-vigil-textPri transition-colors">
                        Home
                    </Link>
                    <Link href="/tos" className="hover:text-vigil-textPri transition-colors">
                        Terms of Service
                    </Link>
                </div>
            </section>
        </main>
    );
}

import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { Navbar } from "@/components/Navbar";

export default async function TermsOfServicePage() {
    const session = await auth0.getSession();
    const authenticated = Boolean(session);

    return (
        <main className="min-h-screen bg-vigil-bgPri text-vigil-textPri">
            <Navbar authenticated={authenticated} email={session?.user?.email ?? ""} />

            <section className="pt-[140px] pb-20 px-6 max-w-[920px] mx-auto">
                <p className="text-vigil-textSec text-[11px] font-sans uppercase tracking-[0.16em] mb-6">
                    TERMS OF SERVICE
                </p>
                <h1 className="font-serif text-[52px] md:text-[72px] font-light leading-[1.05] tracking-tight mb-6">
                    Vigil Terms of Service
                </h1>
                <p className="text-vigil-textSec text-[14px] leading-relaxed mb-4">
                    Effective date: April 7, 2026
                </p>
                <p className="text-vigil-textSec text-[14px] leading-relaxed mb-12">
                    These terms are for a hackathon MVP and are intentionally lightweight.
                    Vigil is not offered as a production-grade commercial service.
                </p>

                <div className="space-y-10">
                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            1. Service Scope
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Vigil is a prototype that helps users configure and potentially
                            execute digital actions after a period of user silence and a
                            confirmation/grace flow. It is a demonstration product, not a
                            guaranteed operational platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            2. No Legal or Fiduciary Service
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Vigil is not a law firm, fiduciary, executor, trust service, or
                            legal substitute for wills and estate planning documents. Use of
                            Vigil does not create legal advice obligations.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            3. User Responsibility
                        </h2>
                        <ul className="list-disc pl-6 text-[15px] text-vigil-textSec leading-relaxed space-y-2 marker:text-vigil-accentPri">
                            <li>You are responsible for the instructions you configure.</li>
                            <li>You must ensure you have rights to any assets you direct Vigil to act on.</li>
                            <li>You are responsible for choosing and maintaining correct contacts and destinations.</li>
                            <li>You should keep your setup updated as your circumstances change.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            4. Connected Accounts
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Vigil uses delegated account access via Auth0 Token Vault. You can
                            revoke account access by disconnecting integrations. If external
                            providers change APIs, scopes, or permissions, features may break
                            without notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            5. AI-Generated Content
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Vigil may generate draft messages using AI based on your saved
                            context. Generated text may be imperfect or inaccurate. You accept
                            the risk of AI-generated output quality in this prototype.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            6. Availability and Reliability
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Vigil is provided on an as-is, as-available basis for demonstration
                            purposes. There are no uptime guarantees, delivery guarantees,
                            execution guarantees, or support-level commitments.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            7. Limitation of Liability
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            To the maximum extent permitted by applicable law, the Vigil team
                            is not liable for direct, indirect, incidental, consequential, or
                            special damages resulting from use of or inability to use this MVP,
                            including failed or unintended executions.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            8. Changes to the Service and Terms
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            We may modify, suspend, or discontinue any part of Vigil at any
                            time during or after the hackathon. We may also update these terms
                            as the project evolves.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-sans text-[13px] uppercase tracking-[0.12em] text-vigil-textPri mb-3">
                            9. Contact
                        </h2>
                        <p className="text-[15px] text-vigil-textSec leading-relaxed">
                            Questions about these terms can be directed to the project team
                            through the hackathon submission channel.
                        </p>
                    </section>
                </div>

                <div className="mt-14 pt-6 border-t border-vigil-borderSubtle flex flex-wrap gap-6 text-[12px] uppercase tracking-[0.12em] text-vigil-textSec">
                    <Link href="/" className="hover:text-vigil-textPri transition-colors">
                        Home
                    </Link>
                    <Link href="/privacy" className="hover:text-vigil-textPri transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </section>
        </main>
    );
}

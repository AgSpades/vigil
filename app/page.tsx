import { auth0 } from "@/lib/auth0";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import Link from "next/link";

export default async function Home() {
  const session = await auth0.getSession();
  const authenticated = !!session;

  return (
    <main className="min-h-screen bg-vigil-bgPri relative overflow-hidden text-vigil-textPri">
      <Navbar authenticated={authenticated} email={session?.user?.email} />

      {/* Hero Section */}
      <section className="relative pt-[200px] pb-[120px] px-6 flex flex-col items-center text-center max-w-[900px] mx-auto fade-up">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, color-mix(in srgb, var(--color-vigil-accentPri) 6%, transparent) 0%, transparent 70%)",
          }}
        ></div>

        <p className="text-vigil-textSec text-[11px] font-sans uppercase tracking-[0.16em] mb-8">
          DIGITAL ESTATE AGENT
        </p>

        <h1 className="font-serif text-[64px] sm:text-[96px] md:text-[120px] font-light leading-[1.0] mb-8 max-w-[900px] tracking-tight">
          Your final instructions,
          <br />
          carried out.
        </h1>

        <p className="text-vigil-textSec text-[16px] font-light max-w-[480px] mb-12 leading-relaxed">
          Vigil watches.<br></br> When it stops hearing from you, it acts on
          your behalf.
        </p>

        <Link href={authenticated ? "/dashboard" : "/auth/login"}>
          <Button variant="primary" className="mb-4">
            Begin your vigil
          </Button>
        </Link>
        <span className="text-[11px] text-vigil-textTer font-sans">
          Free to start. No card required.
        </span>
      </section>

      {/* How It Works */}
      <section className="py-[120px] px-6 max-w-[1200px] mx-auto fade-up delay-100">
        <div className="mb-16">
          <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec mb-4">
            HOW IT WORKS
          </h2>
          <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
        </div>

        <div className="flex flex-col gap-32 md:gap-48 relative mt-24">
          <div className="absolute left-[24px] md:left-1/2 top-4 bottom-4 w-[1px] bg-vigil-borderSubtle hidden md:block"></div>

          <div className="flex flex-col md:flex-row w-full justify-start relative group">
            <div className="md:w-[45%]">
              <div className="font-serif text-[100px] md:text-[140px] leading-none text-vigil-borderSubtle mb-6 -ml-2 group-hover:text-vigil-accentPri transition-colors duration-700">
                01
              </div>
              <h3 className="font-sans text-[15px] font-medium uppercase tracking-[0.1em] text-vigil-textPri mb-4">
                CONNECT
              </h3>
              <p className="text-[15px] font-light text-vigil-textSec leading-relaxed">
                Link your Gmail, GitHub, and Drive. Vigil holds access securely
                via Auth0 Token Vault — your credentials never touch our
                servers.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full justify-end relative text-left md:text-right group">
            <div className="md:w-[45%]">
              <div className="font-serif text-[100px] md:text-[140px] leading-none text-vigil-borderSubtle mb-6 md:-mr-2 group-hover:text-vigil-statusAlert transition-colors duration-700">
                02
              </div>
              <h3 className="font-sans text-[15px] font-medium uppercase tracking-[0.1em] text-vigil-textPri mb-4">
                INSTRUCT
              </h3>
              <p className="text-[15px] font-light text-vigil-textSec leading-relaxed">
                Tell Vigil what to do in plain language. Who to email. What
                tone. Which repos to transfer. It listens, confirms, and
                remembers.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full justify-start relative group">
            <div className="md:w-[45%]">
              <div className="font-serif text-[100px] md:text-[140px] leading-none text-vigil-borderSubtle mb-6 -ml-2 group-hover:text-vigil-statusWatch transition-colors duration-700">
                03
              </div>
              <h3 className="font-sans text-[15px] font-medium uppercase tracking-[0.1em] text-vigil-textPri mb-4">
                REST
              </h3>
              <p className="text-[15px] font-light text-vigil-textSec leading-relaxed">
                Check in when you want. If Vigil stops hearing from you, it
                sends one final confirmation push — then acts, exactly as you
                asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Callout */}
      <section className="w-full bg-vigil-bgSec border-y border-vigil-borderSubtle py-[120px] md:py-[180px] fade-up delay-200">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <h2 className="font-serif text-[48px] md:text-[72px] lg:text-[88px] font-light text-vigil-textPri leading-[1.05] tracking-tight">
            Not a reminder.
            <br />
            Not a notification.
            <br />
            <span className="text-vigil-accentPri border-b border-vigil-accentPri/30 pb-2">
              An agent that acts.
            </span>
          </h2>
          <div className="relative border-l border-vigil-borderSubtle pl-10 py-6 flex flex-col gap-12 lg:ml-12">
            <div className="relative">
              <div className="absolute -left-[45px] top-1 w-2 h-2 rounded-full bg-vigil-statusWatch"></div>
              <p className="text-[15px] text-vigil-textPri font-sans">
                Day 0 — You check in
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-[45px] top-1 w-2 h-2 rounded-full bg-vigil-statusAlert animate-pulseAlert"></div>
              <p className="text-[15px] text-vigil-textPri font-sans">
                Day 7 — Vigil sends a confirmation push
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-[45px] top-1 w-2 h-2 rounded-full bg-vigil-statusDown"></div>
              <p className="text-[15px] text-vigil-textPri font-sans text-vigil-accentPri">
                Day 8 — If no response, instructions execute
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Callout */}
      <section className="py-[120px] px-6 max-w-[1200px] mx-auto fade-up delay-300">
        <div className="mb-16">
          <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec mb-4">
            BUILT ON TRUST
          </h2>
          <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h3 className="font-serif text-[32px] font-light text-vigil-textPri mb-6">
              Your credentials never leave Auth0.
            </h3>
            <p className="text-[15px] font-light text-vigil-textSec leading-relaxed">
              We designed Vigil so we don't hold the keys. Our architecture
              ensures that we only interact with your connected services at the
              exact moment of execution.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Card padding="md">
              <h4 className="text-[14px] font-medium text-vigil-textPri mb-2">
                Zero token storage
              </h4>
              <p className="text-[13px] text-vigil-textSec">
                Vigil fetches a short-lived token at execution time only.
              </p>
            </Card>
            <Card padding="md">
              <h4 className="text-[14px] font-medium text-vigil-textPri mb-2">
                Revocable instantly
              </h4>
              <p className="text-[13px] text-vigil-textSec">
                Disconnect any service from your dashboard at any time.
              </p>
            </Card>
            <Card padding="md">
              <h4 className="text-[14px] font-medium text-vigil-textPri mb-2">
                Full audit trail
              </h4>
              <p className="text-[13px] text-vigil-textSec">
                Every action Vigil takes is logged. Nothing happens silently.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-[120px] px-6 flex flex-col items-center text-center">
        <h2 className="font-serif text-[40px] md:text-[56px] font-light text-vigil-textPri mb-10">
          Begin your vigil.
        </h2>
        <Link
          href={authenticated ? "/dashboard" : "/auth/login"}
          className="mb-6"
        >
          <Button variant="primary">Get started </Button>
        </Link>
        {!authenticated && (
          <p className="text-[12px] text-vigil-textTer font-sans">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="hover:text-vigil-textPri transition-colors"
            >
              Sign in.
            </Link>
          </p>
        )}
      </section>

      <footer className="border-t border-vigil-borderSubtle py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-[12px] text-vigil-textTer max-w-[1200px] mx-auto w-full">
        <div className="font-serif text-[18px] tracking-[0.2em] mb-4 md:mb-0">
          VIGIL
        </div>
        <div className="mb-4 md:mb-0">
          © {new Date().getFullYear()} Vigil Inc.
        </div>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-vigil-textSec transition-colors">
            Privacy
          </Link>
          <Link href="#" className="hover:text-vigil-textSec transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}

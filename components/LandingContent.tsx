"use client";

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  Mail,
  Database,
  HardDrive,
  Lock,
  ShieldCheck,
  FileKey2,
  CheckCircle2,
  ChevronRight,
  Activity,
} from "lucide-react";

export function LandingContent({ authenticated }: { authenticated: boolean }) {
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const [activeStep, setActiveStep] = useState<number | null>(null);

  const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const fadeUpItem = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: easeOutQuart },
    },
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-[200px] pb-[120px] px-6 flex flex-col items-center text-center max-w-[900px] mx-auto">
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            y: yBg,
            background:
              "radial-gradient(ellipse at 50% 60%, color-mix(in srgb, var(--color-vigil-accentPri) 6%, transparent) 0%, transparent 70%)",
          }}
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          <motion.p
            variants={fadeUpItem}
            className="text-vigil-textSec text-[11px] font-sans uppercase tracking-[0.16em] mb-8"
          >
            DIGITAL ESTATE AGENT
          </motion.p>

          <motion.h1
            variants={fadeUpItem}
            className="font-serif text-[64px] sm:text-[96px] md:text-[120px] font-light leading-[1.0] mb-8 max-w-[900px] tracking-tight"
          >
            Your final instructions,
            <br />
            carried out.
          </motion.h1>

          <motion.p
            variants={fadeUpItem}
            className="text-vigil-textSec text-[16px] font-light max-w-[480px] mb-12 leading-relaxed"
          >
            Vigil watches.<br></br> When it stops hearing from you, it acts on
            your behalf.
          </motion.p>

          <motion.div variants={fadeUpItem}>
            <Link href={authenticated ? "/dashboard" : "/auth/login"}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="primary" className="mb-4">
                  Begin your vigil
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works - With Interactive Onboarding Mockups */}
      <section className="py-[120px] px-6 max-w-[1200px] mx-auto overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: easeOutQuart }}
          className="mb-16"
        >
          <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec mb-4">
            HOW IT WORKS
          </h2>
          <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
        </motion.div>

        <div className="flex flex-col gap-32 md:gap-40 lg:gap-48 relative mt-12 md:mt-24">
          <div className="absolute left-[24px] lg:left-1/2 top-4 bottom-4 w-[1px] bg-vigil-borderSubtle hidden lg:block"></div>

          {/* Step 1: Connect */}
          <div
            className="flex flex-col lg:flex-row w-full justify-start relative group"
            onMouseEnter={() => setActiveStep(1)}
            onMouseLeave={() => setActiveStep(null)}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: easeOutQuart }}
              className="lg:w-[45%] pr-8"
            >
              <div className="font-serif text-[100px] md:text-[140px] leading-none text-vigil-borderSubtle mb-6 -ml-2 transition-colors duration-700 group-hover:text-vigil-accentPri">
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
            </motion.div>

            {/* Interactive Mockup */}
            <motion.div
              className="lg:w-[45%] lg:absolute lg:right-0 lg:top-[20%] mt-12 lg:mt-0"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: easeOutQuart }}
            >
              <div
                className={`rounded-lg border border-vigil-borderSubtle bg-vigil-bgSec/50 backdrop-blur-md p-6 transition-all duration-500 ${activeStep === 1 ? "border-vigil-accentPri/50 shadow-[0_0_30px_rgba(196,98,45,0.1)]" : ""}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="w-4 h-4 text-vigil-accentPri" />
                  <span className="text-[13px] font-medium text-vigil-textPri">
                    Auth0 Token Vault Connection
                  </span>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      icon: Mail,
                      name: "Gmail API",
                      status: "Connected",
                      color: "text-vigil-statusWatch",
                    },
                    {
                      icon: Database,
                      name: "GitHub Repos",
                      status: "Connected",
                      color: "text-vigil-statusWatch",
                    },
                    {
                      icon: HardDrive,
                      name: "Google Drive",
                      status: "Awaiting",
                      color: "text-vigil-textTer",
                    },
                  ].map((service, i) => (
                    <motion.div
                      key={service.name}
                      initial={{ x: 0 }}
                      animate={{ x: activeStep === 1 ? 5 : 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="flex items-center justify-between p-3 rounded bg-vigil-bgPri border border-vigil-borderSubtle group-hover:border-vigil-borderSubtle/80"
                    >
                      <div className="flex items-center gap-3">
                        <service.icon className="w-4 h-4 text-vigil-textSec" />
                        <span className="text-[14px] text-vigil-textPri">
                          {service.name}
                        </span>
                      </div>
                      <span
                        className={`text-[12px] ${service.color} flex items-center gap-1`}
                      >
                        {service.status === "Connected" && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {service.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Step 2: Instruct */}
          <div
            className="flex flex-col lg:flex-row w-full justify-end relative lg:text-right group"
            onMouseEnter={() => setActiveStep(2)}
            onMouseLeave={() => setActiveStep(null)}
          >
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: easeOutQuart }}
              className="lg:w-[45%] lg:pl-8 ml-auto order-first lg:order-last"
            >
              <div className="font-serif text-[100px] md:text-[140px] leading-none text-vigil-borderSubtle mb-6 lg:-mr-2 transition-colors duration-700 group-hover:text-vigil-statusAlert">
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
            </motion.div>

            {/* Interactive Mockup */}
            <motion.div
              className="lg:w-[45%] lg:absolute lg:left-0 lg:top-[20%] mt-12 lg:mt-0 text-left"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: easeOutQuart }}
            >
              <div
                className={`rounded-lg border border-vigil-borderSubtle bg-vigil-bgSec/50 backdrop-blur-md p-6 transition-all duration-500 ${activeStep === 2 ? "border-vigil-statusAlert/50 shadow-[0_0_30px_rgba(196,98,45,0.1)]" : ""}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-vigil-statusAlert animate-pulseAlert"></div>
                  <span className="text-[13px] font-medium text-vigil-textPri">
                    Instruction Processing
                  </span>
                </div>
                <div className="space-y-3 font-mono text-[12px] md:text-[13px]">
                  <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: activeStep === 2 ? 1 : 0.5 }}
                    className="p-3 rounded bg-vigil-bgPri border border-vigil-borderSubtle text-vigil-textSec"
                  >
                    <span className="text-vigil-accentPri">{">"}</span>{" "}
                    &quot;Email my wife and share the vault key. Transfer the
                    &apos;nextjs-saas&apos; repo to my cofounder.&quot;
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: activeStep === 2 ? 1 : 0,
                      height: activeStep === 2 ? "auto" : 0,
                    }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="p-3 border-l-2 border-vigil-statusWatch bg-[#0D1F14]/50 text-vigil-statusWatch overflow-hidden"
                  >
                    Vigil: Parsed 2 instructions.
                    <br />
                    1. Send email (Vault credentials)
                    <br />
                    2. Transfer repository ownership
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Step 3: Rest */}
          <div
            className="flex flex-col lg:flex-row w-full justify-start relative group"
            onMouseEnter={() => setActiveStep(3)}
            onMouseLeave={() => setActiveStep(null)}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: easeOutQuart }}
              className="lg:w-[45%] pr-8"
            >
              <div className="font-serif text-[100px] md:text-[140px] leading-none text-vigil-borderSubtle mb-6 -ml-2 transition-colors duration-700 group-hover:text-[#4A7C59]">
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
            </motion.div>

            {/* Interactive Mockup */}
            <motion.div
              className="lg:w-[45%] lg:absolute lg:right-0 lg:top-[20%] mt-12 lg:mt-0"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: easeOutQuart }}
            >
              <div
                className={`rounded-lg border border-vigil-borderSubtle bg-vigil-bgSec/50 backdrop-blur-md p-8 transition-all duration-500 overflow-hidden relative ${activeStep === 3 ? "border-[#4A7C59]/50 shadow-[0_0_30px_rgba(74,124,89,0.1)]" : ""}`}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <motion.div
                    animate={{
                      scale: activeStep === 3 ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full border border-vigil-statusWatch/30 bg-vigil-statusWatch/10 flex items-center justify-center mb-4 relative"
                  >
                    <Activity className="w-6 h-6 text-vigil-statusWatch" />
                    {activeStep === 3 && (
                      <motion.div
                        initial={{ opacity: 0.8, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border border-vigil-statusWatch"
                      />
                    )}
                  </motion.div>
                  <p className="text-[14px] font-medium text-vigil-statusWatch tracking-wide mb-1">
                    MONITORING ACTIVE
                  </p>
                  <p className="text-[12px] text-vigil-textSec">
                    Last check-in: 2 hours ago
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Callout */}
      <section className="w-full bg-vigil-bgSec border-y border-vigil-borderSubtle py-[120px] md:py-[180px]">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: easeOutQuart }}
            className="font-serif text-[48px] md:text-[72px] lg:text-[88px] font-light text-vigil-textPri leading-[1.05] tracking-tight"
          >
            Not a reminder.
            <br />
            Not a notification.
            <br />
            <span className="text-vigil-accentPri border-b border-vigil-accentPri/30 pb-2">
              An agent that acts.
            </span>
          </motion.h2>

          <div className="relative border-l border-vigil-borderSubtle pl-10 py-6 flex flex-col gap-12 lg:ml-12 overflow-hidden">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              whileInView={{ height: "100%", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "linear" }}
              className="absolute left-[-1px] top-0 w-[1px] bg-gradient-to-b from-vigil-statusWatch via-vigil-statusAlert to-vigil-statusDown"
            />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -left-[45px] top-1 w-2 h-2 rounded-full bg-vigil-statusWatch z-10 box-content border-4 border-vigil-bgSec transition-transform group-hover:scale-150"></div>
              <p className="text-[15px] text-vigil-textPri font-sans transition-colors group-hover:text-vigil-statusWatch">
                Day 0 — You check in
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative group"
            >
              <div className="absolute -left-[45px] top-1 w-2 h-2 rounded-full bg-vigil-statusAlert z-10 box-content border-4 border-vigil-bgSec animate-pulseAlert"></div>
              <p className="text-[15px] text-vigil-textPri font-sans transition-colors group-hover:text-vigil-statusAlert">
                Day 7 — Vigil sends a confirmation push
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1 }}
              className="relative group cursor-default"
            >
              <div className="absolute -left-[45px] top-1 w-2 h-2 rounded-full bg-vigil-statusDown z-10 box-content border-4 border-vigil-bgSec transition-transform group-hover:scale-150"></div>
              <p className="text-[15px] font-sans text-vigil-accentPri">
                Day 8 — If no response, instructions execute
              </p>

              <AnimatePresence>
                <div className="absolute top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-vigil-bgPri border border-vigil-borderActive/30 rounded p-4 shadow-xl z-20 w-[240px] pointer-events-none">
                  <p className="text-[12px] text-vigil-textSec leading-relaxed">
                    Once the deadline is breached, API calls are dispatched
                    globally. This action is irreversible.
                  </p>
                </div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security Callout */}
      <section className="py-[120px] px-6 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec mb-4">
            BUILT ON TRUST
          </h2>
          <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="font-serif text-[32px] font-light text-vigil-textPri mb-6">
              Your credentials never leave{" "}
              <span className="font-sans text-vigil-accentPri border-b border-vigil-accentPri/20 pb-1 cursor-default relative group inline-block">
                Auth0
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 w-max bg-vigil-bgPri text-vigil-textSec text-[11px] font-sans border border-vigil-borderSubtle px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Enterprise-grade identity provider
                </span>
              </span>
              .
            </h3>
            <p className="text-[15px] font-light text-vigil-textSec leading-relaxed">
              We designed Vigil so we don&apos;t hold the keys. Our architecture
              ensures that we only interact with your connected services at the
              exact moment of execution.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {[
              {
                title: "Zero token storage",
                desc: "Vigil fetches a short-lived token at execution time only.",
                icon: FileKey2,
              },
              {
                title: "Revocable instantly",
                desc: "Disconnect any service from your dashboard at any time.",
                icon: ShieldCheck,
              },
              {
                title: "Full audit trail",
                desc: "Every action Vigil takes is logged. Nothing happens silently.",
                icon: Activity,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.02, translateX: 5 }}
                className="cursor-default"
              >
                <Card
                  padding="md"
                  className="h-full flex items-start gap-4 hover:border-vigil-borderSubtle transition-colors group"
                >
                  <div className="mt-1 opacity-50 group-hover:opacity-100 group-hover:text-vigil-accentPri transition-all">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-vigil-textPri mb-2">
                      {item.title}
                    </h4>
                    <p className="text-[13px] text-vigil-textSec">
                      {item.desc}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-[120px] px-6 flex flex-col items-center text-center"
      >
        <h2 className="font-serif text-[40px] md:text-[56px] font-light text-vigil-textPri mb-10">
          Begin your vigil.
        </h2>
        <Link
          href={authenticated ? "/dashboard" : "/auth/login"}
          className="mb-6 inline-block"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="primary" className="flex items-center gap-2">
              Get started <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </Link>
        {!authenticated && (
          <p className="text-[12px] text-vigil-textTer font-sans">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="hover:text-vigil-textPri transition-colors underline underline-offset-4 decoration-vigil-borderSubtle"
            >
              Sign in.
            </Link>
          </p>
        )}
        <div className="mt-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.12em] text-vigil-textTer font-sans">
          <Link href="/privacy" className="hover:text-vigil-textPri transition-colors">
            Privacy
          </Link>
          <span className="text-vigil-borderSubtle">|</span>
          <Link href="/tos" className="hover:text-vigil-textPri transition-colors">
            Terms
          </Link>
        </div>
      </motion.section>
    </>
  );
}

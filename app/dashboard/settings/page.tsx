import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-vigil-bgPri p-6 md:p-12 text-vigil-textPri flex justify-center fade-up">
      <div className="w-full max-w-[800px] flex flex-col gap-[80px]">
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="text-[12px] text-vigil-textSec hover:text-vigil-textPri uppercase tracking-[0.1em] mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="font-serif text-[40px] font-light">Settings</h1>
        </div>

        {/* Triggers */}
        <section className="flex flex-col gap-6 fade-up delay-100">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec">
              TIMING & TRIGGERS
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex flex-col gap-2 flex-grow">
              <span className="text-[14px] text-vigil-textPri">
                Silence Threshold
              </span>
              <span className="text-[12px] text-vigil-textSec leading-relaxed">
                How long Vigil waits after your last check-in before sending the
                confirmation push.
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  defaultValue={7}
                  className="w-[80px] !text-[24px] font-light text-center px-0 bg-transparent border-t-0 border-x-0 border-b-vigil-borderActive focus:border-b-vigil-accentPri !h-auto pb-1 rounded-none !min-h-0"
                />
                <span className="text-[14px] text-vigil-textPri ml-2">
                  days
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 mt-4">
            <div className="flex flex-col gap-2 flex-grow">
              <span className="text-[14px] text-vigil-textPri">
                Grace Window
              </span>
              <span className="text-[12px] text-vigil-textSec leading-relaxed">
                How long you have to respond to the confirmation push before
                execution.
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  defaultValue={24}
                  className="w-[80px] !text-[24px] font-light text-center px-0 bg-transparent border-t-0 border-x-0 border-b-vigil-borderActive focus:border-b-vigil-accentPri !h-auto pb-1 rounded-none !min-h-0"
                />
                <span className="text-[14px] text-vigil-textPri ml-2">
                  hours
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button variant="primary" className="!px-8 !h-[44px]">
              Save Changes{" "}
            </Button>
          </div>
        </section>

        {/* Connected Services */}
        <section className="flex flex-col gap-6 fade-up delay-200">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textSec">
              CONNECTED ACCOUNTS
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-accentPri"></div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-vigil-bgSec border border-vigil-borderSubtle rounded-[4px] p-5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[14px] text-vigil-textPri font-medium">
                  Gmail
                </span>
                <span className="text-[12px] text-vigil-textTer">
                  gmail.send
                </span>
              </div>
              <Button variant="danger-ghost" className="!px-4">
                Disconnect
              </Button>
            </div>
            <div className="bg-vigil-bgSec border border-vigil-borderSubtle rounded-[4px] p-5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[14px] text-vigil-textPri font-medium">
                  GitHub
                </span>
                <span className="text-[12px] text-vigil-textTer">repo</span>
              </div>
              <Button variant="danger-ghost" className="!px-4">
                Disconnect
              </Button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="flex flex-col gap-6 mb-[120px] fade-up delay-300">
          <div className="flex flex-col gap-3">
            <h2 className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-statusDown">
              DANGER ZONE
            </h2>
            <div className="w-[40px] h-[1px] bg-vigil-statusDown"></div>
          </div>

          <div className="bg-vigil-statusDownBg border border-vigil-statusDownBorder rounded-[4px] p-6 lg:p-8 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex flex-col gap-2 max-w-[400px]">
                <span className="text-[14px] text-vigil-textPri font-medium">
                  Cancel all instructions
                </span>
                <span className="text-[12px] text-vigil-textSec leading-relaxed">
                  Vigil will stand down and delete your current instructions.
                  This cannot be undone.
                </span>
              </div>
              <Button
                variant="danger-ghost"
                className="shrink-0 whitespace-nowrap"
              >
                Step Down
              </Button>
            </div>

            <div className="w-full h-[1px] bg-vigil-statusDownBorder opacity-50"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex flex-col gap-2 max-w-[400px]">
                <span className="text-[14px] text-vigil-textPri font-medium">
                  Delete account
                </span>
                <span className="text-[12px] text-vigil-textSec leading-relaxed">
                  Remove your account, destroy all tokens, and erase all traces
                  securely.
                </span>
              </div>
              <Button
                variant="danger-ghost"
                className="shrink-0 whitespace-nowrap"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

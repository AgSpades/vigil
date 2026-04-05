import { Button } from "@/components/Button";
import Link from "next/link";
import { auth0 } from "@/lib/auth0";

export default async function ConnectPage() {
  const session = await auth0.getSession();

  return (
    <main className="min-h-[calc(100vh-72px)] bg-vigil-bgPri flex flex-col items-center justify-center p-6 text-vigil-textPri relative fade-up">
      <div className="absolute top-8 right-8 text-[11px] font-sans uppercase tracking-[0.16em] text-vigil-textSec">
        STEP 1 OF 2 — CONNECT
      </div>

      <div className="w-full max-w-[560px]">
        <h1 className="font-serif text-[40px] font-light mb-4">
          Connect your accounts.
        </h1>
        <p className="text-[15px] text-vigil-textSec font-light mb-12">
          Vigil needs access to carry out your instructions. Your credentials
          are held securely in the Auth0 Token Vault and are only used at
          execution time.
        </p>

        <div className="flex flex-col gap-3 mb-12">
          {/* Gmail Card */}
          <div className="bg-vigil-bgSec border border-vigil-borderSubtle rounded-[4px] px-6 py-5 flex items-center justify-between hover:border-vigil-borderActive transition-colors duration-200">
            <div className="flex items-center gap-6">
              <div className="w-6 h-6 text-vigil-textSec">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-medium text-vigil-textPri">
                  Gmail
                </span>
                <span className="text-[13px] text-vigil-textTer">
                  gmail.send — Send emails on your behalf
                </span>
              </div>
            </div>
            {/* Visual connected state for prototype */}
            <div className="text-[12px] text-vigil-statusWatch font-medium px-2">
              Connected ✓
            </div>
          </div>

          {/* Google Drive Card */}
          <div className="bg-vigil-bgSec border border-vigil-borderSubtle rounded-[4px] px-6 py-5 flex items-center justify-between hover:border-vigil-borderActive transition-colors duration-200">
            <div className="flex items-center gap-6">
              <div className="w-6 h-6 text-vigil-textSec">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-medium text-vigil-textPri">
                  Google Drive
                </span>
                <span className="text-[13px] text-vigil-textTer">
                  drive.file — Create and share archive folders
                </span>
              </div>
            </div>
            <Button variant="primary" className="!h-[36px] !px-4 text-[11px]">
              Connect{" "}
            </Button>
          </div>

          {/* GitHub Card */}
          <div className="bg-vigil-bgSec border border-vigil-borderSubtle rounded-[4px] px-6 py-5 flex items-center justify-between hover:border-vigil-borderActive transition-colors duration-200">
            <div className="flex items-center gap-6">
              <div className="w-6 h-6 text-vigil-textSec">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-medium text-vigil-textPri">
                  GitHub
                </span>
                <span className="text-[13px] text-vigil-textTer">
                  repo — Transfer repository ownership
                </span>
              </div>
            </div>
            <Button variant="primary" className="!h-[36px] !px-4 text-[11px]">
              Connect{" "}
            </Button>
          </div>
        </div>

        <Link href="/onboarding/setup" className="block text-center">
          <Button variant="primary" className="w-full">
            Continue to setup{" "}
          </Button>
        </Link>
        <p className="text-[12px] text-vigil-textTer mt-4 text-center">
          You can connect more services later.
        </p>
      </div>
    </main>
  );
}

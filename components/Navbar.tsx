import Link from "next/link";

export function Navbar({
  authenticated = false,
  email = "",
}: {
  authenticated?: boolean;
  email?: string;
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-[72px] bg-vigil-bgPri border-b border-vigil-borderSubtle flex items-center justify-between px-6 md:px-12 z-50">
      <Link
        href={authenticated ? "/dashboard" : "/"}
        className="font-serif text-[22px] font-light tracking-[0.2em] hover:text-white transition-colors duration-200"
      >
        VIGIL
      </Link>
      <div className="flex flex-row items-center gap-6">
        {authenticated ? (
          <>
            <span className="text-[12px] uppercase tracking-[0.12em] text-vigil-textSec hidden sm:inline-block">
              {email}
            </span>
            <Link
              href="/auth/logout"
              className="text-[12px] uppercase tracking-[0.12em] text-vigil-textSec hover:text-white transition-colors duration-200"
            >
              Sign out
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-[12px] uppercase tracking-[0.12em] text-vigil-textSec hover:text-white transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link
              href="/auth/login"
              className="h-[52px] px-6 sm:px-8 bg-vigil-accentPri text-vigil-textPri text-[13px] font-medium uppercase tracking-[0.12em] rounded-sm flex items-center hover:bg-vigil-accentSec transition-colors duration-200"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

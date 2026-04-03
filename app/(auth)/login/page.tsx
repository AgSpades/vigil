export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">
            Vigil
          </h1>
          <p className="mt-3 text-zinc-400 text-lg">
            It acts when you stop checking in.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-zinc-500 leading-relaxed">
            Vigil watches for your regular check-ins. If you go silent, it
            carries out your pre-configured wishes — emails, file archives,
            repo transfers — on your behalf.
          </p>
        </div>

        <a
          href="/auth/login"
          className="
            inline-block w-full py-4 px-8 rounded-2xl text-base font-semibold
            bg-zinc-100 hover:bg-white text-zinc-900
            transition-colors duration-150
          "
        >
          Sign in to get started
        </a>

        <p className="text-xs text-zinc-600">
          Your credentials are never stored by Vigil.
          <br />
          Auth0 Token Vault holds them securely.
        </p>
      </div>
    </div>
  );
}

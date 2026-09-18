import { API_BASE_URL } from "@/lib/apiBase";

type GoogleAuthButtonProps = {
  redirect?: string | null;
  className?: string;
};

export default function GoogleAuthButton({ redirect, className = "" }: GoogleAuthButtonProps) {
  const startGoogleAuth = () => {
    const params = new URLSearchParams();
    if (redirect?.startsWith("/") && !redirect.startsWith("//")) params.set("redirect", redirect);
    const query = params.toString();
    window.location.assign(`${API_BASE_URL}/auth/google/redirect${query ? `?${query}` : ""}`);
  };

  return (
    <button
      type="button"
      onClick={startGoogleAuth}
      className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
        <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
        <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9.1L6.4 14Z" />
        <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 6 12 6Z" />
      </svg>
      Lanjutkan dengan Google (Murid)
    </button>
  );
}

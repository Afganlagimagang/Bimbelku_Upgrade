import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiBase";
import { storeBrowserSession } from "@/lib/session";

type GoogleExchangeResponse = {
  access_token: string;
  user: { role?: string } & Record<string, unknown>;
  requires_profile_completion?: boolean;
  redirect?: string | null;
};

const exchangeRequests = new Map<string, Promise<GoogleExchangeResponse>>();

const exchangeGoogleCode = async (code: string): Promise<GoogleExchangeResponse> => {
  const existing = exchangeRequests.get(code);
  if (existing) return existing;

  const request = import("axios")
    .then(({ default: axios }) =>
      axios.post<GoogleExchangeResponse>(`${API_BASE_URL}/auth/google/exchange`, { code }, { withCredentials: true }),
    )
    .then((response) => response.data);

  exchangeRequests.set(code, request);
  return request;
};

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = params.get("code");
    if (!code) {
      setError("Kode login Google tidak ditemukan.");
      return;
    }

    const codeMarker = code.slice(-16);
    const consumedMarker = sessionStorage.getItem("google_auth_consumed_marker");
    if (consumedMarker === codeMarker && localStorage.getItem("token")) {
      try {
        const storedRole = JSON.parse(localStorage.getItem("user") || "null")?.role;
        navigate(storedRole === "teacher" ? "/guru" : "/student/dashboard", { replace: true });
      } catch {
        navigate("/student/dashboard", { replace: true });
      }
      return;
    }

    void exchangeGoogleCode(code)
      .then(async ({ access_token, user, requires_profile_completion, redirect }) => {
        storeBrowserSession(user);
        sessionStorage.setItem("google_auth_consumed_marker", codeMarker);

        if (requires_profile_completion) {
          const suffix = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
          navigate(`/complete-profile${suffix}`, { replace: true });
          return;
        }

        if (redirect) {
          navigate(redirect, { replace: true });
          return;
        }

        if (user.role === "teacher") {
          navigate("/guru", { replace: true });
          return;
        }

        const { default: axios } = await import("axios");
        void axios
          .get(`${API_BASE_URL}/student/guest-packages/pending`, {
            headers: { Authorization: `Bearer ${access_token}` },
            withCredentials: true,
          })
          .then((pending) => {
            const guestCode = pending.data?.data?.[0]?.code;
            navigate(
              guestCode ? `/pesanan/${encodeURIComponent(guestCode)}` : "/student/dashboard",
              { replace: true },
            );
          })
          .catch(() => navigate("/student/dashboard", { replace: true }));
      })
      .catch((reason) => {
        // A successful first exchange can be followed by a duplicate callback
        // after a browser reload/remount. Never show a false failure when the
        // authenticated token from that successful exchange is already stored.
        if (localStorage.getItem("token")) {
          navigate("/student/dashboard", { replace: true });
          return;
        }

        setError(reason?.response?.data?.message || "Login Google gagal diproses.");
      });
  }, [navigate, params]);

  return (
    <main className="grid min-h-screen place-items-center bg-orange-50 px-4">
      <section className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-xl shadow-orange-100/60">
        {error ? (
          <>
            <h1 className="text-2xl font-black text-slate-900">Login Google gagal</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
            <Link to="/login" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white">Kembali ke login</Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600 motion-reduce:animate-none" />
            <h1 className="mt-5 text-xl font-black text-slate-900">Menyiapkan akun BimbelKu...</h1>
            <p className="mt-2 text-sm text-slate-500">Tunggu sebentar, Anda akan diarahkan otomatis.</p>
          </>
        )}
      </section>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiBase";

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

    void import("axios").then(({ default: axios }) => axios.post(`${API_BASE_URL}/auth/google/exchange`, { code }))
      .then((response) => {
        const { access_token, user, requires_profile_completion, redirect } = response.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(user));
        if (requires_profile_completion) {
          const suffix = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
          navigate(`/complete-profile${suffix}`, { replace: true });
        } else {
          navigate(redirect || "/student/dashboard", { replace: true });
        }
      })
      .catch((reason) => setError(reason?.response?.data?.message || "Login Google gagal diproses."));
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
          <><Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600 motion-reduce:animate-none" /><h1 className="mt-5 text-xl font-black text-slate-900">Menyiapkan akun murid...</h1><p className="mt-2 text-sm text-slate-500">Tunggu sebentar, Anda akan diarahkan otomatis.</p></>
        )}
      </section>
    </main>
  );
}

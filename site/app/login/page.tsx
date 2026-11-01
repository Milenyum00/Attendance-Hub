"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Kullanıcı bilgisi alınamadı.");
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        await supabase.auth.signOut();
        throw new Error("Bu hesabın yönetici yetkisi bulunmuyor.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Giriş sırasında bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            ATTENDANCE HUB
          </h1>
          <p className="mt-3 text-slate-500">
            Yönetici Girişi
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Devam etmek için hesabınızla giriş yapın.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="E-posta adresiniz"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Şifreniz"
            />
          </div>

          {message && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </main>
  );
}
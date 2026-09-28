import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · Central de Planejamento Tributário" },
      { name: "description", content: "Acesse a Central de Planejamento Tributário." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);
    if (signInError) {
      console.error("Supabase sign-in failed", {
        code: signInError.code,
        status: signInError.status,
        message: signInError.message,
      });
      setError("E-mail ou senha inválidos. Confira seus dados e tente novamente.");
      return;
    }

    await navigate({ to: "/", replace: true });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07111F] px-4 py-10 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(255,255,255,0.3), transparent 68%), radial-gradient(ellipse at bottom right, rgba(255,255,255,0.14), transparent 52%)",
        }}
      />
      <section className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/center.png"
            alt="Logo da Central de Planejamento Tributário"
            className="mb-0 size-[16.9rem] object-contain"
          />
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Central de Planejamento Tributário
          </h1>
          <p className="mt-2 text-sm text-slate-500">Entre com sua conta para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@empresa.com.br"
              className="h-11 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                className="h-11 border-slate-300 bg-white pr-11 text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition-colors hover:text-slate-900"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
          >
            {busy ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <LockKeyhole className="mr-2 size-4" />}
            Entrar
          </Button>
        </form>
      </section>
    </main>
  );
}

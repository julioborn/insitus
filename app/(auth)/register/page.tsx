"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parseInt(age) < 18) { setError("Debés tener al menos 18 años."); return; }
    setLoading(true);
    setError("");
    const { error: signUpError } = await supabaseClient.auth.signUp({
      email, password,
      options: { data: { name, age: parseInt(age) } },
    });
    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
    router.push("/login?registered=1");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <Image src="/iconincontro.png" alt="Incontro" width={56} height={56} className="rounded-xl mb-4" />
          <h1 className="text-2xl font-bold tracking-[0.15em] text-white">INCONTRO</h1>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Creá tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Nombre", type: "text", value: name, set: setName, placeholder: "Tu nombre", auto: "given-name" },
            { label: "Email", type: "email", value: email, set: setEmail, placeholder: "tu@email.com", auto: "email" },
            { label: "Contraseña", type: "password", value: password, set: setPassword, placeholder: "Mínimo 8 caracteres", auto: "new-password" },
            { label: "Edad", type: "number", value: age, set: setAge, placeholder: "18+", auto: "off" },
          ].map(({ label, type, value, set, placeholder, auto }) => (
            <div key={label}>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</label>
              <input
                type={type} value={value} onChange={e => set(e.target.value)}
                required autoComplete={auto} placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
          ))}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.30)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-[#8296E3] hover:underline">Iniciá sesión</Link>
        </p>
      </div>
    </main>
  );
}

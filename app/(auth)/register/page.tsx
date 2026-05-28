"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (parseInt(age) < 18) { setError("Debés tener al menos 18 años."); return; }

    setLoading(true);
    setError("");

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const { error: signUpError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { name: fullName, age: parseInt(age) } },
    });

    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
    router.push("/login?registered=1");
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const labelStyle = { color: "rgba(255,255,255,0.45)" };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <Image src="/iconincontro.png" alt="Incontro" width={56} height={56} className="rounded-xl mb-4" />
          <h1 className="text-2xl font-bold tracking-[0.15em] text-white">INCONTRO</h1>
          <p className="mt-1 text-xs" style={labelStyle}>Creá tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nombre y Apellido en una fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Nombre</label>
              <input
                type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                required autoComplete="given-name" placeholder="Juan"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Apellido</label>
              <input
                type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                required autoComplete="family-name" placeholder="Pérez"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Edad</label>
            <input
              type="number" value={age} onChange={e => setAge(e.target.value)}
              required autoComplete="off" placeholder="18+"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email" placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="new-password" placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Repetir contraseña</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              required autoComplete="new-password" placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={inputStyle}
            />
          </div>

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

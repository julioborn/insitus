"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { BottomNav } from "@/components/ui/BottomNav";
import { signOut } from "@/lib/auth.client";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import Image from "next/image";

interface Photo { id: string; url: string; position: number }

interface Props { profileId: string; currentUserId: string }

const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const t = new Date();
  return t.getFullYear() - b.getFullYear() -
    (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
}

export function ProfileClient({ profileId, currentUserId }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [togglingGhost, setTogglingGhost] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", instagram_handle: "" });
  const [blocked, setBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  const { permission: notifPermission, loading: notifLoading, enable: enableNotif } = useNotificationPermission();
  const isOwn = profileId === "me" || profileId === currentUserId;
  const resolvedId = profileId === "me" ? currentUserId : profileId;

  useEffect(() => {
    supabaseClient.from("profiles").select("*").eq("id", resolvedId).single()
      .then(({ data }) => {
        setProfile(data);
        if (data) {
          setForm({ name: data.name ?? "", bio: data.bio ?? "", instagram_handle: data.instagram_handle ?? "" });
          setGhostMode(!!data.ghost_mode);
        }
        setLoading(false);
      });
    if (isOwn) {
      fetch("/api/profile/photos").then(r => r.json()).then(d => setPhotos(Array.isArray(d) ? d : []));
    }
    if (!isOwn) {
      supabaseClient.from("blocked_users")
        .select("id").eq("blocker_id", currentUserId).eq("blocked_id", resolvedId).maybeSingle()
        .then(({ data }) => setBlocked(!!data));
    }
  }, [resolvedId]);

  async function handleBlock() {
    setBlocking(true);
    await fetch("/api/users/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blocked_id: resolvedId }) });
    setBlocked(true);
    setBlocking(false);
    setConfirmBlock(false);
    router.back();
  }

  async function toggleGhostMode() {
    setTogglingGhost(true);
    const val = !ghostMode;
    await supabaseClient.from("profiles").update({ ghost_mode: val }).eq("id", currentUserId);
    setGhostMode(val);
    setTogglingGhost(false);
  }

  async function handleSave() {
    setSaving(true);
    const { data } = await supabaseClient
      .from("profiles")
      .update({ name: form.name, bio: form.bio, instagram_handle: form.instagram_handle })
      .eq("id", currentUserId).select().single();
    if (data) setProfile(data);
    setSaving(false);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
      </div>
    );
  }

  const displayName = profile?.name ?? profile?.first_name ?? "Sin nombre";
  const initial = displayName[0]?.toUpperCase() ?? "?";
  const age = calcAge(profile?.birth_date ?? null);

  return (
    <div className="flex flex-col min-h-screen bg-black pb-24">

      {/* Hero — fondo borroso + avatar nítido centrado (técnica Spotify/Instagram) */}
      {!editing && (
        <div className="relative w-full overflow-hidden" style={{ height: 280 }}>
          {/* Fondo borroso */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "blur(28px)", transform: "scale(1.15)", opacity: 0.55 }}
            />
          ) : (
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)", opacity: 0.6 }} />
          )}

          {/* Oscurecer */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #000 0%, transparent 60%)" }} />

          {/* Avatar nítido centrado */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-8">
            <div className="relative w-28 h-28 rounded-full overflow-hidden mb-3"
              style={{ border: "3px solid rgba(255,255,255,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={displayName} fill sizes="112px" className="object-cover" unoptimized priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                  {initial}
                </div>
              )}
            </div>
          </div>

          {/* Nombre en la parte inferior */}
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-white font-bold text-2xl leading-tight drop-shadow">
                  {displayName}{age !== null ? `, ${age}` : ""}
                </h1>
                {profile?.username && (
                  <p className="text-sm mt-0.5 drop-shadow" style={{ color: "rgba(200,210,255,0.8)" }}>@{profile.username}</p>
                )}
              </div>
              {ghostMode && (
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  👻 Fantasma
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero modo edición — avatar pequeño */}
      {editing && (
        <div className="relative flex flex-col items-center px-5 pt-14 pb-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3"
            style={{ border: "2px solid rgba(130,150,227,0.5)" }}>
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={displayName} fill sizes="80px" className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                {initial}
              </div>
            )}
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest">Editando perfil</p>
        </div>
      )}

      <div className="flex-1 px-4">

        {/* ── MODO EDICIÓN ── */}
        {editing && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-1">Editando perfil</p>
            {[
              { label: "Nombre completo", key: "name", placeholder: "Tu nombre completo" },
              { label: "Bio", key: "bio", placeholder: "Contá algo sobre vos..." },
              { label: "Instagram", key: "instagram_handle", placeholder: "usuario (sin @)" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-[11px] mb-1.5 uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.35)" }}>{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none transition-colors"
                  style={inp}
                />
              </div>
            ))}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-medium"
                style={{ ...inp, color: "rgba(255,255,255,0.5)" }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {/* ── VISTA NORMAL ── */}
        {!editing && (
          <div className="flex flex-col gap-3 animate-fade-in">

            {/* Fotos adicionales */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => (
                  <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <div className="rounded-2xl px-4 py-3.5" style={inp}>
                <p className="text-[10px] uppercase tracking-widest mb-1.5"
                  style={{ color: "rgba(255,255,255,0.3)" }}>Bio</p>
                <p className="text-white/80 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Info chips */}
            {(profile?.city || profile?.gender) && (
              <div className="flex flex-wrap gap-2">
                {profile.city && (
                  <span className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    style={inp}>
                    <span>📍</span><span className="text-white/70">{profile.city}</span>
                  </span>
                )}
                {profile.gender && (
                  <span className="text-xs px-3 py-1.5 rounded-full"
                    style={inp}>
                    <span className="text-white/70 capitalize">{profile.gender}</span>
                  </span>
                )}
              </div>
            )}

            {/* Qué buscás */}
            {profile?.looking_for && profile.looking_for.length > 0 && (
              <div className="rounded-2xl px-4 py-3.5" style={inp}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Buscando</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.looking_for.map(v => (
                    <span key={v} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(130,150,227,0.15)", color: "#8296E3", border: "1px solid rgba(130,150,227,0.25)" }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Gustos musicales */}
            {profile?.music_genres && profile.music_genres.length > 0 && (
              <div className="rounded-2xl px-4 py-3.5" style={inp}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Música</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.music_genres.map(g => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Redes sociales */}
            {(profile?.instagram_handle || profile?.snapchat_handle || profile?.whatsapp) && (
              <div className="rounded-2xl px-4 py-3.5 flex flex-col gap-3" style={inp}>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Redes</p>
                {profile.instagram_handle && (
                  <div className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#8296E3" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="#8296E3" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="#8296E3"/></svg>
                    <p className="text-sm" style={{ color: "#8296E3" }}>@{profile.instagram_handle}</p>
                  </div>
                )}
                {profile.snapchat_handle && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">👻</span>
                    <p className="text-sm text-white/70">@{profile.snapchat_handle}</p>
                  </div>
                )}
                {profile.whatsapp && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">💬</span>
                    <p className="text-sm text-white/70">{profile.whatsapp}</p>
                  </div>
                )}
              </div>
            )}

            {!isOwn && (
              <div className="mt-2">
                {!confirmBlock ? (
                  <button onClick={() => setConfirmBlock(true)}
                    className="w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
                    style={{ background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.15)", color: "rgba(255,80,80,0.6)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                    {blocked ? "Usuario bloqueado" : "Bloquear usuario"}
                  </button>
                ) : (
                  <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)" }}>
                    <p className="text-sm text-white/70 text-center">¿Bloqueás a este usuario? Ya no se verán entre sí.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setConfirmBlock(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                        Cancelar
                      </button>
                      <button onClick={handleBlock} disabled={blocking}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "rgba(255,60,60,0.25)", color: "rgba(255,100,100,0.9)" }}>
                        {blocking ? "Bloqueando..." : "Sí, bloquear"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isOwn && (
              <>
                {/* Notificaciones */}
                {notifPermission !== "unsupported" && (
                  <div className="rounded-2xl px-4 py-3.5 flex items-center justify-between" style={inp}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: notifPermission === "granted" ? "rgba(130,150,227,0.15)" : "rgba(255,255,255,0.07)" }}>
                        {notifPermission === "granted" ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#8296E3"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                        ) : notifPermission === "denied" ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)"><path d="M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.2 2.2C6.08 7.49 6 8 6 8.5V15l-2 2v1h13.73l2 2L21 18.69zM12 22c1.11 0 2-.89 2-2h-4c0 1.11.89 2 2 2zm6-7.32V8.5c0-3.07-1.63-5.64-4.5-6.32V1.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.24.06-.47.15-.69.23L18 8.69z"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Notificaciones</p>
                        <p className="text-[11px] mt-0.5" style={{
                          color: notifPermission === "granted"
                            ? "rgba(130,150,227,0.8)"
                            : notifPermission === "denied"
                            ? "rgba(255,80,80,0.6)"
                            : "rgba(255,255,255,0.3)"
                        }}>
                          {notifPermission === "granted" && "Activadas"}
                          {notifPermission === "denied" && "Bloqueadas en el sistema"}
                          {notifPermission === "default" && "Tocá para activar"}
                        </p>
                      </div>
                    </div>
                    {notifPermission === "granted" ? (
                      <div className="w-11 h-6 rounded-full flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                        <span className="block w-5 h-5 rounded-full bg-white shadow mt-0.5 ml-auto mr-0.5" />
                      </div>
                    ) : notifPermission === "default" ? (
                      <button onClick={enableNotif} disabled={notifLoading}
                        className="w-11 h-6 rounded-full flex-shrink-0 disabled:opacity-40"
                        style={{ background: "rgba(255,255,255,0.12)" }}>
                        <span className="block w-5 h-5 rounded-full bg-white shadow mt-0.5 ml-0.5"
                          style={{ opacity: notifLoading ? 0.5 : 1 }} />
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: "rgba(255,80,80,0.1)", color: "rgba(255,80,80,0.6)", border: "1px solid rgba(255,80,80,0.15)" }}>
                        Bloqueadas
                      </span>
                    )}
                  </div>
                )}

                {/* Modo fantasma */}
                <div className="rounded-2xl px-4 py-3.5 flex items-center justify-between" style={inp}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: "rgba(255,255,255,0.07)" }}>
                      👻
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Modo fantasma</p>
                      <p className="text-[11px] mt-0.5"
                        style={{ color: ghostMode ? "rgba(130,150,227,0.8)" : "rgba(255,255,255,0.3)" }}>
                        {ghostMode ? "Invisible para los demás" : "Sos visible para todos"}
                      </p>
                    </div>
                  </div>
                  <button onClick={toggleGhostMode} disabled={togglingGhost}
                    className="relative w-11 h-6 rounded-full transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: ghostMode ? "linear-gradient(135deg, #8296E3, #4762C7)" : "rgba(255,255,255,0.12)" }}>
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: ghostMode ? "calc(100% - 22px)" : "2px" }} />
                  </button>
                </div>

                {/* Separador */}
                <div className="my-1" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

                {/* Editar */}
                <button onClick={() => router.push("/settings")}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar perfil
                </button>

                {/* Admin */}
                {profile?.role === "superadmin" && (
                  <a href="/admin"
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center flex items-center justify-center gap-2"
                    style={{ background: "rgba(130,150,227,0.1)", border: "1px solid rgba(130,150,227,0.25)", color: "#8296E3" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                    Panel de administración
                  </a>
                )}

                {/* Cerrar sesión */}
                <button onClick={signOut}
                  className="w-full py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
                  style={{ ...inp, color: "rgba(255,80,80,0.7)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export const metadata = {
  title: "Eliminar cuenta – Insitus",
};

export default function EliminarCuentaPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", fontFamily: "sans-serif", color: "#111", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Eliminación de cuenta y datos</h1>
      <p style={{ color: "#555", marginBottom: 32 }}>Insitus – insitus.com.ar</p>

      <p>Si deseas eliminar tu cuenta de Insitus y todos los datos asociados, podés hacerlo directamente desde la app o solicitarlo por email.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Opción 1: Desde la app</h2>
      <ol>
        <li>Iniciá sesión en Insitus</li>
        <li>Andá a tu <strong>Perfil</strong></li>
        <li>Tocá <strong>Configuración</strong></li>
        <li>Seleccioná <strong>Eliminar cuenta</strong></li>
        <li>Confirmá la eliminación</li>
      </ol>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Opción 2: Por email</h2>
      <p>Enviá un correo a <a href="mailto:contacto@insitus.com.ar" style={{ color: "#6366f1" }}>contacto@insitus.com.ar</a> con el asunto <strong>"Eliminar mi cuenta"</strong> desde el email asociado a tu cuenta. Procesaremos tu solicitud en un plazo máximo de 7 días hábiles.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>¿Qué datos se eliminan?</h2>
      <ul>
        <li>Tu perfil completo (nombre, foto, descripción, edad, género)</li>
        <li>Tu historial de matches y likes</li>
        <li>Tu token de notificaciones push</li>
        <li>Tu cuenta de autenticación</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>¿Qué datos se conservan?</h2>
      <p>Los mensajes ya fueron eliminados automáticamente al ser leídos (funcionamiento Snapchat). No conservamos mensajes una vez eliminada la cuenta.</p>

      <p style={{ marginTop: 32, color: "#555" }}>Para más información consultá nuestra <a href="/privacidad" style={{ color: "#6366f1" }}>Política de Privacidad</a>.</p>
    </main>
  );
}

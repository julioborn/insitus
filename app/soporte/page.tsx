export const metadata = {
  title: "Soporte – Insitus",
};

export default function SoportePage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", fontFamily: "sans-serif", color: "#f1f1f1", lineHeight: 1.7, backgroundColor: "#000", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Soporte</h1>
      <p style={{ color: "#aaa", marginBottom: 32 }}>¿Necesitás ayuda con Insitus? Estamos para asistirte.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Contacto</h2>
      <p>Para consultas, problemas técnicos o cualquier duda, escribinos a:<br />
        <a href="mailto:contacto@insitus.com.ar" style={{ color: "#6366f1" }}>contacto@insitus.com.ar</a>
      </p>
      <p>Respondemos dentro de las 48 horas hábiles.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Preguntas frecuentes</h2>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24 }}>¿Cómo funciona Insitus?</h3>
      <p>Insitus te conecta con personas que están en el mismo lugar que vos en este momento. Elegís el lugar donde estás, ves los perfiles de otros usuarios presentes y, si hay match mutuo, pueden chatear.</p>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24 }}>¿Qué pasa con mis mensajes?</h3>
      <p>Los mensajes se eliminan automáticamente una vez leídos. No guardamos tu historial de conversaciones.</p>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24 }}>¿Cómo elimino mi cuenta?</h3>
      <p>Podés eliminar tu cuenta desde la configuración de la app. Al hacerlo, todos tus datos personales son eliminados permanentemente de nuestros servidores.</p>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24 }}>¿Por qué la app necesita mi ubicación?</h3>
      <p>Insitus usa tu ubicación para mostrarte los establecimientos cercanos donde podés conectarte con otras personas. No almacenamos tu ubicación exacta.</p>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24 }}>¿Cómo reporto un usuario?</h3>
      <p>Si encontrás un comportamiento inapropiado, escribinos a <a href="mailto:contacto@insitus.com.ar" style={{ color: "#6366f1" }}>contacto@insitus.com.ar</a> con el detalle del caso y lo revisamos a la brevedad.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>Política de Privacidad</h2>
      <p>
        Podés consultar nuestra política de privacidad en:{" "}
        <a href="/privacidad" style={{ color: "#6366f1" }}>insitus.com.ar/privacidad</a>
      </p>
    </main>
  );
}

export const metadata = {
  title: "Política de Privacidad – Insitus",
};

export default function PrivacidadPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", fontFamily: "sans-serif", color: "#f1f1f1", lineHeight: 1.7, backgroundColor: "#000", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Política de Privacidad</h1>
      <p style={{ color: "#aaa", marginBottom: 32 }}>Última actualización: junio de 2026</p>

      <p>Insitus ("nosotros", "nuestro") opera la aplicación móvil y sitio web Insitus (el "Servicio"). Esta página te informa sobre nuestra política respecto a la recopilación, uso y divulgación de datos personales cuando usás el Servicio.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>1. Información que recopilamos</h2>
      <ul>
        <li><strong>Información de cuenta:</strong> nombre, dirección de correo electrónico y foto de perfil al registrarte con Google o email.</li>
        <li><strong>Datos de perfil:</strong> edad, género, descripción y fotos que cargás voluntariamente.</li>
        <li><strong>Ubicación:</strong> el local o venue que seleccionás para conectarte con otras personas en el mismo lugar.</li>
        <li><strong>Mensajes:</strong> los mensajes entre usuarios se eliminan automáticamente una vez leídos y no se almacenan de forma permanente.</li>
        <li><strong>Token de notificaciones:</strong> un identificador de dispositivo para enviarte notificaciones push si das tu consentimiento.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>2. Cómo usamos tu información</h2>
      <ul>
        <li>Permitirte crear un perfil y conectarte con otros usuarios en el mismo lugar.</li>
        <li>Enviar notificaciones push de matches y mensajes (solo si otorgás permiso).</li>
        <li>Mejorar y mantener el funcionamiento del Servicio.</li>
        <li>Garantizar la seguridad y prevenir usos fraudulentos.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>3. Compartir datos con terceros</h2>
      <p>No vendemos ni compartimos tus datos personales con terceros con fines comerciales. Utilizamos los siguientes servicios de infraestructura:</p>
      <ul>
        <li><strong>Supabase</strong> – base de datos y autenticación.</li>
        <li><strong>Firebase (Google)</strong> – notificaciones push.</li>
        <li><strong>Vercel</strong> – alojamiento del servidor.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>4. Retención de datos</h2>
      <p>Podés eliminar tu cuenta en cualquier momento desde la configuración de la app. Al hacerlo, todos tus datos personales son eliminados permanentemente de nuestros servidores.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>5. Seguridad</h2>
      <p>Implementamos medidas de seguridad estándar de la industria para proteger tu información. Sin embargo, ningún método de transmisión por Internet es 100% seguro.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>6. Privacidad de menores</h2>
      <p>El Servicio no está dirigido a personas menores de 18 años. No recopilamos intencionalmente datos de menores.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>7. Cambios a esta política</h2>
      <p>Podemos actualizar esta política ocasionalmente. Te notificaremos publicando la nueva versión en esta página.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>8. Contacto</h2>
      <p>Si tenés preguntas sobre esta política, escribinos a: <a href="mailto:julio@estudioborn.com.ar" style={{ color: "#6366f1" }}>julio@estudioborn.com.ar</a></p>
    </main>
  );
}

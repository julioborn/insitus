export const metadata = {
  title: "Estándares de Seguridad Infantil – Insitus",
};

export default function SeguridadMenoresPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", fontFamily: "sans-serif", color: "#f1f1f1", lineHeight: 1.7, background: "#000", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Estándares de Seguridad Infantil</h1>
      <p style={{ color: "#999", marginBottom: 32 }}>Insitus – insitus.com.ar · Última actualización: junio de 2026</p>

      <p>Insitus es una aplicación para mayores de 18 años. Nos comprometemos firmemente con la protección de los menores y con la prevención de cualquier forma de explotación o abuso sexual infantil (CSAE) en nuestra plataforma.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>1. Público objetivo</h2>
      <p>Insitus está dirigida exclusivamente a personas mayores de 18 años. No permitimos el registro ni el uso de la aplicación por parte de menores de edad. Al registrarse, los usuarios declaran tener al menos 18 años.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>2. Prohibiciones absolutas</h2>
      <p>Está estrictamente prohibido en Insitus:</p>
      <ul>
        <li>Compartir, solicitar o distribuir material de abuso sexual infantil (CSAM) en cualquier forma.</li>
        <li>Contactar, acosar o explotar a menores de edad.</li>
        <li>Utilizar la plataforma para facilitar encuentros con menores con fines sexuales o de explotación.</li>
        <li>Hacerse pasar por un menor o por un adulto ante un menor.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>3. Mecanismos de prevención</h2>
      <ul>
        <li><strong>Verificación de edad:</strong> se requiere fecha de nacimiento al momento del registro y se bloquea el acceso a usuarios menores de 18 años.</li>
        <li><strong>Moderación de contenido:</strong> revisamos reportes de usuarios sobre contenido inapropiado o conductas abusivas.</li>
        <li><strong>Sistema de denuncias:</strong> cualquier usuario puede reportar perfiles o comportamientos sospechosos directamente desde la aplicación.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>4. Reporte a autoridades</h2>
      <p>Si detectamos o recibimos reportes creíbles de material de abuso sexual infantil (CSAM) o de explotación de menores, tomamos las siguientes acciones de inmediato:</p>
      <ul>
        <li>Suspensión permanente de la cuenta involucrada.</li>
        <li>Conservación de evidencia relevante.</li>
        <li>Denuncia ante las autoridades competentes de la República Argentina (Ministerio Público Fiscal, División Delitos Tecnológicos de la Policía Federal) y ante el <strong>National Center for Missing &amp; Exploited Children (NCMEC)</strong> a través de su CyberTipline, conforme a la legislación aplicable.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>5. Contacto de seguridad</h2>
      <p>Para reportar problemas de seguridad relacionados con menores, o para consultas sobre el cumplimiento de estos estándares, contactanos en:</p>
      <p><a href="mailto:juliobornes10@gmail.com" style={{ color: "#818cf8" }}>juliobornes10@gmail.com</a></p>
      <p>Respondemos a todos los reportes de seguridad infantil en un plazo máximo de 24 horas hábiles.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>6. Cumplimiento legal</h2>
      <p>Insitus cumple con todas las leyes de protección infantil aplicables en la República Argentina y colabora plenamente con las autoridades judiciales y de seguridad ante cualquier investigación relacionada con la seguridad de los niños.</p>

      <p style={{ marginTop: 32, color: "#999" }}>Para más información consultá nuestra <a href="/privacidad" style={{ color: "#818cf8" }}>Política de Privacidad</a>.</p>
    </main>
  );
}

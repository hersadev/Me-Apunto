// servicio de email - gestiona todos los correos de la aplicacion
// usa Resend en lugar de Nodemailer porque Railway bloquea los puertos SMTP
// Resend es un servicio de correo disenado para aplicaciones en la nube

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// correo que se envia a la empresa cuando alguien se inscribe a su evento
const enviarCorreoInscripcion = async ({
  correoEmpresa,
  nombreEmpresa,
  nombreEvento,
  nombreUsuario,
  correoUsuario,
  ciudad,
  numPersonas,
  importeTotal,
  comisionMeApunto,
  importeEmpresa,
}) => {

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Nueva inscripción recibida</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333;">Hola <strong>${nombreEmpresa}</strong>,</p>
        <p style="font-size: 16px; color: #333;">Tienes una nueva inscripción en tu evento <strong>"${nombreEvento}"</strong>.</p>
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #91703d; margin: 0 0 16px 0;">Datos del usuario</h3>
          <p style="margin: 8px 0; color: #333;"><strong>Nombre:</strong> ${nombreUsuario}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Correo:</strong> ${correoUsuario}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Ciudad:</strong> ${ciudad}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Número de personas:</strong> ${numPersonas}</p>
        </div>
        ${importeTotal > 0 ? `
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #91703d; margin: 0 0 16px 0;">Desglose del pago</h3>
          <p style="margin: 8px 0; color: #333;"><strong>Importe total:</strong> ${importeTotal.toFixed(2)}€</p>
          <p style="margin: 8px 0; color: #818181; font-size: 14px;">Comisión Me Apunto (5%): ${comisionMeApunto.toFixed(2)}€</p>
          <p style="margin: 8px 0; color: #2e7d32; font-size: 16px;"><strong>Importe para tu empresa: ${importeEmpresa.toFixed(2)}€</strong></p>
        </div>
        ` : `
        <div style="background-color: #e8f5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32; font-weight: bold;">✓ Evento gratuito</p>
        </div>
        `}
        <p style="font-size: 14px; color: #818181; margin-top: 24px;">Este correo ha sido enviado automáticamente por Me Apunto.</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: correoEmpresa,
    subject: `Nueva inscripción en "${nombreEvento}"`,
    html,
  });

  console.log(`Correo de inscripcion enviado a ${correoEmpresa}`);
};

// correo que se envia cuando falta una semana para la renovacion del patrocinio
const enviarCorreoAvisoRenovacion = async ({
  correoEmpresa,
  nombreEmpresa,
  nombreEvento,
  fechaRenovacion,
}) => {

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Aviso de renovación de patrocinio</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333;">Hola <strong>${nombreEmpresa}</strong>,</p>
        <p style="font-size: 16px; color: #333;">Tu patrocinio de <strong>"${nombreEvento}"</strong> se renovará el <strong>${fechaRenovacion}</strong> por <strong>10€</strong>.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL}/panel" style="background-color: #91703d; color: white; padding: 12px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ir a mi panel
          </a>
        </div>
        <p style="font-size: 14px; color: #818181; margin-top: 24px;">Este correo ha sido enviado automáticamente por Me Apunto.</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: correoEmpresa,
    subject: `Tu patrocinio de "${nombreEvento}" se renueva en 7 días`,
    html,
  });

  console.log(`Correo de aviso de renovacion enviado a ${correoEmpresa}`);
};

// correo de bienvenida que se envia a la empresa cuando se registra
const enviarCorreoBienvenida = async ({ correoEmpresa, nombreEmpresa }) => {

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">¡Bienvenida a la plataforma!</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333;">Hola <strong>${nombreEmpresa}</strong>,</p>
        <p style="font-size: 16px; color: #333;">
          Tu cuenta ha sido creada correctamente en <strong>Me Apunto</strong>. 
          Ya puedes empezar a publicar tus eventos y llegar a más personas.
        </p>
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #91703d; margin: 0 0 12px 0;">¿Qué puedes hacer ahora?</h3>
          <p style="margin: 8px 0; color: #333;">✓ Publicar eventos gratuitos o de pago</p>
          <p style="margin: 8px 0; color: #333;">✓ Subir imágenes para tus eventos</p>
          <p style="margin: 8px 0; color: #333;">✓ Recibir inscripciones de usuarios</p>
          <p style="margin: 8px 0; color: #333;">✓ Promocionar tus eventos con patrocinio</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL}/panel" style="background-color: #91703d; color: white; padding: 12px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ir a mi panel
          </a>
        </div>
        <p style="font-size: 14px; color: #818181; margin-top: 24px;">
          Si tienes alguna pregunta puedes contactarnos desde la web.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: correoEmpresa,
    subject: "¡Bienvenida a Me Apunto!",
    html,
  });

  console.log(`Correo de bienvenida enviado a ${correoEmpresa}`);
};

module.exports = {
  enviarCorreoInscripcion,
  enviarCorreoAvisoRenovacion,
  enviarCorreoContacto,
  enviarCorreoBienvenida,
};
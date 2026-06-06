// servicio de email - gestiona todos los correos de la aplicacion
// usa Resend en lugar de Nodemailer porque Railway bloquea los puertos SMTP
// Resend es un servicio de correo disenado para aplicaciones en la nube

const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY no está configurada en las variables de entorno");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (str) => String(str ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#x27;");

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
        <p style="font-size: 16px; color: #333;">Hola <strong>${escapeHtml(nombreEmpresa)}</strong>,</p>
        <p style="font-size: 16px; color: #333;">Tienes una nueva inscripción en tu evento <strong>"${escapeHtml(nombreEvento)}"</strong>.</p>
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #91703d; margin: 0 0 16px 0;">Datos del usuario</h3>
          <p style="margin: 8px 0; color: #333;"><strong>Nombre:</strong> ${escapeHtml(nombreUsuario)}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Correo:</strong> ${escapeHtml(correoUsuario)}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Ciudad:</strong> ${escapeHtml(ciudad)}</p>
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
        <p style="font-size: 16px; color: #333;">Hola <strong>${escapeHtml(nombreEmpresa)}</strong>,</p>
        <p style="font-size: 16px; color: #333;">Tu patrocinio de <strong>"${escapeHtml(nombreEvento)}"</strong> se renovará el <strong>${escapeHtml(fechaRenovacion)}</strong> por <strong>10€</strong>.</p>
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

// correo de contacto - se envia a juanjosehersa@gmail.com
const enviarCorreoContacto = async ({ nombre, email, asunto, contexto }) => {

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Nuevo mensaje de contacto</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <div style="background-color: white; border-radius: 8px; padding: 20px;">
          <p style="margin: 8px 0; color: #333;"><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Mensaje:</strong></p>
          <p style="margin: 8px 0; color: #333; white-space: pre-wrap;">${escapeHtml(contexto)}</p>
        </div>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: process.env.ADMIN_EMAIL || "juanjosehersa@gmail.com",
    subject: `Contacto web: ${asunto}`,
    reply_to: email,
    html,
  });

  console.log(`Correo de contacto enviado de ${email}`);
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
        <p style="font-size: 16px; color: #333;">Hola <strong>${escapeHtml(nombreEmpresa)}</strong>,</p>
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

// correo que se envia para recuperar contraseña
const enviarCorreoRecuperacion = async ({ correoEmpresa, nombreEmpresa, token }) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Recupera tu contraseña</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333;">Hola <strong>${escapeHtml(nombreEmpresa)}</strong>,</p>
        <p style="font-size: 16px; color: #333;">
          Has solicitado recuperar tu contraseña. Haz clic en el siguiente botón para establecer una nueva contraseña:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #91703d; color: white; padding: 12px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Restablecer contraseña
          </a>
        </div>
        <p style="font-size: 14px; color: #818181;">
          Este enlace caduca en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.
        </p>
        <p style="font-size: 14px; color: #818181; margin-top: 24px;">
          Este correo ha sido enviado automáticamente por Me Apunto.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: correoEmpresa,
    subject: "Recupera tu contraseña - Me Apunto",
    html,
  });

  console.log(`Correo de recuperacion enviado a ${correoEmpresa}`);
};

// correo de confirmacion de cambio de correo electronico
const enviarCorreoConfirmacionCambio = async ({ correoNuevo, nombreEmpresa, token }) => {
  const confirmUrl = `${process.env.FRONTEND_URL}/confirmar-correo/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Confirma tu nuevo correo</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333;">Hola <strong>${escapeHtml(nombreEmpresa)}</strong>,</p>
        <p style="font-size: 16px; color: #333;">
          Has solicitado cambiar el correo de tu cuenta. Confirma que esta nueva dirección es tuya haciendo clic en el botón:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${confirmUrl}" style="background-color: #91703d; color: white; padding: 12px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Confirmar nuevo correo
          </a>
        </div>
        <p style="font-size: 14px; color: #818181;">
          Este enlace caduca en 24 horas. Si no solicitaste este cambio, ignora este correo — tu dirección actual seguirá siendo la misma.
        </p>
        <p style="font-size: 14px; color: #818181; margin-top: 24px;">
          Este correo ha sido enviado automáticamente por Me Apunto.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: correoNuevo,
    subject: "Confirma tu nuevo correo - Me Apunto",
    html,
  });

  console.log(`Correo de confirmacion de cambio enviado a ${correoNuevo}`);
};

const enviarCorreoConfirmacionSuscripcion = async ({ email, nombreEmpresa }) => {

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Suscripción confirmada</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333;">¡Hola!</p>
        <p style="font-size: 16px; color: #333;">
          Te has suscrito correctamente a <strong>${escapeHtml(nombreEmpresa)}</strong> en Me Apunto.
        </p>
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 8px 0; color: #333;">✓ Recibirás un aviso cuando <strong>${escapeHtml(nombreEmpresa)}</strong> publique nuevos eventos</p>
          <p style="margin: 8px 0; color: #333;">✓ Te notificaremos si hay cambios importantes en sus eventos</p>
        </div>
        <p style="font-size: 14px; color: #818181; margin-top: 24px;">Si no solicitaste esta suscripción, puedes ignorar este correo.</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: email,
    subject: `Suscripción confirmada a ${nombreEmpresa} – Me Apunto`,
    html,
  });

  console.log(`Correo de confirmación de suscripción enviado a ${email}`);
};

const enviarCorreoContactoEmpresa = async ({ correoEmpresa, nombreEmpresa, nombreEvento, nombreRemitente, emailRemitente, mensaje }) => {

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Alguien quiere contactar contigo</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333;">Hola <strong>${escapeHtml(nombreEmpresa)}</strong>,</p>
        <p style="font-size: 16px; color: #333;">Has recibido un mensaje a través de la ficha del evento <strong>"${escapeHtml(nombreEvento)}"</strong> en Me Apunto.</p>
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 8px 0; color: #333;"><strong>Nombre:</strong> ${escapeHtml(nombreRemitente)}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Email:</strong> ${escapeHtml(emailRemitente)}</p>
          <p style="margin: 16px 0 8px 0; color: #333;"><strong>Mensaje:</strong></p>
          <p style="margin: 0; color: #444; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(mensaje)}</p>
        </div>
        <p style="font-size: 14px; color: #818181; margin-top: 24px;">Puedes responder directamente a este correo para contestar a ${escapeHtml(nombreRemitente)}.</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: correoEmpresa,
    reply_to: emailRemitente,
    subject: `Mensaje sobre tu evento "${nombreEvento}" – Me Apunto`,
    html,
  });

  console.log(`Correo de contacto a empresa ${correoEmpresa} enviado desde ${emailRemitente}`);
};

const enviarCorreoRespuestaMensaje = async ({ emailDestinatario, nombreDestinatario, nombreEmpresa, asuntoOriginal, respuesta }) => {

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Respuesta a tu mensaje</p>
      </div>
      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #333;">Hola <strong>${escapeHtml(nombreDestinatario)}</strong>,</p>
        <p style="font-size: 16px; color: #333;"><strong>${escapeHtml(nombreEmpresa)}</strong> ha respondido a tu mensaje sobre <em>"${escapeHtml(asuntoOriginal)}"</em>:</p>
        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #b79868;">
          <p style="margin: 0; color: #333; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(respuesta)}</p>
        </div>
        <p style="font-size: 14px; color: #818181; margin-top: 24px;">Este correo ha sido enviado automáticamente por Me Apunto.</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Me Apunto <onboarding@resend.dev>",
    to: emailDestinatario,
    subject: `Re: ${asuntoOriginal} – Me Apunto`,
    html,
  });

  console.log(`Correo de respuesta enviado a ${emailDestinatario}`);
};

module.exports = {
  enviarCorreoInscripcion,
  enviarCorreoAvisoRenovacion,
  enviarCorreoContacto,
  enviarCorreoBienvenida,
  enviarCorreoRecuperacion,
  enviarCorreoConfirmacionCambio,
  enviarCorreoContactoEmpresa,
  enviarCorreoConfirmacionSuscripcion,
  enviarCorreoRespuestaMensaje,
};
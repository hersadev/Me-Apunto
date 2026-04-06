// servicio de email - gestiona todos los correos de la aplicacion
// usa nodemailer para enviar correos desde juanjosehersa@gmail.com
// necesita una contraseña de aplicacion de gmail - no la contraseña normal

const nodemailer = require("nodemailer");

// configuracion del transporter de nodemailer
// usamos puerto 587 porque Railway bloquea el 465
const crearTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// correo que se envia a la empresa cuando alguien se inscribe a su evento
// incluye todos los datos del usuario y el desglose de la comision
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
  const transporter = crearTransporter();

  const asunto = `Nueva inscripción en "${nombreEvento}"`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      
      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Nueva inscripción recibida</p>
      </div>

      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">
        
        <p style="font-size: 16px; color: #333;">
          Hola <strong>${nombreEmpresa}</strong>,
        </p>
        <p style="font-size: 16px; color: #333;">
          Tienes una nueva inscripción en tu evento <strong>"${nombreEvento}"</strong>.
        </p>

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
          <p style="margin: 8px 0; color: #818181; font-size: 14px;">
            Comisión Me Apunto (5%): ${comisionMeApunto.toFixed(2)}€
          </p>
          <p style="margin: 8px 0; color: #2e7d32; font-size: 16px;">
            <strong>Importe para tu empresa: ${importeEmpresa.toFixed(2)}€</strong>
          </p>
        </div>
        ` : `
        <div style="background-color: #e8f5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32; font-weight: bold;">✓ Evento gratuito</p>
        </div>
        `}

        <p style="font-size: 14px; color: #818181; margin-top: 24px;">
          Este correo ha sido enviado automáticamente por Me Apunto.
        </p>

      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Me Apunto" <${process.env.EMAIL_USER}>`,
    to: correoEmpresa,
    subject: asunto,
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
  const transporter = crearTransporter();

  const asunto = `Tu patrocinio de "${nombreEvento}" se renueva en 7 días`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Aviso de renovación de patrocinio</p>
      </div>

      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">

        <p style="font-size: 16px; color: #333;">
          Hola <strong>${nombreEmpresa}</strong>,
        </p>
        <p style="font-size: 16px; color: #333;">
          Te recordamos que el patrocinio de tu evento 
          <strong>"${nombreEvento}"</strong> se renovará 
          automáticamente el <strong>${fechaRenovacion}</strong> 
          por un importe de <strong>10€</strong>.
        </p>

        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #91703d; margin: 0 0 12px 0;">¿Qué puedes hacer?</h3>
          <p style="margin: 8px 0; color: #333;">
            ✓ <strong>Mantener el patrocinio:</strong> No tienes que hacer nada,
            se renovará automáticamente.
          </p>
          <p style="margin: 8px 0; color: #333;">
            ✗ <strong>Cancelar el patrocinio:</strong> Accede a tu panel de
            empresa y desactiva el patrocinio antes de la fecha de renovación.
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a 
            href="${process.env.FRONTEND_URL}/panel" 
            style="background-color: #91703d; color: white; padding: 12px 32px; 
                   border-radius: 999px; text-decoration: none; font-weight: bold;
                   font-size: 16px;"
          >
            Ir a mi panel
          </a>
        </div>

        <p style="font-size: 14px; color: #818181; margin-top: 24px;">
          Este correo ha sido enviado automáticamente por Me Apunto.
          Si tienes alguna pregunta puedes contactarnos respondiendo a este correo.
        </p>

      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Me Apunto" <${process.env.EMAIL_USER}>`,
    to: correoEmpresa,
    subject: asunto,
    html,
  });

  console.log(`Correo de aviso de renovacion enviado a ${correoEmpresa}`);
};

// correo de contacto - se envia a juanjosehersa@gmail.com
const enviarCorreoContacto = async ({ nombre, email, asunto, contexto }) => {
  const transporter = crearTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

      <div style="background-color: #b79868; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Me Apunto</h1>
        <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">Nuevo mensaje de contacto</p>
      </div>

      <div style="background-color: #f0e8dc; padding: 32px; border-radius: 0 0 12px 12px;">

        <div style="background-color: white; border-radius: 8px; padding: 20px;">
          <p style="margin: 8px 0; color: #333;"><strong>Nombre:</strong> ${nombre}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Asunto:</strong> ${asunto}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Mensaje:</strong></p>
          <p style="margin: 8px 0; color: #333; white-space: pre-wrap;">${contexto}</p>
        </div>

      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Me Apunto" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `Contacto web: ${asunto}`,
    html,
    replyTo: email,
  });

  console.log(`Correo de contacto enviado de ${email}`);
};

module.exports = {
  enviarCorreoInscripcion,
  enviarCorreoAvisoRenovacion,
  enviarCorreoContacto,
};
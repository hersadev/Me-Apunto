    // servicio de tareas programadas con node-cron
    // ejecuta tareas automaticas en segundo plano
    // la tarea principal es revisar patrocinios proximos a renovarse
    // y enviar correos de aviso 7 dias antes

    const cron = require("node-cron");
    const Evento = require("../models/Evento");
    const Empresa = require("../models/Empresa");
    const { enviarCorreoAvisoRenovacion } = require("./emailService");
    const { eliminarImagen } = require("./cloudinaryService");

    // funcion que revisa los patrocinios proximos a renovarse
    // se ejecuta una vez al dia a las 9:00
    const revisarPatrociniosProximos = async () => {
    try {
        console.log("Revisando patrocinios proximos a renovarse...");

        // fecha de hoy y fecha de dentro de 7 dias
        const hoy = new Date();
        const en7dias = new Date();
        en7dias.setDate(en7dias.getDate() + 7);

        // buscamos eventos patrocinados cuya fecha de fin este
        // entre hoy y dentro de 7 dias y que aun no hayan recibido aviso
        // excluimos los que ya estan cancelados (no tiene sentido avisar de renovacion)
        const eventosProximos = await Evento.find({
        patrocinado: true,
        activo: true,
        avisoPrevioEnviado: false,
        cancelacionPatrocinio: false,
        fechaFinPatrocinio: {
            $gte: hoy,
            $lte: en7dias,
        },
        }).populate("empresa", "nombre correo");

        console.log(`Encontrados ${eventosProximos.length} patrocinios proximos`);

        // enviamos correo de aviso a cada empresa
        for (const evento of eventosProximos) {
        try {
            // formateamos la fecha de renovacion para el correo
            const fechaRenovacion = new Date(evento.fechaFinPatrocinio)
            .toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });

            await enviarCorreoAvisoRenovacion({
            correoEmpresa: evento.empresa.correo,
            nombreEmpresa: evento.empresa.nombre,
            nombreEvento: evento.titulo,
            fechaRenovacion,
            });

            // marcamos el evento como que ya se envio el aviso
            // para no enviar el correo mas de una vez
            evento.avisoPrevioEnviado = true;
            await evento.save();

        } catch (errorCorreo) {
            console.error(
            `Error al enviar aviso de renovacion para evento ${evento._id}:`,
            errorCorreo
            );
        }
        }

    } catch (error) {
        console.error("Error en revision de patrocinios:", error);
    }
    };

    // funcion que renueva automaticamente los patrocinios vencidos
    // si la empresa tiene tarjeta guardada se cobra automaticamente
    // si no se desactiva el patrocinio
    const renovarPatrociniosVencidos = async () => {
    try {
        console.log("Renovando patrocinios vencidos...");

        const hoy = new Date();

        // buscamos eventos patrocinados cuya fecha de fin ya paso
        const eventosVencidos = await Evento.find({
        patrocinado: true,
        activo: true,
        fechaFinPatrocinio: { $lt: hoy },
        }).populate("empresa");

        for (const evento of eventosVencidos) {
        try {
            if (evento.cancelacionPatrocinio) {
            // la empresa cancelo, desactivar sin renovar
            evento.patrocinado = false;
            evento.fechaInicioPatrocinio = null;
            evento.fechaFinPatrocinio = null;
            evento.cancelacionPatrocinio = false;
            evento.avisoPrevioEnviado = false;
            await evento.save();

            console.log(`Patrocinio expirado (cancelado) para evento ${evento._id}`);

            } else if (evento.empresa.stripePaymentMethodId) {
            // si la empresa tiene tarjeta guardada renovamos el patrocinio
            // TODO: procesar el cobro de 10€ con stripe
            // await stripeService.cobrarPatrocinio(evento);

            // calculamos la nueva fecha de fin (un mes desde hoy)
            const nuevaFechaFin = new Date();
            nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 1);

            // actualizamos las fechas del patrocinio
            evento.fechaInicioPatrocinio = hoy;
            evento.fechaFinPatrocinio = nuevaFechaFin;
            // reseteamos el aviso para el proximo mes
            evento.avisoPrevioEnviado = false;
            await evento.save();

            console.log(`Patrocinio renovado para evento ${evento._id}`);

            } else {
            // si no tiene tarjeta desactivamos el patrocinio
            evento.patrocinado = false;
            evento.fechaInicioPatrocinio = null;
            evento.fechaFinPatrocinio = null;
            evento.avisoPrevioEnviado = false;
            await evento.save();

            console.log(
                `Patrocinio desactivado por falta de pago para evento ${evento._id}`
            );
            }

        } catch (errorEvento) {
            console.error(
            `Error al renovar patrocinio del evento ${evento._id}:`,
            errorEvento
            );
        }
        }

    } catch (error) {
        console.error("Error en renovacion de patrocinios:", error);
    }
    };

    // funcion que purga la papelera eliminando definitivamente los eventos
    // que llevan mas de 30 dias enviados a papelera
    // tambien borra la imagen asociada en Cloudinary
    const purgarPapelera = async () => {
    try {
        console.log("Purgando papelera (eventos > 30 dias)...");

        const hace30dias = new Date();
        hace30dias.setDate(hace30dias.getDate() - 30);

        const expirados = await Evento.find({
        activo: false,
        fechaEliminacion: { $ne: null, $lt: hace30dias },
        });

        console.log(`Encontrados ${expirados.length} eventos para purgar`);

        for (const evento of expirados) {
        try {
            if (evento.imagen) {
            const publicId = evento.imagen
                .split("/")
                .slice(-2)
                .join("/")
                .split(".")[0];
            await eliminarImagen(publicId);
            }
            await evento.deleteOne();
        } catch (errEvento) {
            console.error(`Error al purgar evento ${evento._id}:`, errEvento);
        }
        }

    } catch (error) {
        console.error("Error en purga de papelera:", error);
    }
    };

    // iniciamos las tareas programadas
    const iniciarCron = () => {
    // tarea 1: revisar patrocinios proximos a renovarse
    // se ejecuta todos los dias a las 9:00
    cron.schedule("0 9 * * *", () => {
        console.log("Cron: revisando patrocinios proximos...");
        revisarPatrociniosProximos();
    });

    // tarea 2: renovar patrocinios vencidos
    // se ejecuta todos los dias a las 0:00
    cron.schedule("0 0 * * *", () => {
        console.log("Cron: renovando patrocinios vencidos...");
        renovarPatrociniosVencidos();
    });

    // tarea 3: purgar la papelera (>30 dias)
    // se ejecuta todos los dias a las 3:00
    cron.schedule("0 3 * * *", () => {
        console.log("Cron: purgando papelera...");
        purgarPapelera();
    });

    console.log("Tareas programadas iniciadas correctamente");
    };

    module.exports = { iniciarCron };
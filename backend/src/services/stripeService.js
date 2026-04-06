// servicio de stripe - gestiona todos los pagos de la plataforma
// - pagos de inscripciones a eventos de pago (comision 5% para Me Apunto)
// - pagos de patrocinios (10€/mes por evento)
// de momento solo tiene la estructura base - se implementara cuando
// tengamos las claves de stripe del dashboard

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Empresa = require("../models/Empresa");
const Evento = require("../models/Evento");

// crea o recupera el cliente de stripe para una empresa
// cada empresa tiene un unico cliente en stripe
const obtenerOCrearClienteStripe = async (empresa) => {
  // si ya tiene cliente en stripe lo devolvemos
    if (empresa.stripeCustomerId) {
    return await stripe.customers.retrieve(empresa.stripeCustomerId);
    }

  // si no tiene cliente lo creamos
    const cliente = await stripe.customers.create({
    email: empresa.correo,
    name: empresa.nombre,
    metadata: {
        empresaId: empresa._id.toString(),
    },
});

  // guardamos el id del cliente en la base de datos
    empresa.stripeCustomerId = cliente.id;
    await empresa.save();

    return cliente;
};

// guarda el metodo de pago de una empresa
// se llama cuando la empresa introduce su tarjeta por primera vez
// al activar su primer patrocinio
    const guardarMetodoPago = async (empresaId, paymentMethodId) => {
        const empresa = await Empresa.findById(empresaId);

  // obtenemos o creamos el cliente de stripe
    const cliente = await obtenerOCrearClienteStripe(empresa);

  // adjuntamos el metodo de pago al cliente
    await stripe.paymentMethods.attach(paymentMethodId, {
    customer: cliente.id,
    });

  // lo establecemos como metodo de pago por defecto
    await stripe.customers.update(cliente.id, {
    invoice_settings: {
        default_payment_method: paymentMethodId,
    },
});

  // guardamos el id del metodo de pago en la base de datos
    empresa.stripePaymentMethodId = paymentMethodId;
    await empresa.save();

    return { mensaje: "Método de pago guardado correctamente" };
};

// cobra el patrocinio de un evento (10€)
// se llama cuando se activa el patrocinio o cuando se renueva
const cobrarPatrocinio = async (evento) => {
    const empresa = await Empresa.findById(evento.empresa);

    if (!empresa.stripePaymentMethodId) {
    throw new Error("La empresa no tiene método de pago guardado");
    }

  // creamos el payment intent por 10€
  // stripe trabaja en centimos asi que son 1000 centimos
    const paymentIntent = await stripe.paymentIntents.create({
    amount: 1000,
    currency: "eur",
    customer: empresa.stripeCustomerId,
    payment_method: empresa.stripePaymentMethodId,
    // confirm true para cobrar directamente sin redireccion
    confirm: true,
    description: `Patrocinio evento: ${evento.titulo}`,
    metadata: {
        eventoId: evento._id.toString(),
        empresaId: empresa._id.toString(),
        tipo: "patrocinio",
    },
    });

    return paymentIntent;
};

// crea un payment intent para una inscripcion de pago
// aplica la comision del 5% para Me Apunto usando stripe connect
// TODO: implementar stripe connect para el reparto automatico
const crearPaymentIntentInscripcion = async ({
    importeTotal,
    eventoId,
    nombreEvento,
}) => {
  // importeTotal en euros - lo convertimos a centimos para stripe
  const importeTotalCentimos = Math.round(importeTotal * 100);

  // comision del 5% para Me Apunto en centimos
    const comisionCentimos = Math.round(importeTotalCentimos * 0.05);

    const paymentIntent = await stripe.paymentIntents.create({
    amount: importeTotalCentimos,
    currency: "eur",
    // la comision del 5% se queda en Me Apunto automaticamente
    // con stripe connect el resto va a la cuenta de la empresa
    // TODO: añadir application_fee_amount cuando stripe connect este configurado
    // application_fee_amount: comisionCentimos,
    description: `Inscripción evento: ${nombreEvento}`,
    metadata: {
        eventoId: eventoId.toString(),
        tipo: "inscripcion",
        comisionMeApunto: comisionCentimos,
    },
});

    return paymentIntent;
};

module.exports = {
    obtenerOCrearClienteStripe,
    guardarMetodoPago,
    cobrarPatrocinio,
    crearPaymentIntentInscripcion,
};
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'DUMMY_TOKEN',
});

export const crearSuscripcion = async ({ email, planSaas, externalReference }) => {
  try {
    const preapproval = new PreApproval(client);

    const body = {
      reason: `Suscripción SaaS Gimnasio - Plan ${planSaas}`,
      external_reference: externalReference,
      payer_email: email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: planSaas === 'PRO' ? 15000 : 8000,
        currency_id: 'ARS',
      },
      back_url: 'http://localhost:5173/suscripcion/exito',
      status: 'pending',
    };

    const response = await preapproval.create({ body });

    return {
      initPoint: response.init_point,
      preapprovalId: response.id,
    };
  } catch (error) {
    console.error('Error al crear suscripción en Mercado Pago:', error);
    throw error;
  }
};

export const manejarWebhook = async (bodyData, prisma) => {
  try {
    console.log('Webhook de Mercado Pago recibido:', bodyData);
    // Acá podés procesar las notificaciones IPN/Webhooks de MP
    return true;
  } catch (error) {
    console.error('Error procesando webhook:', error);
    throw error;
  }
};
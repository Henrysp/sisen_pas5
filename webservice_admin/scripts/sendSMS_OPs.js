const appConstants = require("../common/appConstants");
const smsService = require('./../services/smsService');
const dotenv = require('dotenv');
const axios = require("axios");
const {logger} = require("../server/logger");
dotenv.config(process.env);
// const body = [
//   'RECORDATORIO MANUAL-El próximo 02JUN2025, se vence el plazo para la actualización de datos de sus representantes, de la casilla electrónica de su organización política',
//   'El personero legal titular deberá presentar el formulario ubicado en: https://www.onpe.gob.pe/modMarco-Legal/Tupa/solicitud-modificacion-actualizacion-datos.pdf.',
//   'La solicitud de actualización deberá ser presentada de manera física en nuestras Sedes o de manera virtual, a través del siguiente enlace: https://www.web.onpe.gob.pe/mpve/#/',
//   'SI YA LO REALIZO, OMITA ESTE MENSAJE'
// ];
const body = 'El próximo 02JUN2025, se vence el plazo para la actualización de datos de sus representantes, de la casilla electrónica de su organización política.\n' +
    'El personero legal titular deberá presentar el formulario ubicado en: https://www.onpe.gob.pe/modMarco-Legal/Tupa/solicitud-modificacion-actualizacion-datos.pdf\n' +
    'La solicitud de actualización deberá ser presentada de manera física en nuestras Sedes o de manera virtual, a través del siguiente enlace: https://www.web.onpe.gob.pe/mpve/#/\n' +
    'Nota: Si ya realizó la actualización, omita este mensaje.';
const destinatarios = ['940979473'];
// const destinatarios = ['999891300', '942782097', '959244954', '991156135', '949509573', '951587488',
//   '920628207', '945555136', '976007616', '924821634', '948321084', '952519868', '956020838', '966874944', '957583207',
//   '996608100', '948499814', '969136165', '900953307', '975094556', '917206948', '985401735', '992317685', '975081227',
//   '996174416', '953564557', '993672655', '942476667', '947037627', '997299382', '921862154', '936371219', '995172602',
//   '965942063', '922464954', '996976287', '999097912', '984449675', '996200115', '946357490', '980839345', '964687880',
//   '958494275', '970182261', '994025398', '999043994', '953705438', '999451001', '951705276', '963812914', '912895636',
//   '950532627', '989475078', '959501157', '914092361'];
async function enviarMensajes() {
  try {
    for (const celular of destinatarios) {
      const resultSendSMS = await sendSms(celular, body);
      console.log(`SMS enviado a : ${celular + '. Resultado ' + resultSendSMS}`);
    }
  } catch (error) {
    console.error('Error al ejecutar el script:', error);
  }
}
//Enviar en varios mensajes
// async function enviarMensajes() {
//   for (const celular of destinatarios) {
//     console.log(`Enviando a ${celular}`);
//
//     try {
//       for (let i = 0; i < body.length; i++) {
//         const resultado = await smsService.sendSms(celular, body[i]);
//         console.log(`Parte ${i + 1}/4 enviada. Estado: ${resultado}`);
//
//         if (i < body.length - 1) {
//           await new Promise(resolve => setTimeout(resolve, 1000));
//         }
//       }
//       console.log(`Todos los mensajes enviados a ${celular}`);
//
//     } catch (error) {
//       console.error(`Error enviando a ${celular}:`, error);
//     }
//
//     if (destinatarios.indexOf(celular) < destinatarios.length - 1) {
//       await new Promise(resolve => setTimeout(resolve, 2000));
//     }
//   }
// }

const sendSms = async (numberPhone, body) => {
  let tag = "recordatorio-manual"

  try {
    const response = await axios.post(`${process.env.SMS_API_BASE_URL}`,
        { "user": process.env.SMS_API_USER,
          "password": process.env.SMS_API_PASSWORD,
          "SMSText": body,
          "GSM": await buildNumber(numberPhone),
          "tag": tag
        },
        {
          headers: {
            'Authorization': `Basic ${process.env.SMS_API_JWT_TOKEN}`
          }});
    if (response.status === 200){
      if (response.data < 0){
        console.log("No se pudo enviar SMS a " + await buildNumber(numberPhone) + " correctamente. Codigo de error: " + response.data);
        return false;
      }
      console.log("SMS enviado a " + await buildNumber(numberPhone) + " correctamente");
      return true;
    } else {
      console.log("No se pudo enviar SMS a " + await buildNumber(numberPhone) + " correctamente");
      return false;
    }
  } catch (err) {
    // logger.error(err);
  }

  return false;
}

const buildNumber = async (number) => {
  console.log(`${process.env.COUNTRY_CODE}${number}`);
  return `${process.env.COUNTRY_CODE}${number}`;
}
enviarMensajes();

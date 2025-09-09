/**
 * Created by Angel Quispe
 */
const nodemailer = require('nodemailer');
const logger = require('./../server/logger').logger;
//const AWS = require('aws-sdk');

const url_front = process.env.BASE_URL_FRONT;



const sendEmailValidPassword = async (name, email, url) => {
    if (await sendEmailValidPasswordWithAws(name, email, url)) {
        return true;
    }

    return false;
}

const sendEmailValidPasswordWithAws = async (name, email, url) => {
    const url_valid_change_pass = url_front + "#/valida-contrasena/" + url;
    try {

        const html = `         
                <div style="width: 100%; max-width: 700px; margin: 0 auto;">
                <div style="text-align: center; padding-top: 20px;">
                    <table style="border:none; width: 100%;background: #062b56;">
                        <tr>
                            <td style="text-align: left;  padding-left: 10px;  font-size: 50px;  line-height: 48px;  font-weight: bold;   font-family: system-ui;    color: #fff;">
                                SISEN
                            </td>                    
                            <td style=" text-align: right; font-size: 15px; line-height: 48px;  font-family: system-ui; color: #fff; padding-right: 10px;">
                                Sistema de Notificación Electrónica de la ONPE
                            </td>
                        </tr>
                    </table>
                </div>
                <hr>
                <p style="font-family:arial,helvetica,sans-serif; font-size:24px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 0 10px;">
                    Hola ${name},
                </p>
                <div style="font-family:arial,helvetica,sans-serif; text-align:left; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                        <table style="font-family:arial,helvetica,sans-serif;">                        
                            <tr>
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    Se ha solicitado la recuperación de contraseña de tu Casilla Electrónica. Para validar que fue <br>solicitado por usted, haz clic en el siguiente enlace <a href="${url_valid_change_pass}"><b>aquí</b></a>.
                                </td>
                            </tr>
                        </table>
                    </div>
                
                <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 30px 10px;">
                    No olvides revisar siempre tu casilla electrónica.<br>
                </p>
                <footer>
                        <div>
                            <p style="font-family:arial,helvetica,sans-serif; font-size:12px; color:black ;text-align:left; margin: 20px 0 20px 0; padding: 0 10px 0 10px;" >
                                <strong>
                                    <em>
                                        BUZÓN DESATENDIDO, por favor no responder. Toda la información
                                        contenida en este mensaje es confidencial y su uso es exclusivo de la
                                        ONPE. Si usted no es el destinatario, no debe copiar, difundir,
                                        distribuir, ni hacer uso de este correo electrónico y los datos
                                        personales que la conforman.
                                    </em>
                                </strong>
                            </p>
                        </div>
                    </footer>
                <div style="background: #062b56; padding: 5px 10px; margin: 0 0 20px 0; text-align:right;">
                    <!-- <img src="img/onpeblanco.png" style="width: 40px; height: auto;" alt=""> -->
                </div>
                <p style="font-family:arial,helvetica,sans-serif; font-size:12px; color:rgb(80,83,90);text-align:center; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                    Jr. Washington 1894, Cercado de Lima<br>
                    Central Telefónica: (01) 417-0630 / L - S 07:00 h - 18:00 h 
                </p>
            </div>         
        `;
        
        let result = await enviarCorreo(process.env.EMAIL_ORIGEN, email, 'Validar Cambio Contraseña - SISEN', html);

        logger.info(JSON.stringify({message: `email sent to: ${email}`, result: result}));

        return true;

    } catch (err) {
        logger.error(JSON.stringify({message: `error sending email to ${email}`, result: err}));
    }

    return false;
}


const sendEmailNewPassword = async (name, email, newPassword) => {
    return await sendNewPasswordWithAws(name, email, newPassword);
}

const sendNewPasswordWithAws = async (name, email, newPassword) => {
    //AWS.config.update({
    //    accessKeyId: process.env.AWS_ACCESS_KEY_ID_SES,
    //    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_SES,
    //    region: process.env.AWS_REGION_SES,
    //});

    //const ses = new AWS.SES();

    try {

        const html = `         
                <div style="width: 100%; max-width: 700px; margin: 0 auto;">
                    <div style="text-align: center; padding-top: 20px;">
                        <table style="border:none; width: 100%;background: #062b56;">
                            <tr>
                                <td style="text-align: left;  padding-left: 10px;  font-size: 50px;  line-height: 48px;  font-weight: bold;   font-family: system-ui;    color: #fff;">
                                    SISEN
                                </td>                    
                                <td style=" text-align: right; font-size: 15px; line-height: 48px;  font-family: system-ui; color: #fff; padding-right: 10px;">
                                    Sistema de Notificación Electrónica de la ONPE
                                </td>
                            </tr>
                        </table>
                    </div>
                    <hr>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:24px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 0 10px;">
                        Hola ${name},
                    </p>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 0 10px;">
                        Para recuperar tu acceso al Sistema de Notificación Electrónica de la ONPE (SISEN), sigue los siguientes pasos:
                    </p>
                    <div style="font-family:arial,helvetica,sans-serif; text-align:left; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                        <table style="font-family:arial,helvetica,sans-serif;">                        
                            <tr>
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    1. Ingresa haciendo clic <a href="${url_front}"><b>aquí</b></a>
                                </td>
                            </tr>
                            <tr>
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    2. Digita tu documento de identidad e ingresa esta contraseña: <b>${newPassword}</b>
                                </td>
                            </tr>
                            <tr>
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    3. El sistema te solicitará cambiarla y crear una nueva contraseña.
                                </td>
                            </tr>                                               
                        </table>
                    </div>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 30px 10px;">
                        No olvides revisar siempre tu casilla electrónica.<br>
                    </p>
                    <footer>
                            <div>
                                <p style="font-family:arial,helvetica,sans-serif; font-size:12px; color:black ;text-align:left; margin: 20px 0 20px 0; padding: 0 10px 0 10px;" >
                                    <strong>
                                        <em>
                                            BUZÓN DESATENDIDO, por favor no responder. Toda la información
                                            contenida en este mensaje es confidencial y su uso es exclusivo de la
                                            ONPE. Si usted no es el destinatario, no debe copiar, difundir,
                                            distribuir, ni hacer uso de este correo electrónico y los datos
                                            personales que la conforman.
                                        </em>
                                    </strong>
                                </p>
                            </div>
                    </footer>
                    <div style="background: #062b56; padding: 5px 10px; margin: 0 0 20px 0; text-align:right;">
                        <!-- <img src="img/onpeblanco.png" style="width: 40px; height: auto;" alt=""> -->
                    </div>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:12px; color:rgb(80,83,90);text-align:center; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                        Jr. Washington 1894, Cercado de Lima<br>
                        Central Telefónica: (01) 417-0630 / L - S 07:00 h - 18:00 h 
                    </p>
                </div>         
        `;

        /*
        const params = {
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: html
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Nueva Contraseña - SISEN'
                }
            },
            Source: process.env.AWS_REGION_SES_MAIL
        };
        */

        //let result = await ses.sendEmail(params).promise();
        
        
        let result = await enviarCorreo(process.env.EMAIL_ORIGEN, email, 'Nueva Contraseña - SISEN', html);

        logger.info(JSON.stringify({message: `email sent to: ${email}`, result: result}));

        return true;
    } catch (err) {
        logger.error(JSON.stringify({message: `error sending email to ${email}`, result: err}));
    }

    return false;
}

const sendEmailNewUserCitizen = async (name, email, password) => {
  if (await sendEmailNewUserCitizenWithAws(name, email, password)) {
      return true;
  }

  return false;
}

const sendEmailNewUserCitizenWithAws = async (name, email, password) => {
  //AWS.config.update({
  //    accessKeyId: process.env.AWS_ACCESS_KEY_ID_SES,
  //    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_SES,
  //    region: process.env.AWS_REGION_SES,
  //});

  //const ses = new AWS.SES();

  try {


      const html = `
          <html>
          <body>  
              <!-- En DIV's (Ini) -->
              <div style="width: 100%; max-width: 700px; margin: 0 auto;">
                  <div style="text-align: center; padding-top: 20px;">
                      <table style="border:none; width: 100%;background: #062b56;">
                          <tr>
                              <td style="text-align: left;  padding-left: 10px;  font-size: 50px;  line-height: 48px;  font-weight: bold;   font-family: system-ui;    color: #fff;">
                                  SISEN
                              </td>                    
                              <td style=" text-align: right; font-size: 15px; line-height: 48px;  font-family: system-ui; color: #fff; padding-right: 10px;">
                                  Sistema de Notificación Electrónica de la ONPE
                              </td>
                          </tr>
                      </table>
                  </div>
                  <hr>
                  <p style="font-family:arial,helvetica,sans-serif; font-size:24px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 0 10px;">
                      Hola ${name},
                  </p>
                  <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 0 10px;">
                      Se creó tu casilla electrónica con éxito. Para ingresar al Sistema de Notificación Electrónica de la ONPE (SISEN), sigue los siguientes pasos:
                  </p>
                  <div style="font-family:arial,helvetica,sans-serif; text-align:left; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                    <table style="font-family:arial,helvetica,sans-serif;">                        
                        <tr>
                            <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                1. Ingresa sus credenciales de acceso <br>
                                    Usuario: ${doc}
                                    Contraseña: <b>${password}</b>
                                    a la siguiente ruta, haciendo clic en: <br>
                                    <a href="${url_front_citizen}">${url_front_citizen}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                2. El sistema te solicitará cambiarla y crear una nueva contraseña.
                            </td>
                        </tr>                                            
                    </table>                    
                  </div>
                  <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 30px 10px;">
                      No olvides revisar siempre tu casilla electrónica.<br>
                  </p>
                  <div style="background: #062b56; padding: 5px 10px; margin: 0 0 20px 0; text-align:right;">
                      <!-- <img src="img/onpeblanco.png" style="width: 40px; height: auto;" alt=""> -->
                  </div>
                  <p style="font-family:arial,helvetica,sans-serif; font-size:12px; color:rgb(80,83,90);text-align:center; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                      Jr. Washington 1894, Cercado de Lima<br>
                      Central Telefónica: (01) 417-0630 / L - S 07:00 h - 18:00 h 
                  </p>
              </div>
          </body>
          </html>        
      
      `;


      /*
      const params = {
          Destination: {
              ToAddresses: [email]
          },
          Message: {
              Body: {
                  Html: {
                      Charset: 'UTF-8',
                      Data: html
                  },
              },
              Subject: {
                  Charset: 'UTF-8',
                  Data: 'Contraseña de acceso - SISEN'
              }
          },
          Source: process.env.AWS_REGION_SES_MAIL
      };
      */

      //let result = await ses.sendEmail(params).promise();

      let result = await enviarCorreo(process.env.EMAIL_ORIGEN, email, 'Contraseña de acceso - SISEN', html);

      logger.info(JSON.stringify({message: `email sent to: ${email}`, result: result}));

      return true;

  } catch (err) {
      logger.error(JSON.stringify({message: `error sending email to ${email}`, result: err}));
  }

  return false;
}
const sendEmailNewPasswordConfirm = async (name, email, cargo) => {
    return await sendConfirmPassword(name, email, cargo);
}

const sendConfirmPassword = async (name, email, cargo) => {
    try {
        const mensajeCargo = cargo
            ? `Te informamos que la contraseña de tu cuenta con el cargo <b>${cargo}</b> en el Sistema de Notificación Electrónica de la ONPE (SISEN) ha sido cambiada exitosamente.`
            : `Te informamos que la contraseña de tu cuenta en el Sistema de Notificación Electrónica de la ONPE (SISEN) ha sido cambiada exitosamente.`;

        const html = `         
                <div style="width: 100%; max-width: 700px; margin: 0 auto;">
                    <div style="text-align: center; padding-top: 20px;">
                        <table style="border:none; width: 100%;background: #062b56;">
                            <tr>
                                <td style="text-align: left;  padding-left: 10px;  font-size: 50px;  line-height: 48px;  font-weight: bold;   font-family: system-ui;    color: #fff;">
                                    SISEN
                                </td>                    
                                <td style=" text-align: right; font-size: 15px; line-height: 48px;  font-family: system-ui; color: #fff; padding-right: 10px;">
                                    Sistema de Notificación Electrónica de la ONPE
                                </td>
                            </tr>
                        </table>
                    </div>
                    <hr>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:24px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 0 10px;">
                        Hola ${name},
                    </p>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 0 10px;">
                       ${mensajeCargo}
                    </p>
                    <div style="font-family:arial,helvetica,sans-serif; text-align:left; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                        <table style="font-family:arial,helvetica,sans-serif;">                        
                            <tr>
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    Si no realizaste esta acción, te recomendamos restablecer tu contraseña de inmediato <a href="${url_front}"><b>aquí</b></a>.
                                </td>
                            </tr>
                        </table>
                    </div>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 30px 10px;">
                        No olvides revisar siempre tu casilla electrónica.<br>
                    </p>
                     <div>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:12px; color:black ;text-align:left; margin: 20px 0 20px 0; padding: 0 10px 0 10px;" >
                    <strong>
                    <em>
                        BUZÓN DESATENDIDO, por favor no responder. Toda la información
                        contenida en este mensaje es confidencial y su uso es exclusivo de la
                        ONPE. Si usted no es el destinatario, no debe copiar, difundir,
                        distribuir, ni hacer uso de este correo electrónico y los datos
                        personales que la conforman.
                    </em>
                    </strong>
                    </p>
                    </div>
                    <div style="background: #062b56; padding: 5px 10px; margin: 0 0 20px 0; text-align:right;">
                        <!-- <img src="img/onpeblanco.png" style="width: 40px; height: auto;" alt=""> -->
                    </div>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:12px; color:rgb(80,83,90);text-align:center; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                        Jr. Washington 1894, Cercado de Lima<br>
                        Central Telefónica: (01) 417-0630 / L - S 07:00 h - 18:00 h 
                    </p>
                </div>         
        `;
        let result = await enviarCorreo(process.env.EMAIL_ORIGEN, email, 'Confirmación de Cambio de Contraseña – SISEN', html);

        logger.info(JSON.stringify({message: `email sent to: ${email}`, result: result}));

        return true;
    } catch (err) {
        logger.error(JSON.stringify({message: `error sending email to ${email}`, result: err}));
    }

    return false;
}
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // tls: { rejectUnauthorized: process.env.EMAIL_SECURE, ciphers: 'SSLv3' },
    secure: false,
    debug: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  const transporterAnonymous = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    tls: { rejectUnauthorized: process.env.EMAIL_SECURE === 'true' },
    secure: process.env.EMAIL_SECURE === 'true',
    debug: true,
  });
  
  const enviarCorreo = async (origen, destino, asunto, contenido) => {
    try {
      logger.info('Parametros de conexion SMTP', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        tls: { rejectUnauthorized: process.env.EMAIL_SECURE === 'true' },
        secure: process.env.EMAIL_SECURE === 'true',
        debug: true,
        replyTo: process.env.EMAIL_REPLY_TO
      });
      const transport = process.env.EMAIL_ANONYMOUS === 'true' ? transporterAnonymous : transporter
      //result = await transport.verify();
      logger.info(`transport SMTP `, transport );
      //logger.info(`Verificar servidor SMTP (Anonymous: ${process.env.EMAIL_ANONYMOUS} )`, result);
      await transport.sendMail({
        from: origen,
        to: destino,
        subject: asunto,
        html: contenido,
        replyTo: process.env.EMAIL_REPLY_TO
      });
      return true;
    } catch (error) {
      logger.error(`Ocurrió un erro al enviar el correo (Anonymous: ${process.env.EMAIL_ANONYMOUS}): `, error);
      return false;
    }
  
  }


module.exports = {sendEmailValidPassword, sendEmailNewPassword, sendEmailNewUserCitizen, sendEmailNewPasswordConfirm}

/**
 * Created by Alexander Llacho
 */

const nodemailer = require('nodemailer');
const logger = require('./../../server/logger').logger;
const dotenv = require('dotenv');
dotenv.config();

// const url_front = process.env.BASE_URL_FRONT;
const url_front = 'https://casillaelectronica.onpe.gob.pe';


const sendEmailNewUser = async (name, email, password, doc, countNotifications) => {
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
                        Estimado Ciudadano/a: ${name},
                    </p>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 0 10px;">
                        Le informamos que a la fecha usted tiene <b>${countNotifications}</b> notificación(es) pendiente(s). Para acceder a ellas, requerirá nuevas credenciales de acceso.
                    </p>
                    <div style="font-family:arial,helvetica,sans-serif; text-align:left; margin: 20px 0 20px 0; padding: 0 10px 0 10px;">
                        <table style="font-family:arial,helvetica,sans-serif;">     
                            <tr>
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    Le pedimos realizar los siguientes pasos:
                                </td>
                            </tr>
                            <tr>                   
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    1.  Para ingresar a su casilla electrónica, haga clic aquí: <a href="${url_front}">${url_front}</a>
                                </td>
                            </tr>
                            <tr>                   
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    2. Digitar su Usuario: <b>${doc}</b> Contraseña: <b>${password}</b>
                                </td>
                            </tr>
                            <tr>                   
                                <td style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);">
                                    3. El sistema le solicitará cambiarla y crear una nueva contraseña.
                                </td>
                            </tr>                                             
                        </table>                    
                    </div>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 30px 10px;">
                        Es importante que revise periódicamente su casilla electrónica.<br>
                    </p>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:16px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 30px 10px;">
                        En caso presentes dificultades para el uso y acceso a la casilla electrónica, le pedimos comunicarse al siguiente correo electrónico: <a href="mailto:sisen@onpe.gob.pe">sisen@onpe.gob.pe</a><br>
                    </p>
                    <p style="font-family:arial,helvetica,sans-serif; font-size:12px; color:rgb(80,83,90);text-align:justify; margin: 30px 0 0 0; padding: 0 10px 30px 10px;">
                        <b>Nota: Si al recibir esta comunicación, usted ya modificó su contraseña, le agradeceremos no tomar en cuenta este mensaje.</b><br>
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

        // let result = await sendEmail(process.env.EMAIL_ORIGEN, email, 'Recordatorio de usuario y contraseña para el ingreso a tu casilla electrónica SISEN – ONPE', html);
        let result = await sendEmail('casillaelectronica@onpe.gob.pe', email, 'Recordatorio de usuario y contraseña para el ingreso a tu casilla electrónica SISEN – ONPE', html);
        logger.info(JSON.stringify({message: `email sent to: ${email}`, result: result}));
        return result;
    } catch (err) {
        logger.error(JSON.stringify({message: `error sending email to ${email}`, result: err}));
    }

    return false;
}

const sendEmail = async (origen, destino, asunto, contenido) => {
    try {
        logger.info('Parametros de conexion SMTP', {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            tls: {rejectUnauthorized: process.env.EMAIL_SECURE === 'true'},
            secure: process.env.EMAIL_SECURE === 'true',
            debug: true,
        });
        const transport = process.env.EMAIL_ANONYMOUS === 'true' ? transporterAnonymous : transporter;
        // const transport = transporterAnonymous;
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

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    tls: {rejectUnauthorized: process.env.EMAIL_SECURE},
    secure: process.env.EMAIL_SECURE,
    debug: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const transporterAnonymous = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    tls: {rejectUnauthorized: process.env.EMAIL_SECURE === 'true'},
    secure: process.env.EMAIL_SECURE === 'true',
    debug: true,
});

// const transporterAnonymous = nodemailer.createTransport({
//     host: '10.1.1.43',
//     port: '25',
//     tls: {rejectUnauthorized: false},
//     secure: false,
//     debug: true,
// });

module.exports = {
    sendEmailNewUser,
    sendEmail
}

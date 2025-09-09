

export class EmailService {

  async enviarCorreo(
    origen: string,
    destino: string,
    asunto: string,
    contenido: string,
  ): Promise<boolean> {
    let nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      tls: { rejectUnauthorized: process.env.EMAIL_SECURE },
      secure: process.env.EMAIL_SECURE,
      debug: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const transporterAnonymous = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      tls: { rejectUnauthorized: process.env.EMAIL_SECURE === 'true' },
      secure: process.env.EMAIL_SECURE === 'true',
      debug: true,
    });

    try {
      console.info('Parametros de conexion SMTP', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        tls: { rejectUnauthorized: process.env.EMAIL_SECURE === 'true' },
        secure: process.env.EMAIL_SECURE === 'true',
        replyTo: process.env.EMAIL_REPLY_TO,
        debug: true,
      });
      const transport =
        process.env.EMAIL_ANONYMOUS === 'true'
          ? transporterAnonymous
          : transporter;
      // const result = await transport.verify();
      // console.info(`Verificar servidor SMTP (Anonymous: ${process.env.EMAIL_ANONYMOUS} )`, result);
      await transport.sendMail({
        from: origen,
        to: destino,
        subject: asunto,
        html: contenido,
        replyTo: process.env.EMAIL_REPLY_TO
      });
      return true;
    } catch (error) {
      console.error(`Ocurrió un error al enviar el correo (Anonymous: ${process.env.EMAIL_ANONYMOUS}): `);
      return false;
    }
  }
}

import * as request from 'request-promise';
import * as fs from 'fs';

export class MpveService {
  async enviarDocMesaPartes(docType: string, docNumber: string): Promise<boolean> {
    const mpveData = {
      codDestinatario: '03',
      documentoUser: docNumber,
      dni_remitente_personaJuridica: docNumber,
      idTipoDocumento: '231',
      nroDocumento: 'SOLICITUD DE CREACION DE CASILLA',
      nroFolios: 1,
      asunto: 'SOLICITUD DE CREACION DE CASILLA',
      tupa: 0,
    };
    try {
      const response = await request({
        uri: `${process.env.URL_MPVE}`,
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data',
        },
        formData: {
          servicioMPVE: JSON.stringify(mpveData),
          fileArchivo: {
            value: fs.createReadStream('/Jhon/template.pdf'),
            // value: fs.createReadStream(`${process.env.PATH_UPLOAD}` + 'template.pdf'),
            options: {
              filename: '/Jhon/template.pdf',
              contentType: null,
            },
          },
        },
        resolveWithFullResponse: true,
        insecure: true,
        rejectUnauthorized: false,
      });

      if (response.statusCode == 200) {
        const result = response.body;
        console.debug('Mpve info ', result);
      }
      return true;
    } catch (err) {
      console.error('Error al enviar el servicio mpvm: ' + err);
    }
    return false;
  }
}

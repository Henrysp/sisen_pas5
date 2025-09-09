import * as process from 'process';
import axios from 'axios';

export class SmsSevice {
  async enviarSMS(toNumber: string, body: string): Promise<boolean> {
    const toPhoneNumber = this.phoneNumber(toNumber);
    let tag = "sisen-prod"

    if (process.env.NODE_ENV !== "production"){
        body = "DEV-" + body
        tag = "sisen-dev"
    }

    try {
      //Send the notification;
      const response = await axios.post(`${process.env.SMS_API_BASE_URL}`,
                                      { "user": process.env.SMS_API_USER, 
                                        "password": process.env.SMS_API_PASSWORD, 
                                        "SMSText": body, 
                                        "GSM": toPhoneNumber,
                                        "tag": tag
                                      },
                                      {
                                        headers: {
                                          'Authorization': `Basic ${process.env.SMS_API_JWT_TOKEN}`
                                        }});

      if (response.status === 200){
          if (response.data < 0){
            console.log("No se pudo enviar SMS a " + toPhoneNumber + " correctamente. Codigo de error: " + response.data);
            return false;  
          }
          console.log("SMS enviado a " + toPhoneNumber + " correctamente");
          return true;
      } else {
          console.log("No se pudo enviar SMS a " + toPhoneNumber + " correctamente");
          return false;
      }

    } catch (error) {
      console.error(`Ocurrió un error al enviar el sms. Error[${error}]`);
      return false;
    }
  }

  phoneNumber(number: string): string {
    return `${process.env.COUNTRY_CODE}${number}`;
  }
}

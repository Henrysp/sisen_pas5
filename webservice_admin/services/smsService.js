/**
 * Created by Alexander Llacho
 */
const logger = require('./../server/logger').logger;
const axios = require('axios');

const sendSms = async (numberPhone, body) => {
    let tag = "sisen-prod"

    //Adding [D] to messages that are not sent in production environment
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
        logger.error(err);
    }

    return false;
}

const buildNumber = async (number) => {
    return `${process.env.COUNTRY_CODE}${number}`;
}

module.exports = {
    sendSms
}

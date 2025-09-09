/**
 * Created by Alexander Llacho
 */

const smsService = require('./../services/smsService');

describe('smsService', () => {

    it('sendSmsTest', async () => {
        console.log('start');
        let number = '992034109';
        let body = 'Hola mundo SISEN';
        let result = await smsService.sendSms(number, body);
        console.log('result: ' + result);
        console.log('end');
    });
});


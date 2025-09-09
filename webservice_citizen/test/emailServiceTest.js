/**
 * Created by Angel Quispe
 */

const emailService = require('./../services/emailService');

describe('emailServiceTest', () => {

    it('sendEmailNewPasswordTest()', async () => {
        console.log('start');

        let result = await emailService.sendEmailNewPassword('ANGEL DAVID', 'angel.dqc@gmail.com', 'Ab123456');

        console.log('start');
    });
});


/**
 * Created by Alexander Llacho
 */

const logger = require('./../server/logger').logger;
const expiredNotifications = require('./../scripts/verificaVencimiento/expiredNotifications');
const notifyReadNotificationsService = require('./../scripts/recordatorioNotificaciones/notifyReadNotificationsService');
const notifyUsersService = require('./../scripts/recordatorioClave/notifyUsersService');

describe('scriptTest', () => {

    // it('sendEmailPasswordTest', async () => {
    //     logger.info('start process');
    //     await notifyUsersService.runPassword(10);
    //     logger.info('end process');
    // });

    // it('expiredTest', async () => {
    //     logger.info('start process');
    //     await expiredNotifications.runExpired();
    //     logger.info('end process');
    // });

    it('sendEmailTest', async () => {
        logger.info('start process');
        await notifyReadNotificationsService.run();
        logger.info('end process');
    });
});

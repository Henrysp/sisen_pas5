/**
 * Created by Alexander Llacho
 */

const registerLogService = require('../services/registerLogService');
const {ObjectId} = require("mongodb");

describe('logsServiceTest', () => {

    it('registerTest()', async () => {
        let data = {inbox_id: '60b9167795931c3e3fbf62ff'};
        let type = 'email';
        let creatorUserName = 'ADMIN ADMIN';
        let updateDate = '2022-10-30';

        let result = await registerLogService.registerContactHistory(data, type, creatorUserName, updateDate);
        console.log(result);
    });

    it('findAllTest()', async () => {
        let inboxId = ObjectId('630562420466d7092b6768c9');

        let result = await registerLogService.findAllContactHistory(inboxId);
        console.log(result);
    });

});

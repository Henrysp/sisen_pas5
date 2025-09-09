/**
 * Created by Angel Quispe
 */

const reportService = require('../services/reportService');

describe('reportServiceTest', () => {

    it('exportTest()', async () => {
        let user = '00000010';
        let begin = '2022-01-01';
        let end = '2022-10-30';

        let result = await reportService.reporteCasillas(user, begin, end);
        console.log(result);
    });

});

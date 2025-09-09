/**
 * Created by Alexander Llacho
 */
const logger = require('./../../server/logger').logger;
const mongoCollections = require('../../common/mongoCollections');
const mongodb = require('./../../database/mongodb');
const utils = require('./../../common/utils');
const appConstants = require('./../../common/appConstants');
const dotenv = require('dotenv');
dotenv.config({path: appConstants.PATH_ENV});
// dotenv.config();
let daysHoliday = [];

const runExpired = async (countSend) => {
    logger.info('start change expired');
    const db = await mongodb.getDb();
    daysHoliday = await getDayHoliday();

    //execute in mongosh
    // db.notifications.updateMany({expired: {$exists: true}},{$unset:{"expired":""}})

    try {
        const limitDate = new Date();
        // limitDate.setDate(limitDate.getDate() - 1);

        let dateCalculate = await calcDate(new Date(limitDate));
        console.log('fecha corte: ' + dateCalculate)

        //list no expired
        const results = await db.collection(mongoCollections.NOTIFICATIONS).find({
            read_at: {$exists: true},
            received_at: {$lt: dateCalculate}
        }).toArray();

        let arrIds = [];
        for (let item of results) {
            if (await validateStatus(item.received_at, item.read_at) === 'RECIBIDO') {
                arrIds.push(item._id);
            }
        }
        console.log('count read in time: ' + arrIds.length);

        const resultUpdate = await db.collection(mongoCollections.NOTIFICATIONS).updateMany({
            _id: {$in: arrIds},
            expired: {$exists: false},
        }, {
            $set: {
                expired: false
            }
        });
        console.log('update no expired 1: ' + JSON.stringify(resultUpdate.result));

        // update notifications
        const resultUpdate1 = await db.collection(mongoCollections.NOTIFICATIONS).updateMany({
            received_at: {$gte: dateCalculate},
        }, {
            $set: {
                expired: false
            }
        });
        console.log('update no expired 2: ' + JSON.stringify(resultUpdate1.result));

        const resultUpdate2 = await db.collection(mongoCollections.NOTIFICATIONS).updateMany({
            received_at: {$lt: dateCalculate},
            _id: {$nin: arrIds},
            $or: [{expired: {$exists: false}}, {expired: false}]
        }, {
            $set: {
                expired: true
            }
        });
        console.log('update expired: ' + JSON.stringify(resultUpdate2.result));

        //count data
        let listNotification = await db.collection(mongoCollections.NOTIFICATIONS)
            .find({received_at: {$gte: dateCalculate}})
            .count();
        console.log('cantidad no expirados: ' + (listNotification + arrIds.length));

        let listNotification2 = await db.collection(mongoCollections.NOTIFICATIONS)
            .find({received_at: {$lt: dateCalculate}, _id: {$nin: arrIds}})
            .count();
        console.log('cantidad expirados: ' + listNotification2);

        logger.info('end expired notifications');
        return true;
    } catch (err) {
        logger.error(err);
    }

    return false;
}

const validateStatus = async (receivedAt, readAt) => {
    let status = 'POR RECIBIR';

    if (readAt) {
        let resultCalc = await calcDate2(readAt, receivedAt);

        if (resultCalc >= 5) {
            status = 'VENCIDO';
        } else {
            status = 'RECIBIDO';
        }
    }

    return status;
}

const calcDate2 = async (date1, date2) => {
    let countDayHoliday = 0;

    const diff = Math.floor(date1.getTime() - date2.getTime());
    const day = 1000 * 60 * 60 * 24;

    const days = Math.floor(diff / day);
    const months = Math.floor(days / 31);
    const years = Math.floor(months / 12);

    let dateCal = date2;
    for (let i = 0; i < days; i++) {
        dateCal.setDate(dateCal.getDate() + 1);

        if (dateCal.getDay() === 0 || dateCal.getDay() === 6) {
            countDayHoliday++;
        }

        if (dateCal.getDate() === daysHoliday[dateCal.getMonth()][dateCal.getDate()]) {
            countDayHoliday++;
        }
    }

    return days - countDayHoliday;
}

const calcDate = async (date1, date2) => {
    let countDay = 0;
    let days = 6;

    let dateCal = date1;
    for (let i = 0; i < days; i++) {
        if (dateCal.getDay() === 0 || dateCal.getDay() === 6) {
            countDay++;
            days++;
        } else if (dateCal.getDate() === daysHoliday[dateCal.getMonth()][dateCal.getDate()]) {
            countDay++;
            days++;
        }

        if (i < (days - 1)) {
            dateCal.setDate(dateCal.getDate() - 1);
        }
    }

    return new Date(dateCal.setHours(0, 0, 0, 0));
}

const getDayHoliday = async () => {
    let dataHoliday = [[], [], [], [], [], [], [], [], [], [], [], []];
    const dataFilter = [
        {"field": "title", "value": ""},
        {"field": "editable", "value": "all"},
        {"field": "dateBegin", "value": ""},
        {"field": "dateEnd", "value": ""}];
    const resultCalendar = await fetchAll(JSON.stringify(dataFilter));

    for (let data of resultCalendar.data) {
        if (data.date_end) {
            let dates = data.date_begin;

            let getData = dataHoliday[dates.getMonth()];
            if (getData.indexOf(dates.getDate()) === -1) {
                getData.push(dates.getDate());
            }
            dataHoliday.splice(dates.getMonth(), 1, getData);

            do {
                dates.setDate(dates.getDate() + 1);

                let getDataMonth = dataHoliday[dates.getMonth()];
                if (getData.indexOf(dates.getDate()) === -1) {
                    getDataMonth.push(dates.getDate());
                }
                dataHoliday.splice(dates.getMonth(), 1, getDataMonth);
            } while (dates.getDate() < data.date_end.getDate())

        } else {
            let day = data.date_begin;

            let getData = dataHoliday[day.getMonth()];
            if (getData.indexOf(day.getDate()) === -1) {
                getData.push(day.getDate());
            }
            dataHoliday.splice(day.getMonth(), 1, getData);
        }
    }

    return dataHoliday;
}

const fetchAll = async (filters) => {

    try {
        const db = await mongodb.getDb();

        filters = JSON.parse(filters);
        let dateBegin = new Date();

        let queryFilter = {
            enabled: true,
            editable: {$in: [true, false]}
        };
        let valueEditable;

        for (const data of filters) {
            if (data.field === 'editable' && !utils.isEmpty(data.value)) {
                switch (data.value) {
                    case 'yes':
                        valueEditable = true;
                        break;
                    case 'not':
                        valueEditable = false;
                        break;
                    case 'all':
                        valueEditable = {$in: [true, false]};
                        break;
                }
            }

            if (!utils.isEmpty(data.value)) {
                switch (data.field) {
                    case 'title':
                        // queryFilter.title =  new RegExp(utils.diacriticSensitiveRegex(data.value), 'i');
                        queryFilter.$or = [
                            {title: new RegExp(utils.diacriticSensitiveRegex(data.value), 'i')},
                            {description: new RegExp(utils.diacriticSensitiveRegex(data.value), 'i')}
                        ]
                        break;
                    case 'editable':
                        queryFilter.editable = valueEditable;
                        break;
                    case 'dateBegin':
                        dateBegin = new Date(data.value + 'T00:00:00');
                        break;
                    case 'dateEnd':
                        let newDateEnd = new Date(data.value + 'T00:00:00');
                        newDateEnd = newDateEnd.setDate(newDateEnd.getDate() + 1)

                        queryFilter.date_begin = {
                            $gte: dateBegin,
                            $lt: new Date(newDateEnd)
                        };
                        break;
                    case 'dateEnd2':
                        let newDate = new Date(data.value + 'T00:00:00');
                        newDate = newDate.setDate(newDate.getDate() + 1)
                        queryFilter.date_end = {$lte: new Date(newDate)};
                        break;
                }
            }
        }

        const cursorCalendar = await db.collection(mongoCollections.CALENDAR)
            .find(queryFilter)
            .sort({$natural: -1})
            .project({
                _id: 1,
                title: 1,
                description: 1,
                date_begin: 1,
                date_end: 1,
                editable: 1,
            });

        let data = [];
        for await (const item of cursorCalendar) {
            data.push(item);
        }

        return {data: data};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

module.exports = {runExpired}

void async function () {
    const countSend = process.argv[2];
    // console.log(countSend);
    await runExpired(countSend);
    process.exit(0);
}();

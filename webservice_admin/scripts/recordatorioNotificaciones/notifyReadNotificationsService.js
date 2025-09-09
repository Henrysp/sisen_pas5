/**
 * Created by Alexander Llacho
 */

const logger = require('./../../server/logger').logger;
const mongoCollections = require('../../common/mongoCollections');
const mongodb = require('./../../database/mongodb');
const emailService = require('./../../services/emailService');
const smsService = require('./../../services/smsService');
const utils = require('./../../common/utils');
const dateFormat = require('dateformat');
const appConstants = require("../../common/appConstants");
const dotenv = require('dotenv');
const {ObjectId} = require("mongodb");
dotenv.config({path: appConstants.PATH_ENV});
let daysHoliday = [];

const run = async () => {
    await notify();
    return true;
}

const notify = async () => {
    logger.info('start notify');
    const db = await mongodb.getDb();
    daysHoliday = await getDayHoliday();
    let skip = 0;
    let limit = 1000;
    let count = 0;
    let currLine = 0;
    let totalSend = 0;

    try {
        let dateCalculate = await calcDate(new Date());
        console.log('fecha corte: ' + dateCalculate)

        do {
            count = 0;
            let listNotification = await db.collection(mongoCollections.NOTIFICATIONS)
                .find({
                    read_at: {$exists: false},
                    received_at: {$gte: dateCalculate},
                })
                .skip(skip)
                .limit(limit)
                .toArray();

            for (let notify of listNotification) {
                count++;
                let cellphone = '';
                let countSendEmail = 1;
                let countSendSMS = 1;
                const listEmail = [];
                const listSms = [];

                let oNotified = await db.collection(mongoCollections.NOTIFY_NOTIFICATIONS_TMP).findOne({
                    notification_id: notify._id
                });

                const notificationData = {
                    inbox_doc_type: notify.inbox_doc_type,
                    inbox_doc: notify.inbox_doc,
                    expedient: notify.expedient,
                    urlNotification: 'https://casillaelectronica.onpe.gob.pe/main/notificaciones-electronicas-detalle/' + notify._id,
                }

                //Getting Inbox
                // let inbox = await db.collection(mongoCollections.INBOX).findOne({
                //     _id: notify.inbox_id
                // });

                //Getting user
                // let user = await db.collection(mongoCollections.USERS).findOne({
                //     _id: inbox.user_id
                // });

                // resultSendEmail = null;
                // resultSendSMS = null;

                if (oNotified) {
                    currLine++;

                    let oInbox = await db.collection(mongoCollections.INBOX).findOne({
                        _id: oNotified.inbox_id
                    });

                    if (oInbox) {
                        listEmail.push({user_id: oInbox.user_id, email: oInbox.email});
                        listSms.push({user_id: oInbox.user_id, cellphone: oInbox.cellphone});

                        let listRep = await db.collection(mongoCollections.REPRESENTATIVE).find({
                            inbox_id: ObjectId(oInbox._id)
                        }).toArray();

                        for (let rep of listRep) {
                            const found = listEmail.find((data) => data.email === rep.email);
                            const foundSMS = listSms.find((data) => data.cellphone === rep.cellphone);

                            if (!found) {
                                listEmail.push({
                                    user_id: rep.user_id,
                                    email: rep.email,
                                });
                            }

                            if (!foundSMS) {
                                listSms.push({
                                    user_id: rep.user_id,
                                    cellphone: rep.cellphone,
                                });
                            }
                        }
                    }

                    const dataUpdate = {
                        notified_at: new Date(),
                    };

                    cellphone = oNotified.cellphone;
                    notificationData.inbox_name = oNotified.inbox_name;
                    notificationData.organization_name = oNotified.organization_name;

                    for (let dataSend of listEmail) {
                        const resultSendEmail = await emailService.sendEmailNewNotification(notificationData, notificationData.urlNotification, dataSend.email);
                        await registerLog("email_sent", mongoCollections.NOTIFICATIONS, notify._id, null, dataSend.email, resultSendEmail, "recordatorio_notificaciones");
                    }

                    dataUpdate.count_send_email = oNotified.count_send_email + 1;

                    //send sms
                    if (dateFormat(notify.received_at, "dd/mm/yyyy") === dateFormat(dateCalculate, "dd/mm/yyyy")) {
                        for (let dataSend of listSms) {
                            const resultSendSMS = await smsService.sendSms(dataSend.cellphone, "ONPE\nDocumento: " + notify.expedient + "\nURL:" + notificationData.urlNotification);
                            await registerLog("sms_sent", mongoCollections.NOTIFICATIONS, notify._id, null, dataSend.cellphone, resultSendSMS, "recordatorio_notificaciones");
                        }

                        dataUpdate.count_send_sms = oNotified.count_send_sms + 1;
                    }

                    //update data temp
                    await db.collection(mongoCollections.NOTIFY_NOTIFICATIONS_TMP).updateOne({
                        _id: oNotified._id
                    }, {
                        $set: dataUpdate
                    });

                    totalSend++;
                    logger.info(`Send notification to: ${oNotified.doc_type}_${oNotified.doc} - countLine: ${currLine}`);
                } else {
                    currLine++;
                    let notification_full_name = "";
                    let notification_organization_name = "";

                    let oInbox = await db.collection(mongoCollections.INBOX).findOne({
                        _id: notify.inbox_id
                    });

                    listEmail.push({user_id: oInbox.user_id, email: oInbox.email});
                    listSms.push({user_id: oInbox.user_id, cellphone: oInbox.cellphone});

                    if (oInbox) {
                        let listRep = await db.collection(mongoCollections.REPRESENTATIVE).find({
                            inbox_id: ObjectId(oInbox._id)
                        }).toArray();

                        for (let rep of listRep) {
                            const found = listEmail.find((data) => data.email === rep.email);
                            const foundSMS = listSms.find((data) => data.cellphone === rep.cellphone);

                            if (!found) {
                                listEmail.push({
                                    user_id: rep.user_id,
                                    email: rep.email,
                                });
                            }

                            if (!foundSMS) {
                                listSms.push({
                                    user_id: rep.user_id,
                                    cellphone: rep.cellphone,
                                });
                            }
                        }
                    }

                    // cellphone = oInbox.cellphone;
                    // const userId = oInbox.user_id;

                    if (notify.inbox_doc_type === "dni" || notify.inbox_doc_type === "ce") {
                        notification_full_name = oInbox.full_name;
                    } else if (notify.inbox_doc_type === "ruc" || notify.inbox_doc_type === "pr") {
                        notification_organization_name = oInbox.organization_name;
                    }

                    const nowDate = new Date();

                    if (oInbox.email) {
                        for (let dataSend of listEmail) {
                            notificationData.inbox_name = notification_full_name;
                            notificationData.organization_name = notification_organization_name;
                            const resultSendEmail = await emailService.sendEmailNewNotification(notificationData, notificationData.urlNotification, dataSend.email);
                            await registerLog("email_sent", mongoCollections.NOTIFICATIONS, notify._id, null, dataSend.email, resultSendEmail, "recordatorio_notificaciones");
                        }

                        countSendEmail = countSendEmail + 1;
                    }

                    //send sms
                    if (dateFormat(notify.received_at, "dd/mm/yyyy") === dateFormat(dateCalculate, "dd/mm/yyyy")) {
                        for (let dataSend of listSms) {
                            const resultSendSMS = await smsService.sendSms(dataSend.cellphone, "ONPE\nDocumento: " + notify.expedient + "\nURL:" + notificationData.urlNotification);
                            await registerLog("sms_sent", mongoCollections.NOTIFICATIONS, notify._id, null, dataSend.cellphone, resultSendSMS, "recordatorio_notificaciones");
                        }

                        countSendSMS = countSendSMS + 1;
                    }

                    //insert data temp
                    await db.collection(mongoCollections.NOTIFY_NOTIFICATIONS_TMP).insertOne({
                        inbox_id: notify.inbox_id,
                        notification_id: notify._id,
                        doc_type: notify.inbox_doc_type,
                        doc: notify.inbox_doc,
                        inbox_name: notification_full_name,
                        organization_name: notification_organization_name,
                        is_notified: true,
                        email: oInbox.email,
                        cellphone: oInbox.cellphone,
                        count_send_email: countSendEmail,
                        count_send_sms: countSendSMS,
                        notified_at: nowDate,
                        register_at: nowDate
                    });

                    logger.info(`Send notification to: ${notify.inbox_doc_type}_${notify.inbox_doc}  - countLine: ${currLine}`);
                    totalSend++;
                }
            }

            skip = skip + limit;
        } while (count >= limit);

        logger.info('total users for notified:' + totalSend);
        logger.info('end notify users');
        return true;
    } catch (err) {
        logger.error(err);
    }

    return false;
}

const calcDate = async (date1) => {
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

const registerLog = async function (event, collection, idCollection, idUsuario, sent_to, status, motivo, idRepresentante = null) {
    const db = await mongodb.getDb();

    let event_history = {
        event: event,
        collection: collection,
        id: idCollection,
        idUsuario: idUsuario !== null ? idUsuario : null,
        idRepresentante: idRepresentante,
        sent_to: sent_to,
        status: status,
        motivo: motivo,
        date: new Date()
    }

    await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

}

module.exports = {run}

void async function () {
    //const countSend = process.argv[2];
    // console.log(countSend);
    await run();
    process.exit(0);
}();

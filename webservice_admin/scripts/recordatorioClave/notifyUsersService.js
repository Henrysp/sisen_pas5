/**
 * Created by Alexander Llacho
 */

const logger = require('./../../server/logger').logger;
const mongoCollections = require('../../common/mongoCollections');
const mongodb = require('./../../database/mongodb');
const emailService = require('./emailService');
const cryptoService = require('./cryptoService');
const utils = require('./../../common/utils');
const crypto = require("crypto");
const {ObjectId} = require("mongodb");
const appConstants = require("../../common/appConstants");
const dotenv = require('dotenv');
dotenv.config({path: appConstants.PATH_ENV});
const ttl_sleep = 1000 * 5 * 60;

const runPassword = async (countSend) => {
    await notifyPassword(countSend)
    return true;
}

const notifyPassword = async (countSend) => {
    logger.info('start notify');
    const db = await mongodb.getDb();
    let skip = 0;
    let limit = countSend;
    let count = 0;
    let currLine = 0;
    let totalSend = 0;

    try {
        let countNotify = await db.collection(mongoCollections.USERS).find({
            updated_password: false, profile: 'citizen'
        }).count();
        logger.info('total users for notify:' + countNotify);

        do {
            count = 0;
            let notifyUser = await db.collection(mongoCollections.USERS).find({
                updated_password: false, profile: 'citizen'
            }).skip(skip).limit(limit).toArray();

            for (let user of notifyUser) {
                count++;
                let validInbox = false;
                let oInbox = await db.collection(mongoCollections.INBOX).findOne({
                    user_id: ObjectId(user._id)
                });

                if (!oInbox) {
                    let oRep = await db.collection(mongoCollections.REPRESENTATIVE).findOne({
                        user_id: ObjectId(user._id)
                    });

                    if (oRep) {
                        oInbox = await db.collection(mongoCollections.INBOX).findOne({
                            _id: ObjectId(oRep.inbox_id)
                        });
                    }
                }

                if (oInbox) {
                    if (oInbox.create_user !== 'owner') {
                        let resultCalc = calcDate(new Date, oInbox.created_at);
                        if (resultCalc >= 1) {
                            validInbox = true;
                        }
                    } else {
                        if (oInbox.status === 'APROBADO') {
                            let resultCalc = calcDate(new Date, oInbox.evaluated_at);
                            if (resultCalc >= 1) {
                                validInbox = true;
                            }
                        }
                    }
                }

                if (!validInbox) {
                    continue;
                }

                let userNotify = await db.collection(mongoCollections.TABLE_NOTIFY_USERS_TMP).findOne({
                    doc_type: user.doc_type, doc: user.doc, $or: [{user_id: user._id}, {user_id: null}]
                });

                let existDataTmp = false;
                if (userNotify) {
                    existDataTmp = true;

                    if (userNotify.user_id) {
                        if (userNotify.user_id.toString() !== user._id.toString()) {
                            existDataTmp = false;
                        }
                    }
                }

                if (existDataTmp) {
                    currLine++;
                    const nowDate = new Date();
                    const dateNow = nowDate.getDate() + '/' + (nowDate.getMonth() + 1) + '/' + nowDate.getFullYear();
                    const dateDB = userNotify.notified_at.getDate() + '/' + (userNotify.notified_at.getMonth() + 1) + '/' + userNotify.notified_at.getFullYear();

                    if (dateNow === dateDB && userNotify.is_notified) {
                        continue;
                    }

                    const dataUpdate = {
                        notified_at: nowDate,
                        count_send: userNotify.count_send + 1
                    };

                    let resultCalc = calcDate(nowDate, userNotify.password_at);
                    let newPassword = cryptoService.decrypt(userNotify.password);

                    if (resultCalc >= 1) {
                        const resetPassword = crypto.randomBytes(5).toString('hex');
                        dataUpdate.password = cryptoService.encrypt(resetPassword);
                        dataUpdate.password_at = nowDate;
                        newPassword = resetPassword;
                    }

                    let name = `${user.name} ${user.lastname}`;
                    const resultSendEmail = await emailService.sendEmailNewUser(name, user.email, newPassword, user.doc, await getCountNotifications(user.doc_type, user.doc));
                    await registerLog("email_sent", mongoCollections.USERS, ObjectId(user._id), ObjectId(user._id), user.email, resultSendEmail, "recordatorio_clave");

                    //update data temp
                    await db.collection(mongoCollections.TABLE_NOTIFY_USERS_TMP).updateOne({
                        _id: userNotify._id
                    }, {
                        $set: dataUpdate
                    });

                    await updateUser(user, newPassword);
                    totalSend++;
                    logger.info(`Send notification to: ${user.doc_type}_${user.doc} - new password: ${(resultCalc >= 1)}  - countLine: ${currLine}`);
                } else {
                    currLine++;
                    const nowDate = new Date();
                    const newPassword = crypto.randomBytes(5).toString('hex');
                    let name = `${user.name} ${user.lastname}`;

                    if (user.email) {
                        const resultSendEmail = await emailService.sendEmailNewUser(name, user.email, newPassword, user.doc, await getCountNotifications(user.doc_type, user.doc));
                        await registerLog("email_sent", mongoCollections.USERS, ObjectId(user._id), ObjectId(user._id), user.email, resultSendEmail, "recordatorio_clave");
                    }

                    //insert data temp
                    await db.collection(mongoCollections.TABLE_NOTIFY_USERS_TMP).insertOne({
                        user_id: user._id,
                        doc_type: user.doc_type,
                        doc: user.doc,
                        password: cryptoService.encrypt(newPassword),
                        is_notified: true,
                        exist_email: !!(user.email),
                        count_send: 1,
                        password_at: nowDate,
                        notified_at: nowDate,
                        register_at: nowDate
                    });

                    await updateUser(user, newPassword);
                    logger.info(`Send notification to: ${user.doc_type}_${user.doc} - new password: ${true}  - countLine: ${currLine}`);
                    totalSend++;
                }
            }

            skip = skip + limit;

            await sleep(ttl_sleep);
            //await sleep(1000);
            console.log('Print after 10 min')
        } while (count >= limit);

        logger.info('total users for notified:' + totalSend);
        logger.info('end notify users');
        return true;
    } catch (err) {
        logger.error(err);
    }

    return false;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const getCountNotifications = async (docType, doc) => {
    const db = await mongodb.getDb();
    let countNotifications = 0;

    try {
        countNotifications = await db.collection(mongoCollections.NOTIFICATIONS).find({
            inbox_doc_type: docType, inbox_doc: doc, read_at: {$exists: false}
        }).count();

    } catch (err) {
        logger.error(err);
        return {success: false};
    }

    return countNotifications;
}

const updateUser = async (user, newPassword) => {
    const db = await mongodb.getDb();

    try {
        await db.collection(mongoCollections.USERS).updateOne({_id: user._id}, {
            $set: {
                updated_password: false, password: utils.passwordHash(newPassword)
            }
        });
    } catch (err) {
        logger.error(err);
        return {success: false};
    }

    return true;
}

function calcDate(date1, date2) {
    const diff = Math.floor(date1.getTime() - date2.getTime());
    const day = 1000 * 60 * 60 * 24;

    const days = Math.floor(diff / day);
    const months = Math.floor(days / 31);
    const years = Math.floor(months / 12);

    let message = date2.toDateString();
    message += " was "
    message += days + " days "
    message += months + " months "
    message += years + " years ago \n"

    // return message
    return months
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


module.exports = {runPassword}

void async function () {
    const countSend = Number(process.argv[2]);
    console.log(countSend);
    await runPassword(countSend);
    process.exit(0);
}();

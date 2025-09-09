/**
 * Created by Alexander Llacho
 */
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const errors = require('./../common/errors');
const utils = require('./../common/utils');
const mongoCollections = require('./../common/mongoCollections');
const appConstants = require('./../common/appConstants');
const crypto = require("crypto");
const emailService = require('./../services/emailService');
const historyService = require('../services/historyService');
const {ObjectId} = require("mongodb");

const updatePassword = async (docType, doc, profile, oldPassword, newPassword, id) => {
    try {
        const db = await mongodb.getDb();
        let name, email,rep,inbox;
        const filter = {
            doc_type: docType, doc: doc.toUpperCase(), profile: profile, _id: ObjectId(id),
            $or: [{status: appConstants.INBOX_STATUS_APROBADO}, {status: null}]
        };

        let user = await db.collection(mongoCollections.USERS).findOne(filter);

        if (user) {
            if (user.password !== utils.passwordHash(oldPassword)) {
                logger.info('user ' + doc + '/' + docType + '/' + profile + ' old password not equals');

                return {success: false, error: errors.UPDATE_PASSWORD_INCORRECT_OLD_PASSWORD};
            }

            if (user.password === utils.passwordHash(newPassword)) {
                logger.info('user ' + doc + '/' + docType + '/' + profile + ' old password and new password are the same');

                return {success: false, error: errors.UPDATE_PASSWORD_NEW_PASSWORD_NOT_EQUALS_OLD_PASSWORD};
            }

            if (user.password_old === utils.passwordHash(newPassword)) {
                logger.info('user ' + doc + '/' + docType + '/' + profile + ' field password_old and new password are the same');
                return {success: false, error: errors.UPDATE_PASSWORD_NEW_PASSWORD_NOT_EQUALS_OLD_PASSWORD};
            }

            let event_history = {
                event: 'update_password',
                collection: mongoCollections.USERS,
                id: user._id,
                date: new Date(),
                password: utils.passwordHash(oldPassword),
            }

            await db.collection(mongoCollections.USERS).update({_id: user._id}, {
                $set: {
                    updated_password: true,
                    password: utils.passwordHash(newPassword),
                    password_old: utils.passwordHash(oldPassword)
                }
            });

            logger.info('user ' + doc + '/' + docType + '/' + profile + '(' + user._id + ') success password update');

            await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

            logger.info('success insert in event_history');

            name = user.name && (user.lastname || user.second_lastname)? `${user.name} ${user.lastname || ''} ${user.second_lastname || ''}`.trim() : user.organization_name;
            email = user.email;

            if(user.doc_type === 'ruc' || user.doc_type === 'pr'){

                rep = await db.collection(mongoCollections.REPRESENTATIVE).findOne({user_id : ObjectId(id), enabled: true});
                inbox = await db.collection(mongoCollections.INBOX).findOne({_id : rep.inbox_id});

                const inboxEmail = inbox?.email || null;
                const cargo = user.orgPol === '1' ? rep?.position_name : '';

                if (rep){
                    name = rep.names && (rep.lastname || rep.second_lastname) ? `${rep.names} ${rep.lastname || ''} ${rep.second_lastname || ''}`.trim() : user.organization_name;
                    email = rep.email;
                }

                if (inboxEmail) {
                    //Correo a la casilla
                    const resultEmailInbox = await emailService.sendEmailNewPasswordConfirm(inbox.organization_name, inboxEmail, cargo);
                    await registerLog("email_sent", mongoCollections.INBOX, inbox._id, inbox._id, inboxEmail, resultEmailInbox, "confirm_update_password");

                    //Correo al representante o funcionario
                    if (email !== inboxEmail) {
                        const resultEmail = await emailService.sendEmailNewPasswordConfirm(name, email);
                        await registerLog("email_sent", mongoCollections.USERS, user._id, user._id, email, resultEmail, "confirm_update_password");
                    }
                }
            } else {
                const resultEmail = await emailService.sendEmailNewPasswordConfirm(name, email);
                await registerLog("email_sent", mongoCollections.USERS, user._id, user._id, email, resultEmail, "confirm_update_password");
            }

            return {success: true};

        } else {
            logger.info('user ' + doc + ', ' + docType + '/' + profile + ' user invalid');

            return {success: false, error: errors.INTERNAL_ERROR};
        }

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const recoverPassword = async (docType, doc, cargo) => {
    let data = [];
    let isSend = true;
    let name = '';
    let rep;
    // const delayInSeconds = 30;
    const delayInSeconds = parseInt(process.env.RESEND_DELAY_SECONDS, 10);

    try {
        const db = await mongodb.getDb();
        /*const newPassword = crypto.randomBytes(5).toString('hex');*/

        var today = new Date();
        today.setHours(today.getHours() + 1);

        if (cargo === undefined) {
            const filter = {
                doc_type: docType, doc: doc.toUpperCase(), profile: appConstants.PROFILE_CITIZEN,
                $or: [{status: appConstants.INBOX_STATUS_APROBADO}, {status: null}]
            };

            let user = await db.collection(mongoCollections.USERS).findOne(filter);

            if (user) {
                if (user.doc_type === 'dni' || user.doc_type === 'ce') {
                    name = user.name + ' ' + user.lastname + ' ' + user.second_lastname;
                }
                if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
                    name = user.organization_name;
                    rep = await db.collection(mongoCollections.REPRESENTATIVE).findOne({user_id: user._id, enabled: true, status: {$ne: "DESHABILITADO"}});

                    if (user.orgPol === '1') {
                        isSend = false;
                    }
                }

                if (isSend) {
                    const diffInSeconds = user.time_password_life ? (today.getTime() - user.time_password_life.getTime()) / 1000 : ((today.getTime())/1000);
                    const delay = diffInSeconds >= delayInSeconds;

                    if (delay){
                       await emailService.sendEmailValidPassword(name, user.email, user._id + '/' + user.doc);

                       if (rep && rep.email !== user.email){
                           name = `${rep.names} ${rep.lastname || ''} ${rep.second_lastname || ''}`;
                           await emailService.sendEmailValidPassword(name, rep.email, user._id + '/' + user.doc);
                       }
                        //await emailService.sendEmailNewPassword(name, user.email, newPassword);

                        /*await db.collection(mongoCollections.USERS).update({_id: user._id}, {
                            $set: {
                                updated_password: false,
                                password: utils.passwordHash(newPassword)
                            }
                        });*/
                        await db.collection(mongoCollections.USERS).updateOne({_id: user._id}, {
                            $set: {
                                time_password_life: today,
                                status_change_password: false
                            }
                        });
                        await historyService.saveHistory(appConstants.EVENT_HISTORY_VALID_PASSWORD, user._id);
                    }
                    return {success: true};
                }
            } else{
                logger.error('user ' + doc + '/' + docType + ' (citizen) not exist');
                return {success: true};
            }
        } else {
            let cursor = await db.collection(mongoCollections.REPRESENTATIVE).aggregate([
                {
                    $match: {
                        enabled: true,
                    }
                },
                {
                    $lookup: {
                        "from": "users",
                        "localField": "user_id",
                        "foreignField": "_id",
                        "as": "user"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        doc: 1,
                        doc_type: 1,
                        position: 1,
                        position_name: 1,
                        email: 1,
                        names:1,
                        lastname:1,
                        second_lastname:1,
                        'user._id': 1,
                        'user.doc_type': 1,
                        'user.doc': 1,
                        'user.name': 1,
                        'user.lastname': 1,
                        'user.email': 1,
                        'user.second_lastname': 1,
                        'user.organization_name': 1,
                        'user.profile': 1,
                        'user.password': 1,
                        'user.status': 1,
                        'user.updated_password': 1
                    }
                },
                {
                    $match: {
                        position: cargo,
                        'user.doc_type': docType,
                        'user.doc': doc.toUpperCase(),
                        'user.profile': appConstants.PROFILE_CITIZEN,
                        $or: [{'user.status': appConstants.INBOX_STATUS_APROBADO}, {'user.status': null}]
                    }
                }
            ]);

            for await (const item of cursor) {
                data.push(item);
            }

            if (data.length === 0 || data.length > 1) {
                logger.error('user ' + doc + '/' + docType + ' (citizen) not exist');
                return {success: true};
            }

            const user = data[0].user[0];

            // if (user.doc_type === 'dni' || user.doc_type === 'ce') {
            //     name = user.name + ' ' + user.lastname;
            // }
            // if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
            //     name = user.organization_name;
            // }
            name = data[0].names + ' ' + data[0].lastname + ' ' + data[0].second_lastname;

            if (data[0].position === '2') {
                await emailService.sendEmailValidPassword(name, data[0].email, user._id + '/'+ user.doc );
                //await emailService.sendEmailNewPassword(name, data[0].email, newPassword);

                if (user.email !== data[0].email){
                    name = `${user.organization_name || ''}`;
                    await emailService.sendEmailValidPassword(name, user.email, user._id + '/'+ user.doc );
                }
            } else {
                await emailService.sendEmailValidPassword(name, user.email, user._id + '/'+ user.doc );
                //await emailService.sendEmailNewPassword(name, user.email, newPassword);
            }

            /*await db.collection(mongoCollections.USERS).update({_id: user._id}, {
                $set: {
                    updated_password: false,
                    password: utils.passwordHash(newPassword)
                }
            });*/
            await db.collection(mongoCollections.USERS).update({_id: user._id}, {
                $set: {
                    time_password_life: today,
                    status_change_password: false
                }
            });

            await historyService.saveHistory(appConstants.EVENT_HISTORY_VALID_PASSWORD, user._id);

            return {success: true};
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: {message: 'El servicio no esta disponible, inténtelo de nuevo o más tarde'}};
    }

    logger.error('user ' + doc + ' / ' + docType + ' (citizen) not exist');
    return {success: true};
}

const validChangePassword = async (doc, id) => {
    try {
        const db = await mongodb.getDb();
        let email, name, nameInbox;
        let isSend = false;
        const filter = {
            _id: ObjectId(id),
            doc: doc.toUpperCase(), profile: appConstants.PROFILE_CITIZEN,
            $or: [{status: appConstants.INBOX_STATUS_APROBADO}, {status: null}]
        };

        let user = await db.collection(mongoCollections.USERS).findOne(filter);
        console.log(user);

        if (user) {
            if (user.status_change_password) {
                return {success: false, mensaje: "El enlace ya no es válido"};
            }
            var today = new Date();
            if (today > user.time_password_life) {
                return {success: false, mensaje: "El enlace ha expirado"};
            }

            const newPassword = crypto.randomBytes(5).toString('hex');

            if (user.doc_type === 'ruc' || user.doc_type === 'pr' ){
                let representative = await db.collection(mongoCollections.REPRESENTATIVE).findOne({
                    user_id: ObjectId(id),
                    enabled: true
                });
                if (representative.position === '1' || representative.position === '2') {
                    email = representative.email
                    name = representative.names + ' ' + representative.lastname + ' ' + representative.second_lastname
                    if (email !== user.email) {
                        isSend = true;
                        nameInbox = user.organization_name;
                    }
                }else{
                    email = user.email
                    name = user.name && (user.lastname || user.second_lastname)? `${user.name} ${user.lastname || ''} ${user.second_lastname || ''}`.trim() : user.organization_name;
                }
            } else{
                email = user.email
                name = `${user.name} ${user.lastname || ''} ${user.second_lastname || ''}`;
            }

            const resultEmail = await emailService.sendEmailNewPassword(name, email, newPassword);
            await registerLog("email_sent", mongoCollections.USERS, user._id, user._id, email, resultEmail, "send_new_password");

            // Segundo correo en caso de no coincidir email
            isSend ? Promise.all([emailService.sendEmailNewPassword(nameInbox, user.email, newPassword)]).then((values) => {
                registerLog("email_sent", mongoCollections.USERS, user._id, user._id, user.email, values[0], "send_new_password");
            }) : null;

            await db.collection(mongoCollections.USERS).update({_id: user._id}, {
                $set: {
                    updated_password: false,
                    password: utils.passwordHash(newPassword),
                    status_change_password: true
                }
            });

            await historyService.saveHistory(appConstants.EVENT_HISTORY_NEW_PASSWORD, user._id);
        }

        return {success: true};
    } catch (err) {
        logger.error(err);
        return {success: false, error: {message: 'El servicio no esta disponible, inténtelo de nuevo o más tarde'}};
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

module.exports = {validChangePassword, updatePassword, recoverPassword};

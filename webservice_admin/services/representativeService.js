const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const mongoCollections = require('./../common/mongoCollections');
const registerLogService = require('./../services/registerLogService');
const {ObjectId, ObjectID} = require("mongodb");
const appConstants = require("../common/appConstants");
const utils = require("../common/utils");
const crypto = require("crypto");
const emailService = require("./emailService");
const smsService = require("./smsService");

const findByInboxId = async (inboxId) => {

    try {
        const db = await mongodb.getDb();

        const listRep = await db.collection(mongoCollections.REPRESENTATIVE)
            .find({inbox_id: ObjectId(inboxId), status: { $ne: 'DESHABILITADO'} })
            .sort({created_at: 1})
            .toArray();

        if (!listRep) {
            return {success: false};
        }

        return {success: true, data: listRep};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const findByUserId = async (userId, enabled) => {

    try {
        const db = await mongodb.getDb();

        const oRep = await db.collection(mongoCollections.REPRESENTATIVE).findOne({
            user_id: ObjectId(userId),
            enabled: enabled
        }, {
            projection: {
                _id: 1,
                user_id: 1,
                inbox_id: 1,
                doc_type: 1,
                doc: 1,
                names: 1,
                lastname: 1,
                asientoRegistralRep: 1,
                second_lastname: 1,
                cellphone: 1,
                email: 1,
                ubigeo: 1,
                position: 1,
                position_name: 1,
                file_document: 1,
                file_document1: 1,
                file_document2: 1,
                file_photo: 1,
                file_box1: 1,
                file_box2: 1,
                address: 1,
                document_type_attachment: 1,
                document_name_attachment: 1,
                phone: 1,
                isAlternate:1
            }
        });

        if (!oRep) {
            return {success: false};
        }

        return {success: true, data: oRep};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const findAllByUserId = async (userId, enabled) => {
    try {
        const db = await mongodb.getDb();

        const lstRep = await db.collection(mongoCollections.REPRESENTATIVE).find({
            user_id: ObjectId(userId),
            enabled: enabled
        }, {
            projection: {
                _id: 1,
                user_id: 1,
                inbox_id: 1,
                doc_type: 1,
                doc: 1,
                names: 1,
                lastname: 1,
                asientoRegistralRep: 1,
                second_lastname: 1,
                cellphone: 1,
                email: 1,
                ubigeo: 1,
                position: 1,
                position_name: 1,
                file_document: 1,
                file_document1: 1,
                file_document2: 1,
                file_photo: 1,
                file_box1: 1,
                file_box2: 1,
                address: 1,
                document_type_attachment: 1,
                document_name_attachment: 1,
                phone: 1,
            }
        }).toArray();

        if (lstRep.length < 1) {
            return {success: false};
        }

        return {success: true, data: lstRep};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const findByUsersId = async (userId) => {

    try {
        const db = await mongodb.getDb();

        const oRep = await db.collection(mongoCollections.REPRESENTATIVE)
            .find({
                user_id: ObjectId(userId),
                position: {$nin: ["1", "2", ""]}
            })
            .project({
                _id: 1,
                user_id: 1,
                inbox_id: 1,
                doc_type: 1,
                doc: 1,
                names: 1,
                lastname: 1,
                asientoRegistralRep: 1,
                second_lastname: 1,
                cellphone: 1,
                email: 1,
                ubigeo: 1,
                position: 1,
                position_name: 1,
                file_document: 1,
                file_document1: 1,
                file_document2: 1,
                file_photo: 1,
                file_box1: 1,
                file_box2: 1,
                address: 1,
                document_type_attachment: 1,
                document_name_attachment: 1,
                phone: 1,
            });

        let data = [];
        for await (const item of oRep) {
            if (item.doc_type) {
                data.push(item);
            }
        }

        if (!data) {
            return {success: false};
        }

        return {success: true, data: data};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const save = async (data, listFile, sessionUser, isCreate) => {
    let user = {};

    try {
        const db = await mongodb.getDb();
        const alterno = data.alterno ? (data.alterno === "true" || data.alterno === true) : null;
        let createdAt = new Date();
        let oInbox;
        let motivoEnvio = "aprobacion_registro_interno";
        const evaluator_names = sessionUser.name + ' ' + sessionUser.lastname + ' ' + (sessionUser.second_lastname !== undefined ? sessionUser.second_lastname : '');

        const newData = {
            doc_type: data.docType,
            doc: data.doc,
            names: data.names,
            lastname: data.lastname,
            second_lastname: data.second_lastname,
            email: data.email,
            cellphone: data.cellphone,
            ubigeo: data.ubigeo,
            address: data.address,
            phone: data.phone,
            position: data.position,
            position_name: data.positionName,
            document_type_attachment: data.documentTypeAttachment ? data.documentTypeAttachment : null,
            document_name_attachment: data.documentNameAttachment ? data.documentNameAttachment: null,
            file_document: listFile,
            file_photo: null,
            enabled: true,
            created_at: createdAt,
            date_begin: createdAt,
            user_id: data.user_id,
            inbox_id: data.inbox_id,
            evaluator_user_id: ObjectID(sessionUser.id),
            evaluator_user_names: evaluator_names.trim(),
            evaluated_at: createdAt,
            ...(alterno !== null && { isAlternate: alterno }),
            ...(data.asientoRegistralRep && { asientoRegistralRep: data.asientoRegistralRep })
        };

        if (!isCreate) {
            oInbox = await db.collection(mongoCollections.INBOX).findOne({
                user_id: ObjectId(data.userId)
            });

            if (!oInbox) {
                return {success: false};
            }

            const users = await db.collection(mongoCollections.USERS).find({_id: ObjectId(data.userId)}).toArray();
            if (users.length === 1) {
                user = users[0];
            }

            if (user) {
                newData.user_id = ObjectId(data.userId);
                newData.inbox_id = oInbox._id;
            }

            const listRep = await db.collection(mongoCollections.REPRESENTATIVE).find({
                user_id: newData.user_id,
                inbox_id: newData.inbox_id
            }).toArray();

            for (let rep of listRep) {
                if (!rep.date_end) {
                    rep.date_end = createdAt;
                }

                rep.enabled = false;
                rep.status = 'DESHABILITADO';
                rep.disabled_reason = 'Se cambio de representante';

                await db.collection(mongoCollections.REPRESENTATIVE).updateOne({_id: rep._id}, {
                    $set: rep
                });
            }
            //     Nuevas credenciales
            motivoEnvio = "nuevo_representante";

            const password = crypto.randomBytes(5).toString('hex');
            let newDataUser = {
                password: utils.passwordHash(password),
                password_old: utils.passwordHash(password),
                updated_at: createdAt,
                updated_password: false,
                updated_user: evaluator_names,
            };

            await db.collection(mongoCollections.USERS).updateOne(user, {$set: newDataUser});

            logger.info('success update data in users');

            let nameSendToEmail = `${newData.names} ${newData.lastname} ${newData.second_lastname}`;

            Promise.all([
                emailService.sendEmailNewUserCitizen(nameSendToEmail, newData.email, user.orgPol === '1' ? newData.position_name : '', password, user.doc),
                smsService.sendSms(newData.cellphone, appConstants.MESSAGE_CREATE_INBOX),]
            ).then((values) => {
                registerLogService.registerLog("email_sent", mongoCollections.INBOX, newData.inbox_id, newData.user_id, newData.email, values[0], motivoEnvio, null, values[0] ? null : utils.passwordHash(password));
                registerLogService.registerLog("sms_sent", mongoCollections.INBOX, newData.inbox_id, newData.user_id, newData.cellphone, values[1], motivoEnvio);
            });
            nameSendToEmail = `${oInbox.organization_name}`
            if (oInbox.cellphone !== newData.cellphone) {
                Promise.all([smsService.sendSms(oInbox.cellphone, appConstants.MESSAGE_CREATE_INBOX),]).then((values) => {
                    registerLogService.registerLog("sms_sent", mongoCollections.INBOX, oInbox._id, newData.user_id, oInbox.cellphone, values[0], motivoEnvio, null);
                });
            }

            if (oInbox.email !== newData.email) {
                await Promise.all([emailService.sendEmailNewUserCitizen(nameSendToEmail, oInbox.email, user.orgPol === '1' ? newData.position_name : '', password, oInbox.doc),]).then(async (values) => {
                    await registerLogService.registerLog("email_sent", mongoCollections.INBOX, newData.inbox_id, newData.user_id, oInbox.email, values[0], motivoEnvio, null, values[0] ? null : utils.passwordHash(password));
                });
            }
        }

        let result = await db.collection(mongoCollections.REPRESENTATIVE).insertOne(newData);
        //register log data contact
        await registerLogService.registerContactHistory(newData, 'email', evaluator_names, createdAt, listFile);
        await registerLogService.registerContactHistory(newData, 'cellphone', evaluator_names, createdAt, listFile);

        logger.info('success insert history contact');

        return {success: true, result: result};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const saveOfficial = async (data, attachments, sessionUser) => {
    let user = {};

    try {
        const db = await mongodb.getDb();

        let createdAt = new Date();
        const evaluator_names = sessionUser.name + ' ' + sessionUser.lastname + ' ' + (sessionUser.second_lastname !== undefined ? sessionUser.second_lastname : '');

        const newData = {
            doc_type: data.docType,
            doc: data.doc,
            names: data.names,
            lastname: data.lastname,
            second_lastname: data.second_lastname,
            email: data.email,
            cellphone: data.cellphone,
            position: data.position,
            position_name: data.positionName,
            enabled: true,
            created_at: createdAt,
            date_begin: createdAt,
            user_id: null,
            inbox_id: null,
            evaluator_user_id: ObjectID(sessionUser.id),
            evaluator_user_names: evaluator_names.trim(),
            evaluated_at: createdAt,
            file_document: attachments
        };

        const oInbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectId(data.userId)
        });

        if (!oInbox) {
            return {success: false};
        }

        newData.inbox_id = oInbox._id;

        const users = await db.collection(mongoCollections.USERS).find({_id: ObjectId(data.userId)}).toArray();
        if (users.length === 1) {
            user = users[0];
        }

        const listRep = await db.collection(mongoCollections.REPRESENTATIVE).find({
            inbox_id: newData.inbox_id,
            enabled: true
        }).toArray();

        for (let rep of listRep) {
            if (rep.position === newData.position) {
                // Dar de baja al Representante con el cargo
                await db.collection(mongoCollections.REPRESENTATIVE).updateOne({_id: rep._id}, {
                    $set: {
                        enabled: false,
                        update_user: evaluator_names.trim(),
                        update_date: createdAt,
                        date_end: createdAt,
                        status: 'DESHABILITADO',
                        disabled_reason: 'Se cambio de funcionario'
                    }
                });
                // Deshabilitar el usuario asignado al funcionario
                await db.collection(mongoCollections.USERS).updateOne({_id: rep.user_id}, {
                    $set: {
                        update_user: evaluator_names.trim(),
                        update_date: createdAt,
                        status: 'DESHABILITADO'
                    }
                });
            }
        }

        const password = crypto.randomBytes(5).toString('hex');
        let newUser = {
            doc_type: user.doc_type,
            doc: user.doc,
            profile: appConstants.PROFILE_CITIZEN,
            password: utils.passwordHash(password),
            password_old: utils.passwordHash(password),
            name: newData.names,
            lastname: newData.lastname,
            second_lastname: newData.second_lastname,
            email: newData.email,
            cellphone: newData.cellphone,
            organization_name: user.organization_name,
            register_user_id: sessionUser.id,
            created_at: createdAt,
            updated_password: false,
            create_user: evaluator_names,
            orgPol: '1',
            status: 'APROBADO'
        };

        let _newUser = await db.collection(mongoCollections.USERS).insertOne(newUser);
        logger.info('success insert in users');

        newData.user_id = _newUser.insertedId;
        let result = await db.collection(mongoCollections.REPRESENTATIVE).insertOne(newData);

        newData.representative_id = _newUser.insertedId;

        //register log data contact
        await registerLogService.registerContactHistory(newData, 'email', evaluator_names, createdAt, attachments);
        await registerLogService.registerContactHistory(newData, 'cellphone', evaluator_names, createdAt, attachments);
        logger.info('success insert history contact');

        const nameSendToEmail = `${newData.names} ${newData.lastname} ${newData.second_lastname}`;

        Promise.all([
            emailService.sendEmailNewUserCitizen(nameSendToEmail, newData.email, newData.position_name, password, user.doc),
            smsService.sendSms(newData.cellphone, appConstants.MESSAGE_CREATE_INBOX)]
        ).then((values) => {
            let motivoEnvio = "nuevo_funcionario"
            registerLogService.registerLog("email_sent", mongoCollections.INBOX, newData.inbox_id, newData.user_id, newData.email, values[0], motivoEnvio, null, values[0] ? null : utils.passwordHash(password));
            registerLogService.registerLog("sms_sent", mongoCollections.INBOX, newData.inbox_id, newData.user_id, newData.cellphone, values[1], motivoEnvio, null, values[1] ? null : utils.passwordHash(password));
        });

        return {success: true};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const update = async (data, userLogged, attachment) => {
    const db = await mongodb.getDb();
    const updateAt = new Date();

    try {
        const oRep = await db.collection(mongoCollections.REPRESENTATIVE).findOne({
            _id: ObjectId(data.id)
        });

        if (!oRep) {
            return {success: false};
        }

        const result = await db.collection(mongoCollections.REPRESENTATIVE).updateOne({_id: ObjectId(data.id)}, {
            $set: {
                email: data.email,
                phone: data.phone,
                cellphone: data.cellphone,
                address: data.address,
                ubigeo: data.ubigeo,
                position: data.position,
                position_name: data.positionName,
                updated_at: updateAt,
            }
        });

        if (result.modifiedCount === 1) {
            //register log data contact
            data.user_id = oRep.user_id;
            data.inbox_id = oRep.inbox_id;
            data.representative_id = ObjectId(oRep._id),
            data.doc = oRep.doc;
            data.doc_type = oRep.doc_type;

            if (oRep.email !== data.email) {
                await registerLogService.registerContactHistory(data, 'email', userLogged, updateAt, attachment);
            }

            if (oRep.cellphone !== data.cellphone) {
                await registerLogService.registerContactHistory(data, 'cellphone', userLogged, updateAt, attachment);
            }

            return {success: true};
        }
    } catch (err) {
        logger.error(err);
    }

    return {success: false};
}

const updateApprove = async (userId, userLogged, status) => {
    const db = await mongodb.getDb();
    const updatedAt = new Date();

    try {
        const representative = await db.collection(mongoCollections.REPRESENTATIVE).findOne({user_id: ObjectId(userId)});
        const inboxId = representative.inbox_id;

        const evaluatorNames = userLogged.name + ' ' + userLogged.lastname + ' ' + (userLogged.second_lastname !== undefined ? userLogged.second_lastname : '');

        const resultUpdateInbox = await db.collection(mongoCollections.REPRESENTATIVE).updateOne({user_id: ObjectId(userId)}, {
            $set: {
                enabled: status === 'APROBADO',
                date_begin: updatedAt,
                updated_at: updatedAt,
                evaluator_user_id: ObjectId(userLogged.id),
                evaluator_user_names: evaluatorNames.trim(),
                evaluated_at: updatedAt
            }
        });

        const resultUpdateInboxOP = await db.collection(mongoCollections.REPRESENTATIVE).updateMany({inbox_id: inboxId}, {
            $set: {
                date_begin: updatedAt,
                updated_at: updatedAt,
                evaluator_user_id: ObjectId(userLogged.id),
                evaluator_user_names: evaluatorNames.trim(),
                evaluated_at: updatedAt
            }
        });

        return {success: true};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

//Para otros funcionarios
async function findByInboxIdAndEnabledTrue(inboxId) {
    try {
        const db = await mongodb.getDb();

        const listRep = await db.collection(mongoCollections.REPRESENTATIVE)
            .find({inbox_id: ObjectId(inboxId), position: {$nin: ['1', '2']}, enabled: true})
            .sort({position: 1})
            .toArray();

        if (!listRep) {
            return {success: false};
        }

        return {success: true, data: listRep};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const listOfficials = async (userId) => {
    try {
        const db = await mongodb.getDb();

        const oInbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectId(userId)
        });

        if (!oInbox) {
            return {success: false};
        }

        const listRep = await db.collection(mongoCollections.REPRESENTATIVE).find({
            inbox_id: oInbox._id,
            enabled: true
        }).toArray();

        const cargos = ['3', '4', '5'];
        const officials = listRep.filter(o => {
            return cargos.includes(o.position) && o.enabled === true;
        });

        return {
            success: true,
            officials: officials
        };
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

module.exports = {
    findByInboxId,
    findByUserId,
    findAllByUserId,
    findByUsersId,
    save,
    update,
    updateApprove,
    findByInboxIdAndEnabledTrue,
    saveOfficial,
    listOfficials
};

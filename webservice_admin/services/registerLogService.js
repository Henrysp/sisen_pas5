/**
 * Created by Alexander Llacho
 */
const logger = require('./../server/logger').logger;
const mongodb = require("../database/mongodb");
const mongoCollections = require("../common/mongoCollections");
const moment = require("moment/moment");
const {ObjectId} = require("mongodb");

const registerLog = async function (event, collection, idCollection, idUsuario, sent_to, status, motivo, idRepresentante = null, passwordEncrypt = null) {
    let dateRegister = new Date()
    let update;

    try {
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
            date: dateRegister,
        }

        if (collection === 'inbox' && event === 'email_sent') event_history.password = passwordEncrypt;

        if (collection && idCollection) {
            let filter = {
                _id: idCollection
            }

            if (event === "email_sent") {
                if (idRepresentante !== null) {
                    update = {"email_sent_at_rep": dateRegister, "email_sent_status_rep": status}
                } else {
                    update = {"email_sent_at": dateRegister, "email_sent_status": status}
                }

            } else if (event === "sms_sent") {
                if (idRepresentante !== null) {
                    update = {"sms_sent_at_rep": dateRegister, "sms_sent_status_rep": status}
                } else {
                    update = {"sms_sent_at": dateRegister, "sms_sent_status": status}
                }
            }

            await db.collection(collection).updateOne(filter, {$set: update});
        }

        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);
        return {success: true, message: 'Log registrado'};
    } catch (err) {
        logger.error(err);
        return {success: false, error: err};
    }
}

const registerContactHistory = async (data, type, creatorUserName, updateDate, attachments = null) => {
    try {
        const db = await mongodb.getDb();

        const dataInsert = {
            user_id: data.user_id,
            inbox_id: data.inbox_id,
            representative_id: data.representative_id,
            doc_type: data.doc_type,
            doc: data.doc,
            contact: type === 'email' ? data.email : data.cellphone,
            type: type,
            updated_at: updateDate,
            updated_user: creatorUserName,
            ...(attachments ? { attachments } : {})
        }

        await db.collection(mongoCollections.CONTACT_HISTORY).insertOne(dataInsert);

        return {success: true, message: 'Histórico registrado'};
    } catch (err) {
        logger.error(err);
        return {success: false, error: err};
    }
}
const registerUserHistory = async (id, data, usuarioRegistro, usuario) => {
    try {
        const db = await mongodb.getDb();
        if (data[0].length === 2){
            for (const [key, Value] of data) {
                const changes =[]
                changes.push(Value.estado ? 'Se creo usuario, perfil habilitado' : 'Se creo usuario, perfil no habilitado');
                const dataInsert = {
                    user_id: ObjectId(id),
                    updated_user: usuarioRegistro,
                    updated_user_id: ObjectId(usuario),
                    profile: key,
                    event: 'create_user',
                    value: Value,
                    date: new Date(),
                    changes: changes
                }
                await db.collection(mongoCollections.USER_HISTORY).insertOne(dataInsert);
            }
        } else {
            for (const [key, oldValue, newValue, event] of data) {
                const changes = [];
                let evento,value;
                switch (event) {
                    case 1:
                        evento = 'create_user'
                        value = newValue
                        break;
                    case 2:
                        evento = 'edit_user'
                        value = newValue
                        break;
                    case 3:
                        evento = 'disable_user'
                        value = ''
                        break;
                    case 4:
                        evento = 'enable_user'
                        value = newValue
                        break;
                }

                if (typeof oldValue !== "string" && oldValue.estado !== newValue.estado) {
                    changes.push(oldValue.estado ? 'Se deshabilitó perfil' : 'Se habilitó perfil');
                } else {
                    if (typeof oldValue === "string") {changes.push(oldValue);}
                    if (event === 2){
                        if (oldValue.fechaIni && oldValue.fechaIni.getTime() !== newValue.fechaIni.getTime()) {
                            changes.push('Cambio de Fecha de Inicio');
                        }
                        if (detectarCambioFechaFin(oldValue, newValue)) {
                            changes.push('Cambio de Fecha de Fin');
                        }
                    }
                }
                const dataInsert = {
                    user_id: ObjectId(id),
                    updated_user: usuarioRegistro,
                    updated_user_id: ObjectId(usuario),
                    value: value,
                    profile: key,
                    event: evento,
                    date: new Date(),
                    changes: changes
                }

                await db.collection(mongoCollections.USER_HISTORY).insertOne(dataInsert);
            }
        }
        return {success: true, message: 'Histórico de usuario registrado'};
    } catch (err) {
        logger.error(err);
        return {success: false, error: err};
    }
}
function detectarCambioFechaFin(oldValue, newValue) {
    const old = oldValue.fechaFin;
    const nuevo = newValue.fechaFin;

    if (old === nuevo) return false;

    if (old instanceof Date && nuevo instanceof Date) {
        return old.getTime() !== nuevo.getTime();
    }
    return true;
}

const findAllContactHistory = async (inboxId) => {
    const response = {
        email: [],
        cellphone: [],
    }

    try {
        const db = await mongodb.getDb();

        const filter = {
            inbox_id: inboxId,
        }

        const results = await db.collection(mongoCollections.CONTACT_HISTORY).find(filter).sort({update_at: -1}).toArray();

        for (const data of results) {
            data.updated_at = moment(data.updated_at).format("DD/MM/YYYY HH:mm:ss");

            if (data.type === 'email') {
                response.email.push(data);
            }
            if (data.type === 'cellphone') {
                response.cellphone.push(data);
            }
        }
    } catch (err) {
        logger.error(err);
    }

    return response;
}

const findAllRepresentativeHistory = async (inboxId) => {
    const positionMap = {
        '1': 'Rep_Legal',
        '2': 'Pers_Legal_OP',
        '3': 'Tesorero_OP',
        '4': 'Rep_Legal_OP',
        '5': 'Presidente_OP',
        '6': 'PresidenteOEC_OP'
    };

    const response = {
        Rep_Legal: [],
        Pers_Legal_OP: [],
        Tesorero_OP: [],
        Rep_Legal_OP: [],
        Presidente_OP: [],
        PresidenteOEC_OP: []
    };

    const formatDate = (date) => (date ? moment(date).format("DD/MM/YYYY HH:mm:ss") : date);

    try {
        const db = await mongodb.getDb();
        const filter = { inbox_id: inboxId };

        const results = await db.collection(mongoCollections.REPRESENTATIVE)
            .find(filter)
            .sort({ created_at: 1 })
            .toArray();

        for (const data of results) {
            data.created_at = formatDate(data.created_at);
            data.date_begin = formatDate(data.date_begin);
            data.date_end = formatDate(data.date_end);
            data.evaluated_at = formatDate(data.evaluated_at);

            const positionKey = positionMap[data.position];
            if (positionKey) {
                response[positionKey].push(data);
            }
        }
    } catch (err) {
        logger.error(err);
    }

    return response;
}

const findEvent_history = async (Id,type) => {
    const response = {
        SMS_SENT: { PJ: [],Rep_Legal: [], Pers_Legal_OP: [], Tesorero_OP: [], Rep_Legal_OP: [], Presidente_OP: [], PresidenteOEC_OP: []},
        EMAIL_SENT: { PJ: [], Rep_Legal: [], Pers_Legal_OP: [], Tesorero_OP: [], Rep_Legal_OP: [], Presidente_OP: [], PresidenteOEC_OP: []},
    }
    const positionMap = {
        '1': 'Rep_Legal',
        '2': 'Pers_Legal_OP',
        '3': 'Tesorero_OP',
        '4': 'Rep_Legal_OP',
        '5': 'Presidente_OP',
        '6': 'PresidenteOEC_OP'
    };
    let origen;

    try {
        const db = await mongodb.getDb();

        const filter = {
            id: Id,
            ...(type === 1 && {
                motivo: {
                    $in: ['aprobacion_casilla', 'aprobacion_registro_interno', 'desaprobacion_casilla', 'reenvio_aprobacion_casilla', 'reenvio_desaprobacion_casilla']
                },
                collection: 'inbox'
            }),
            ...(type === 2 && {
                motivo: {
                    $in: ['envio_notificacion', 'reenvio_notificacion']
                },
                collection: 'notifications'
            })
        };

        const results = await db.collection(mongoCollections.EVENT_HISTORY).find(filter).sort({date: -1}).toArray();

        for (const data of results) {
            if (data.date) {
                data.date = moment(data.date).format("DD/MM/YYYY HH:mm:ss.SSS");
            }
            const projection = {
                position: 1,
                position_name: 1,
                email: 1,
                cellphone: 1,
                doc: 1,
                doc_type:  1,
                _id: 1,
            };

            let RepresentativeFilter = {};
            let Inbox, Notification = {};
            let Notificationfilter = { _id: data.id};

            if (type === 1) {
                RepresentativeFilter = {$or: [{user_id: data.idUsuario}, {_id: data.idRepresentante}, {user_id: data.idRepresentante}]};
                Inbox = await db.collection(mongoCollections.INBOX).findOne(data.id);
                origen = Inbox
            } else if (type === 2) {
                RepresentativeFilter._id = data.idRepresentante;
                Notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(Notificationfilter);
                Inbox = await db.collection(mongoCollections.INBOX).findOne(Notification.inbox_id);
                origen = Notification
            }
            // Evento de la PJ
            if (Inbox.user_id.toString() === data.idUsuario?.toString() && !data.idRepresentante ) {
                if (data.event === 'sms_sent' && response.SMS_SENT.PJ.length < 1) {
                    response.SMS_SENT.PJ.push({...data, data});
                } else if (data.event === 'email_sent' && response.EMAIL_SENT.PJ.length < 1) {
                    response.EMAIL_SENT.PJ.push({...data, data});
                }
            }

            const RepresentativePositionArray = await db.collection(mongoCollections.REPRESENTATIVE).find(RepresentativeFilter).sort({created_at: -1}).project(projection).toArray();
            for (const RepresentativePosition of RepresentativePositionArray) {
                const position = positionMap[RepresentativePosition.position];

                if (position && origen.officials?.[RepresentativePosition.position]) {
                    const eventType = data.event === 'sms_sent' ? 'SMS_SENT' : 'EMAIL_SENT';

                    if (data.event === 'sms_sent' || data.event === 'email_sent') {
                        response[eventType][position].push({...data, RepresentativePosition});
                    }
                }
            }
        }
        for (const data of results) {
            let Inbox, Notification = {};
            let Notificationfilter = { _id: data.id};

            function getEmailAndCellphoneForPosition(position) {
                const representative = ExistRepresentativePosition.find(rep => rep.position === position);
                if (representative) {
                    return { email: representative.email, cellphone: representative.cellphone };
                } else {
                    return null;
                }
            }
            let listContacts = await db.collection(mongoCollections.CONTACT_HISTORY).find({user_id: data.idUsuario}, {projection: {contact: 1, type: 1, representative_id: 1}}).toArray();
            Notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(Notificationfilter);
            if (type ===2) {
                Inbox = await db.collection(mongoCollections.INBOX).findOne(Notification.inbox_id);
                origen = Notification;
            }else{
                Inbox = await db.collection(mongoCollections.INBOX).findOne(data.id);
                origen = Inbox;
            }
            const ExistRepresentativePosition = await db.collection(mongoCollections.REPRESENTATIVE).
            find({inbox_id: Inbox._id/*, status: {$ne: 'DESHABILITADO'}*/}).sort({created_at: -1}).toArray();

            const positionsToCheck = ['2', '3', '4', '5', '6'];

            const processPositionCommunication = (position, positionName) => {
                const hasPosition = ExistRepresentativePosition.some(rep => rep.position === position);
                const positionInfo = getEmailAndCellphoneForPosition(position);

                if (!hasPosition || (response.EMAIL_SENT[positionName].length > 0 && response.SMS_SENT[positionName].length > 0)) {
                    return;
                }

                const official = origen.officials?.[parseInt(position)];
                if (!official) return;

                if (response.EMAIL_SENT[positionName].length < 1) {
                    const isDirectMatch = data.sent_to === positionInfo.email;
                    const isContactMatch = listContacts.some(
                        item => item.contact === data.sent_to &&
                            item.type === 'email' &&
                            item.representative_id?.toString() === official.id?.toString()
                    );

                    if (isDirectMatch || isContactMatch) {
                        response.EMAIL_SENT[positionName].push(data);
                    }
                }

                if (response.SMS_SENT[positionName].length < 1) {
                    const isDirectMatch = data.sent_to === positionInfo.cellphone;
                    const isContactMatch = listContacts.some(
                        item => item.contact === data.sent_to &&
                            item.type === 'cellphone' &&
                            item.representative_id?.toString() === official.id.toString()
                    );

                    if (isDirectMatch || isContactMatch) {
                        response.SMS_SENT[positionName].push(data);
                    }
                }
            };

            const positionNameMap = {
                '2': 'Pers_Legal_OP',
                '3': 'Tesorero_OP',
                '4': 'Rep_Legal_OP',
                '5': 'Presidente_OP',
                '6': 'PresidenteOEC_OP'
            };

            positionsToCheck.forEach(position => {
                const positionName = positionNameMap[position];
                processPositionCommunication(position, positionName);
            });
        }
    } catch (err) {
        logger.error(err);
    }
    return response;
}

module.exports = {
    registerLog,
    registerContactHistory,
    findAllContactHistory,
    findAllRepresentativeHistory,
    findEvent_history,
    registerUserHistory
}

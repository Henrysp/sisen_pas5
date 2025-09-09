/**
 * Created by Angel Quispe
 */

const mongodb = require('./../database/mongodb');
const ObjectId = require('mongodb').ObjectId;
const logger = require('./../server/logger').logger;
const errors = require('./../common/errors');
const utils = require('./../common/utils');
const appConstants = require('./../common/appConstants');
const mongoCollections = require('./../common/mongoCollections');
const invokerService = require('./../services/invokerService');
const emailService = require('./../services/emailService');
const smsService = require('./../services/smsService');
const userService = require('./../services/userService');
const inboxService = require('./../services/inboxService');
const representativeService = require('./../services/representativeService');
const registerLogService = require('./../services/registerLogService');
const acuseNotified = require('./../templates/acuse_notified');
const acuseNotifiedAgente = require('./../templates/acuse_notified_agente');
const {redisWriter, redisReader} = require('./../database/redis');
const pdf = require('html-pdf');
const fs = require('fs');
const dateFormat = require('dateformat');
const hashFiles = require('hash-files');
const agentClient = require('./agentClient');
const randomstring = require("randomstring");
const shortio = require("short.io");
const moment = require("moment");
const {findEvent_history} = require("./registerLogService");
const {sendStatus} = require("express/lib/response");
const path_upload = process.env.PATH_UPLOAD;
const path_upload_tmp = process.env.PATH_UPLOAD_TMP;
const base_url = process.env.BASE_URL;
ExcelJS = require('exceljs');

const FILL_HEADER = {
    type: "pattern",
    pattern: "solid",
    bgColor: {argb: "1d357200"},
};
const ALIGMENT_CENTER = {vertical: "middle", horizontal: "center"};
const ALIGMENT_LEFT = {vertical: "middle", horizontal: "left"};
const ALIGMENT_JUNP_TEXT = {wrapText: true, vertical: 'middle', horizontal: 'center'};

const FONT_SHEET_HEADER = {
    name: 'Calibri',
    size: 18,
    bold: true,
    color: {argb: '00000000'},
};
const FONT_ROWS = {
    name: 'Calibri',
    size: 12,
    color: {argb: '00000000'},
};
const FONT_COLUMN_HEADER = {
    name: 'Calibri',
    size: 12,
    bold: true,
    color: {argb: '00FFFFFF'},
};
const FONT_COLUMN_BOLD = {
    name: 'Calibri',
    size: 12,
    bold: true,
};
const BORDER_THIN = {
    top: {style: 'thin'},
    left: {style: 'thin'},
    bottom: {style: 'thin'},
    right: {style: 'thin'}
};

const sendNotificationTmp = async (notification, attachments, inbox, user, notifierUser) => {

    let created_at_timestamp = Date.now();
    let created_at = new Date(created_at_timestamp);
    let created_at_pdf = created_at;// - 5 * 60 * 60 * 1000;

    let newNotification = {
        inbox_id: inbox._id,
        inbox_doc_type: notification.docType,
        inbox_doc: notification.doc,
        inbox_name: user.names,
        organization_doc: user.organization_doc,
        organization_name: user.organization_name,
        n_expedient: notification.n_expedient,
        expedient: notification.expedient,
        message: notification.message,
        created_at: created_at,
        procedure: notification.procedure,
        //tag
        attachments: attachments,
        notifier_user_id: notifierUser.id,
        notifier_area_code: notifierUser.job_area_code,
        notifier_area: notifierUser.job_area_name,
        sent_at: created_at,
        //received_at: created_at,
        acuse_type: 'pdf',
        expired: false, //always setting expiration to false in new notifications
        ...(notification.isAutomatic ? { isAutomatic: notification.isAutomatic } : {}),
        ...(notification.sistema ? { sistema: notification.sistema } : {})
    }
    let _lblname = '';
    switch (notification.docType.toUpperCase()) {
        case ('DNI'):
            _lblname = "Nombres y apellidos";
            break;
        case ('CE'):
            _lblname = "Nombres y apellidos";
            break;
        case ('RUC'):
            _lblname = "Razón Social";
            break;
        case ('PR'):
            _lblname = "Razón Social";
            break;
    }
    try {
        let paramsAcuseNotifier = {
            notifier_doc_type: notifierUser.docType.toUpperCase(),
            notifier_doc: notifierUser.doc,
            notifier_name: notifierUser.name + ' ' + notifierUser.lastname,
            notifier_area: notifierUser.job_area_name,
            inbox_doc_type: notification.docType.toUpperCase(),
            inbox_doc: notification.doc,
            inbox_name: user.names,
            organization_doc: user.organization_doc != null ? pad(user.organization_doc, 11) : "",
            organization_name: user.organization_name,
            expedient: notification.expedient,
            message: notification.message,
            timestamp: dateFormat(new Date(created_at_pdf), "dd/mm/yyyy HH:MM:ss"),
            message_hash: utils.stringHash(notification.message),
            attachments_hashes: await getFilesHash(newNotification.attachments),
            lblname1: _lblname,
            name1: (notification.docType === 'dni' || notification.docType === 'ce') ? user.names : user.organization_name
        }

        newNotification.acuse_data = paramsAcuseNotifier;

        let resultAcuseNotifier = await pdfAcuseNotifier(paramsAcuseNotifier);
        //NOTIFICATION LOCAL
        // resultAcuseNotifier = { success: true, filepdf: 'prueba'}

        if (!resultAcuseNotifier.success) {
            return {success: false, error: errors.INTERNAL_ERROR};
        }

        let pdf = path_upload_tmp + "/" + resultAcuseNotifier.filepdf;
        let pdf_firmado = path_upload + "/" + resultAcuseNotifier.filepdf;

        let pdf_firmado_copia = pdf_firmado;
        let _pdf_firmado = pdf_firmado_copia.split('/');
        let new_pdf_firmado_copia = pdf_firmado_copia.replace(_pdf_firmado[_pdf_firmado.length - 1], '');
        fs.mkdirSync(new_pdf_firmado_copia, {recursive: true});

        await agentClient.agentClient(pdf, pdf_firmado);

        let dataRedis = {notification: newNotification, filepdf: resultAcuseNotifier.filepdf};

        await setNotificationRedis(notifierUser.docType, notifierUser.doc, notification.docType, notification.doc, dataRedis);

        let parameter = await invokerService.getParameters(notifierUser.docType, notifierUser.doc, notification.docType, notification.doc)

        return {success: true, param: parameter};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const createpdfAcuse = async (id, user) => {
    const db = await mongodb.getDb();

    let filter = {
        _id: ObjectId(id)
    }
    let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

    let paramsAcuseNotifier = {
        inbox_doc_type: notification.inbox_doc_type.toUpperCase(),
        inbox_doc: notification.inbox_doc,
        inbox_name_label: user.names === '  ' ? "Razón Social" : "Nombres y Apellidos",
        inbox_name: user.names === '  ' ? user.organization_name : user.names,
        expedient: notification.expedient,
        timestamp: dateFormat(new Date(notification.read_at), "dd/mm/yyyy HH:MM:ss"),
    }

    notification.acuse_data_read = paramsAcuseNotifier;

    let resultAcuseNotifier = await pdfAcuseNotifierRead(paramsAcuseNotifier);

    if (!resultAcuseNotifier.success) {
        return {success: false, error: errors.INTERNAL_ERROR};
    }

    let pdf = path_upload_tmp + "/" + resultAcuseNotifier.filepdf;
    let pdf_firmado = path_upload + "/" + resultAcuseNotifier.filepdf;

    let pdf_firmado_copia = pdf_firmado;
    let _pdf_firmado = pdf_firmado_copia.split('/');
    let new_pdf_firmado_copia = pdf_firmado_copia.replace(_pdf_firmado[_pdf_firmado.length - 1], '');
    fs.mkdirSync(new_pdf_firmado_copia, {recursive: true});

    await agentClient.agentClient(pdf, pdf_firmado);

    let _arrayFilePdf = resultAcuseNotifier.filepdf.split('/');

    notification.acuse_read = {
        path: resultAcuseNotifier.filepdf,
        name: _arrayFilePdf[_arrayFilePdf.length - 1]
    };

    let dataRedis = {notification: notification, filepdf: resultAcuseNotifier.filepdf};

    await setNotificationRedis("DNI", "00000000", paramsAcuseNotifier.inbox_doc_type, paramsAcuseNotifier.inbox_doc, dataRedis);

    await db.collection(mongoCollections.NOTIFICATIONS).updateOne(filter, {$set: notification});

    return {success: true};
}

function pad(num, size) {
    let s = "000000000" + num;
    return s.substr(s.length - size);
}

const getFilesHash = async (attachments) => {
    let filesHash = [];

    for await (const attachment of attachments) {

        let _fileHash = {
            name: attachment.name,
            hash: hashFiles.sync({files: [path_upload_tmp + '/' + attachment.path], algorithm: 'sha256'}),
            hash_type: 'sha256'
        }

        filesHash.push(_fileHash);

    }

    return filesHash;
}

const pdfAcuseNotifier = async (params) => {
    if (params.message && params.message.split(' ').length <= 1) {
        params.message = await insertSpaces(params.message, 32)
    }

    let content_1 = await acuseNotifiedAgente.template(params);
    let content_2 = await acuseNotified.template(params);

    let path = utils.getPath(appConstants.PATH_NOTIFICATION);
    let codigo = generarCodigoValidacion();
    let filename = params.notifier_doc_type + '_' + params.notifier_doc + '_' +
        params.inbox_doc_type + '_' + params.inbox_doc + '_' + codigo + '.pdf';

    fs.mkdirSync(path_upload_tmp + "/" + path, {recursive: true});

    let newPathFile = path_upload_tmp + "/" + path + filename;

    let options = {
        format: 'A4',
        phantomPath: '/usr/local/bin/phantomjs',
        // phantomPath: 'C:\\Users\\atolentino\\Downloads\\phantomjs-2.1.1-windows\\bin\\phantomjs',
        "border": {"top": "0cm", "right": "1cm", "bottom": "0cm", "left": "3cm"}
    };
    //let options = { format: 'Letter'};
    const notificadorAgente = process.env.NOTIFICADOR_AGENTE;
    if (params.notifier_doc === notificadorAgente) {
        return new Promise(resolve => {
            pdf.create(content_1, options).toFile(newPathFile, function (err, res) {
                if (err) {
                    console.log(err);
                    return resolve({success: false});
                } else {
                    return resolve({success: true, filepdf: path + filename});
                }
            });
        })
    } else {
        return new Promise(resolve => {
            pdf.create(content_2, options).toFile(newPathFile, function (err, res) {
                if (err) {
                    console.log(err);
                    return resolve({success: false});
                } else {
                    return resolve({success: true, filepdf: path + filename});
                }
            });
        })
    }

}

const insertSpaces = async (input, interval) => {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        if (i > 0 && i % interval === 0) {
            result += ' '; // Agrega un espacio en cada posición múltiplo de interval
        }
        result += input[i];
    }
    return result;
}

const pdfAcuseNotifierRead = async (params) => {

    let content = await acuseNotifiedAgente.templateRecibo(params);

    let path = utils.getPath(appConstants.PATH_NOTIFICATION);
    let codigo = generarCodigoValidacion();
    let filename = 'DNI_00000000_' + params.inbox_doc_type + '_' + params.inbox_doc + '_' + codigo + '.pdf';

    fs.mkdirSync(path_upload_tmp + "/" + path, {recursive: true});

    let newPathFile = path_upload_tmp + "/" + path + filename;


    // /usr/local/bin
    let options = {
        format: 'A4',
        phantomPath: '/usr/local/bin/phantomjs',
        //phantomPath: 'C:\\Users\\fhuaroto\\Downloads\\phantomjs-2.1.1-windows\\bin\\phantomjs',
        "border": {"top": "0cm", "right": "3cm", "bottom": "0cm", "left": "3cm"}
    };
    //let options = { format: 'Letter'};
    return new Promise(resolve => {
        pdf.create(content, options).toFile(newPathFile, function (err, res) {
            if (err) {
                console.log(err);
                return resolve({success: false});
            } else {
                return resolve({success: true, filepdf: path + filename});
            }
        });
    })
}

const generarCodigoValidacion = () => {
    let cadena = "";
    let min = 0;
    let max = 99;
    for (let i = 1; i <= 6; i++) {
        let numAleatorio = Math.floor(Math.random() * (max - min + 1) + min);
        cadena += numAleatorio;
    }
    return cadena;
}

function diacriticSensitiveRegex(string = '') {
    return string.replace(/a/g, '[a,á,à,ä]')
        .replace(/e/g, '[e,é,ë]')
        .replace(/i/g, '[i,í,ï]')
        .replace(/o/g, '[o,ó,ö,ò]')
        .replace(/u/g, '[u,ü,ú,ù]');
}

const getNotificationsByArea = async (area_code, search, filter, page, count) => {

    let _filter = {
        //notifier_area_code: area_code,
        $or: [
            {expedient: new RegExp(diacriticSensitiveRegex(search), 'i')},
            {organization_name: new RegExp(diacriticSensitiveRegex(search), 'i')},
            {inbox_name: new RegExp(diacriticSensitiveRegex(search), 'i')},
            {inbox_doc: new RegExp(diacriticSensitiveRegex(search))}
        ]
    }

    await switchFilter((filter ? parseInt(filter) : filter), _filter);

    try {
        const db = await mongodb.getDb();

        let cursor = await db.collection(mongoCollections.NOTIFICATIONS).find(_filter).sort({received_at: -1}).skip(page > 0 ? ((page - 1) * count) : 0).limit(count);

        let recordsTotal = await cursor.count();

        let notifications = [];

        for await (const notification of cursor) {
            var read_at_date = notification.read_at !== undefined ? moment(notification.read_at).format('YYYY-MM-DD HH:mm:ss') : "";
            var received_at_date = moment(notification.received_at).format('YYYY-MM-DD HH:mm:ss');

            notifications.push({
                id: notification._id,
                expedient: notification.expedient,
                inbox_doc: notification.inbox_doc,
                inbox_doc_type: notification.inbox_doc_type,
                inbox_name: notification.inbox_name,
                organization_name: notification.organization_name,
                received_at: notification.received_at,
                read_at: notification.read_at,
                received_at_formatted: received_at_date,
                read_at_formatted: read_at_date,
                automatic: notification.automatic != null ? notification.automatic : false
            });
        }
        return {success: true, recordsTotal: recordsTotal, notifications: notifications};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const switchFilter = async (option, _filter) => {
    switch (option) {
        case appConstants.FILTER_READ:
            _filter.read_at = {$exists: true};
            return _filter;
        case appConstants.FILTER_UNREAD:
            _filter.read_at = {$exists: false};
            return _filter;
        case appConstants.FILTER_NOTIFIED:
            return _filter.automatic = {$in: [false, null]};
        case appConstants.FILTER_NOT_NOTIFIED:
            return _filter.automatic = true;
        case appConstants.FILTER_DEFEATED:
            _filter.expired = true;
            return _filter;
        case appConstants.FILTER_NOT_DEFEATED:
            _filter.expired = false;
            return _filter;
        default:
            return null;
    }
}

const getNotifierAgente = async (dniAgente, profile) => {
    console.log('\n dniAgente: ' + dniAgente + ' \n ');
    console.log('\n profile: ' + profile + ' \n ');
    try {
        const db = await mongodb.getDb();
        const userNotifier = await db.collection(mongoCollections.USERS).findOne({
            doc: dniAgente,
            profile: profile
        });

        return {
            success: true,
            userNotifier: userNotifier,
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const getNotificationCredencialAgente = async (dniCandidato) => {

    console.log('\n getNotificationCredencialAgente - dniCandidato: ' + dniCandidato + ' \n ');

    try {
        const db = await mongodb.getDb();

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne({inbox_doc: dniCandidato});
        if (!notification) {
            logger.error('notification ' + dniCandidato + ' not exist');
            return {success: false, error: errors.NOTIFICATION_NOT_VALID};
        }

        return {
            success: true,
            id: notification._id,
            notification: notification,
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getNotification = async (id, jwt) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(id)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + id + ' not exist');
            return {success: false, error: errors.NOTIFICATION_NOT_VALID};
        }
        let inbox = await db.collection(mongoCollections.INBOX).findOne({_id: notification.inbox_id});
        let histories = await db.collection(mongoCollections.EVENT_HISTORY).find({
            id: notification._id,
            collection: 'notifications',
            motivo: {$in: ['envio_notificacion', 'reenvio_notificacion']}
        }).toArray();
        const representative = await representativeService.findByUserId(inbox.user_id, true);

        let automatic = notification.automatic != null ? notification.automatic : false;

        let result = [];

        if (automatic) {
            result = {
                success: true,
                notification: {
                    id: notification._id,
                    inbox_doc_type: notification.inbox_doc_type,
                    inbox_doc: notification.inbox_doc,
                    inbox_name: notification.inbox_name,
                    inbox_email: inbox.email,
                    inbox_cellphone: inbox.cellphone,
                    organization_name: notification.organization_name,
                    expedient: notification.expedient,
                    message: notification.message,
                    attachments: await getAttachments(id, notification.attachments, jwt),
                    created_at: notification.created_at,
                    automatic: automatic,
                    n_expedient: notification.n_expedient,
                    procedure: notification.procedure,
                    event_history_notifications: await findEvent_history(notification._id, 2),
                    orgPol: inbox.orgPol,
                }
            }
        } else {
            result = {
                success: true,
                notification: {
                    id: notification._id,
                    inbox_doc_type: notification.inbox_doc_type,
                    inbox_doc: notification.inbox_doc,
                    inbox_name: notification.inbox_name,
                    inbox_email: inbox.email,
                    inbox_cellphone: inbox.cellphone,
                    organization_name: notification.organization_name,
                    expedient: notification.expedient,
                    notifier_area: notification.notifier_area,
                    received_at: notification.received_at,
                    read_at: notification.read_at,
                    message: notification.message,
                    attachments: await getAttachments(id, notification.attachments, jwt),
                    acuse: getAcuseNotifier(id, notification.acuse_notified, jwt),
                    automatic: automatic,
                    n_expedient: notification.n_expedient,
                    procedure: notification.procedure,
                    event_history_notifications: await findEvent_history(notification._id, 2),
                    orgPol: inbox.orgPol,
                    officials: notification.officials
                }
            };
        }
        if (notification.acuse_read !== undefined) {
            result.notification.acuse_read = getAcuseNotifierRead(id, notification.acuse_read, jwt);
        }

        if (notification.read_position !== undefined) {
            result.notification.read_position = notification.read_position;
        }

        const dataCommunication = {
            email_sent_at: notification.email_sent_at ? await setDateCommunication(notification.email_sent_at, notification._id, 'email') : '',
            email_sent_status: notification.email_sent_status,
            sms_sent_at: notification.sms_sent_at ? await setDateCommunication(notification.sms_sent_at, notification._id, 'sms') : '',
            sms_sent_status: notification.sms_sent_status,
            email_sent_at_rep: notification.email_sent_at_rep ? await setDateCommunication(notification.email_sent_at_rep, notification._id, 'email_rep') : notification.email_sent_at_rep === null ? null : '',
            email_sent_status_rep: notification.email_sent_status_rep,
            sms_sent_at_rep: notification.sms_sent_at_rep ? await setDateCommunication(notification.sms_sent_at_rep, notification._id, 'sms_rep') : notification.sms_sent_at_rep === null ? null : '',
            sms_sent_status_rep: notification.sms_sent_status_rep,
        }

        const dataHistory = {};
        let historyEmailFirst = {};
        let historySMSFirst = {};
        if (histories.length > 0) {
            for (const history of histories) {
                if (history.event === 'sms_sent' && history.collection === 'notifications' && history.idRepresentante === null) {
                    dataHistory.sms = {sent_to: history.sent_to, date: history.date};
                    if (history.motivo === 'envio_notificacion') {
                        historySMSFirst = {sent_to: history.sent_to, date: history.date};
                    }
                }
                if (history.event === 'email_sent' && history.collection === 'notifications' && history.idRepresentante === null) {
                    dataHistory.email = {sent_to: history.sent_to, date: history.date};
                    if (history.motivo === 'envio_notificacion') {
                        historyEmailFirst = {sent_to: history.sent_to, date: history.date};
                    }
                }
                if (history.event === 'sms_sent' && history.collection === 'notifications' && history.idRepresentante !== null) {
                    dataHistory.sms_rep = {sent_to: history.sent_to, date: history.date};
                }
                if (history.event === 'email_sent' && history.collection === 'notifications' && history.idRepresentante !== null) {
                    dataHistory.email_rep = {sent_to: history.sent_to, date: history.date};
                }
            }

            if (dataHistory.sms === undefined) dataHistory.sms = {sent_to: inbox.cellphone};
            if (dataHistory.email === undefined) dataHistory.email = {sent_to: inbox.email};
            if (notification.inbox_doc_type === 'ruc' || notification.inbox_doc_type === 'pr') {
                dataHistory.sms_rep = dataHistory.sms_rep === undefined ? historySMSFirst : dataHistory.sms_rep;
                dataHistory.email_rep = dataHistory.email_rep === undefined ? historyEmailFirst : dataHistory.email_rep;
            }
        } else {
            dataHistory.email = {sent_to: inbox.email};
            dataHistory.sms = {sent_to: inbox.cellphone};
            if (notification.inbox_doc_type === 'ruc' || notification.inbox_doc_type === 'pr') {
                dataHistory.email_rep = {sent_to: representative.data.email};
                dataHistory.sms_rep = {sent_to: representative.data.cellphone};
            }
        }

        result.event_history = dataHistory;
        result.data_communication = dataCommunication;

        return result;
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const setDateCommunication = async (value, notificationId, field) => {
    const db = await mongodb.getDb();
    let newDate = '';

    const dataSet = {}

    if ((value instanceof Date)) {
        newDate = moment(value).format("DD/MM/YYYY HH:mm:ss.SSS");
    } else {
        const dt = value.split(/\/|\s/);
        let convertDate = new Date(dt.slice(0, 3).reverse().join('-') + ' ' + dt[3]);
        newDate = moment(convertDate).format("DD/MM/YYYY HH:mm:ss.SSS");

        if (field === 'email') dataSet.email_sent_at = convertDate;
        if (field === 'sms') dataSet.sms_sent_at = convertDate;
        if (field === 'email_rep') dataSet.email_sent_at_rep = convertDate;
        if (field === 'sms_rep') dataSet.sms_sent_at_re = convertDate;

        await db.collection(mongoCollections.NOTIFICATIONS).update({_id: notificationId}, {
            $set: dataSet
        });
    }

    return newDate;
}

const getCountSendEmailAndSms = async (notificationId, event_history_notifications) => {
    const data = {};
    let sumCountEmail = 0;
    let sumCountSMS = 0;

    try {
        const db = await mongodb.getDb();

        let resultQuery = await db.collection(mongoCollections.NOTIFY_NOTIFICATIONS_TMP).findOne({notification_id: ObjectId(notificationId)});

        if (resultQuery) {
            data.email = resultQuery.count_send_email;
            data.sms = resultQuery.count_send_sms;
        } else {
            data.email = 1;
            data.sms = 1;
        }

        let resulHistoryEmail = await db.collection(mongoCollections.EVENT_HISTORY).find({
            id: ObjectId(notificationId),
            collection: 'notifications',
        }).toArray();

        for (const res of resulHistoryEmail) {
            if (res.event === 'email_sent') {
                sumCountEmail++;
            }
            if (res.event === 'sms_sent') {
                sumCountSMS++;
            }
        }

        data['email_receiver'] = sumCountEmail;
        data['sms_receiver'] = sumCountSMS;

        return data;
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getAttachments = async (idNotification, attachments, jwt) => {
    let result = []

    for await (const attachment of attachments) {
        result.push({
            name: attachment.name,
            url: encodeURI(base_url + '/download-file?token=' + jwt + '&notification=' + idNotification + '&filename=' + attachment.name),
            blocked: attachment.blocked,
            path: attachment.path
        });
    }
    return result;
}

const getAcuseNotifier = (idNotification, acuse_notified, jwt) => {
    return {
        name: acuse_notified.name,
        url: encodeURI(base_url + '/download-acuse?token=' + jwt + '&notification=' + idNotification)
    }
}

const getAcuseNotifierRead = (idNotification, acuse_notified, jwt) => {
    return {
        name: acuse_notified.name,
        url: encodeURI(base_url + '/download-acuse2?token=' + jwt + '&notification=' + idNotification)
    }
}

const sendNotification = async (notification, user) => {
    let key = user.docType + '_' + user.doc + '_' + notification.docType + '_' + notification.doc;
    let officials = {};
    const resultNotificationRedis = await getNotificationRedis(key);

    logger.info(resultNotificationRedis);
    if (!resultNotificationRedis) {
        return {success: false};
    }

    let newNotification = resultNotificationRedis.notification;

    let _arrayFilePdf = resultNotificationRedis.filepdf.split('/');

    newNotification.received_at = new Date();

    newNotification.acuse_notified = {
        path: resultNotificationRedis.filepdf,
        name: _arrayFilePdf[_arrayFilePdf.length - 1]
    };

    try {
        //NOTIFICATION LOCAL
        if (!fs.existsSync(path_upload + '/' + resultNotificationRedis.filepdf)) {
            logger.error('not exist acuse in path_upload');
            return {success: false, error: errors.INTERNAL_ERROR};
        }

        if (newNotification.attachments.length > 0) {
            let _arrayAttachments = newNotification.attachments[0].path.split('/');

            let newPath = newNotification.attachments[0].path.replace(_arrayAttachments[_arrayAttachments.length - 1], '');

            fs.mkdirSync(path_upload + "/" + newPath, {recursive: true});
        }

        for await (let attachment of newNotification.attachments) {
            fs.copyFileSync(path_upload_tmp + '/' + attachment.path, path_upload + '/' + attachment.path);
        }

        const db = await mongodb.getDb();
        const codeUrl = randomstring.generate(7);

        newNotification.inbox_id = ObjectId(newNotification.inbox_id);

        let resultNotification = await db.collection(mongoCollections.NOTIFICATIONS).insertOne(newNotification);
        console.log(resultNotification);

        const urlShort = appConstants.URL_SHORT_NOTIFICATION + codeUrl;
        const urlNotification = appConstants.URL_REAL_NOTIFICATION + resultNotification.insertedId;
        const messageSMS = appConstants.MESSAGE_SEND_NOTIFICATION + urlShort;

        logger.info('success insert in notifications');

        const resultEmail = await userService.getEmailCitizen(newNotification.inbox_doc_type, newNotification.inbox_doc);

        if (resultEmail.success) {
            //Sending Email and SMS to the user (either if PJ or PN)
            const resultSendEmail = await emailService.sendEmailNewNotification(newNotification, urlNotification, resultEmail.email);
            await registerLogService.registerLog("email_sent", mongoCollections.NOTIFICATIONS, resultNotification.insertedId, resultEmail.id, resultEmail.email, resultSendEmail, "envio_notificacion");

            const resultSendSMS = await smsService.sendSms(resultEmail.cellphone, "ONPE\nDocumento: " + newNotification.expedient + "\nURL:" + urlNotification);
            await registerLogService.registerLog("sms_sent", mongoCollections.NOTIFICATIONS, resultNotification.insertedId, resultEmail.id, resultEmail.cellphone, resultSendSMS, "envio_notificacion");

            //Also Validate representative information if it is PJ
            if (newNotification.inbox_doc_type === "ruc" || newNotification.inbox_doc_type === "pr") {
                const listEmail = [];
                const listSMS = [];
                const representatives = await representativeService.findByInboxId(newNotification.inbox_id.toString())
                if (representatives.success) {
                    for (const representative of representatives.data) {
                        officials[representative.position] = {active: true, id: representative._id};
                        if (representative.email !== resultEmail.email && representative.enabled && !listEmail.find((email) => email === representative.email)) {
                            const resultSendEmailRepresentative = await emailService.sendEmailNewNotification(newNotification, urlNotification, representative.email);
                            await registerLogService.registerLog("email_sent", mongoCollections.NOTIFICATIONS, resultNotification.insertedId, resultEmail.id, representative.email, resultSendEmailRepresentative, "envio_notificacion", representative._id);
                            listEmail.push(representative.email);
                        }
                        if (representative.cellphone !== resultEmail.cellphone && representative.enabled && !listSMS.find((sms) => sms === representative.cellphone)) {
                            const resultSendSMSRepresentative = await smsService.sendSms(representative.cellphone, "ONPE\nDocumento: " + newNotification.expedient + "\nURL:" + urlNotification);
                            await registerLogService.registerLog("sms_sent", mongoCollections.NOTIFICATIONS, resultNotification.insertedId, resultEmail.id, representative.cellphone, resultSendSMSRepresentative, "envio_notificacion", representative._id);
                            listSMS.push(representative.cellphone);
                        }
                    }
                    officials !== {} && await db.collection(mongoCollections.NOTIFICATIONS).updateOne({
                            _id: ObjectId(resultNotification.insertedId)},
                        {
                            $set: {officials: officials}
                        });
                } else {
                    return {success: false, error: errors.EMAIL_PHONE_NOT_EXIST_REPRESENTATIVE};
                }
            }

        } else {
            return {success: false, error: errors.EMAIL_PHONE_NOT_EXIST};
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: err.message};
    }

    return {success: true};
}

const automaticNotificationCredencialClaridad = async (notification_param, pathCredenciales, nameCredencial) => {
    let sistema = notification_param.name;
    let docType = notification_param.docType;
    let doc = notification_param.doc;
    let message = notification_param.message;
    let expedient = notification_param.expedient;

    let created_at_timestamp = Date.now();
    let created_at = new Date(created_at_timestamp);
    let notification = {};

    let resultUser = await userService.getUserCitizen(docType, doc);
    let inboxUser = await inboxService.getApprovedInboxByDoc(docType, doc);

    if (!resultUser.success || !inboxUser.success) {
        return {success: false, message: resultUser.error};
    }

    let attachments = [];

    try {
        const db = await mongodb.getDb();

        let nameFileCredencial = nameCredencial;
        let pathFileCredencial = pathCredenciales + '/' + nameCredencial;

        let fileCredencial = await utils.copyFile(pathFileCredencial, appConstants.PATH_NOTIFICATION, nameFileCredencial, notification.doc, created_at_timestamp, true, true);
        attachments.push(fileCredencial);

        let user = resultUser.user;

        notification.expedient = `${expedient != null ? expedient : (docType === 'dni' ? appConstants.NOTIFICATION_SUBJECT_PN : appConstants.NOTIFICATION_SUBJECT_PJ) + ` ${sistema}`}`;
        notification.message = `${message != null ? message : (docType === 'dni' ? appConstants.NOTIFICATION_EMAIL_BODY_PN : appConstants.NOTIFICATION_EMAIL_BODY_PJ) + ` ${sistema}.`}`;

        let newNotification = {
            inbox_id: ObjectId(inboxUser.inbox._id),
            inbox_doc_type: docType,
            inbox_doc: doc,
            inbox_name: user.names,
            organization_name: user.organization_name,
            expedient: notification.expedient,
            message: notification.message,
            attachments: attachments,
            created_at: created_at,
            received_at: created_at,
            automatic: true,
        }

        if (user.organization_doc != null) newNotification.organization_doc = user.organization_doc;

        const buscaNotificacion = await getNotificationCredencialAgente(doc);
        if (!buscaNotificacion.success) {
            let insert = await db.collection(mongoCollections.NOTIFICATIONS).insertOne(newNotification);
            console.log("Se crea notificacion de de Casilla nueva y de Credencial de Claridad para el usuario: " + doc);
            return {success: true, message: "Notificación registrada", insert: insert, sistema: sistema};
        }

        return {success: false, message: "Ya existe una notificacion de Casilla nueva y de Credencial de Claridad"};

    } catch (err) {
        logger.error(err);
        return {success: false, message: errors.INTERNAL_ERROR};
    }
}

const automaticNotification = async (notification_param, files, system, token) => {
    let pathFileServer
    switch (system) {
        case "CLARIDAD":
            pathFileServer = process.env.PATH_FILE_SERVER_CLARIDAD;
            break
        case "SASA":
            pathFileServer = process.env.PATH_FILE_SERVER_SASA;
            break
        case "REP":
            pathFileServer = process.env.PATH_FILE_SERVER_REP;
            break
        default:
            return {success: false, message: 'Servicio no registrado'};
    }
    let docType = notification_param.docType;
    let doc = notification_param.doc;
    let message = notification_param.message;
    let expedient = notification_param.expedient;
    let archivosList = notification_param.archivosList;

    let created_at_timestamp = Date.now();
    let created_at = new Date(created_at_timestamp);
    let listaArchivos = notification_param.archivosList !== undefined ? notification_param.archivosList : null;
    let countFiles = listaArchivos == null ? Object.keys(files).length : listaArchivos.length;
    let notification = {};

    let resultUser = await userService.getUserCitizen(docType, doc);
    let inboxUser = await inboxService.getApprovedInboxByDoc(docType, doc);

    if (!resultUser.success || !inboxUser.success) {
        return {success: false, message: errors.CITIZEN_NOT_EXIST.message};
    }

    let _files = [];
    let attachments = [];
    for (let i = 1; i <= countFiles; i++) {
        _files.push({index: i});
    }

    try {
        const db = await mongodb.getDb();

        if (files != null) {
            for await (file of _files) {
                if (files['file' + file.index] != undefined) {
                    files['file' + file.index].path;
                    let nameFile = await utils.copyFile(files['file' + file.index].path, appConstants.PATH_NOTIFICATION, files['file' + file.index].name, notification.doc, created_at_timestamp, true, true);
                    attachments.push(nameFile);
                }
            }
        } else {
            for await (file of _files) {
                let i = file.index - 1;
                let isValid = fs.existsSync(pathFileServer + listaArchivos[i], 'utf8');
                if (isValid) {
                    let name = String(listaArchivos[i]);
                    let nameFile = await utils.copyFile(pathFileServer + listaArchivos[i], appConstants.PATH_NOTIFICATION, name, notification.doc, created_at_timestamp, true, true);
                    attachments.push(nameFile);
                }
            }
        }

        let user = resultUser.user;

        notification.expedient = `${expedient + '-' + system}`;
        notification.message = `${message}`;

        let newNotification = {
            inbox_id: ObjectId(inboxUser.inbox._id),
            inbox_doc_type: docType,
            inbox_doc: doc,
            inbox_name: user.names,
            organization_name: user.organization_name,
            expedient: notification.expedient,
            message: notification.message,
            attachments: attachments,
            archivosList: archivosList,
            created_at: created_at,
            automatic: true,
            sistema: system,
            token: token
        }

        if (user.organization_doc != null) newNotification.organization_doc = user.organization_doc;
        let insert = await db.collection(mongoCollections.NOTIFICATIONS_TMP).insertOne(newNotification);
        return {success: true, message: "Notificación registrada", insert: insert, sistema: system};

    } catch (err) {
        logger.error(err);
        return {success: false, message: errors.INTERNAL_ERROR.message};
    }
}

const singNotificationAutomatic = async (id, notifierUser) => {

    let created_at_timestamp = Date.now();
    let created_at = new Date(created_at_timestamp);
    let created_at_pdf = created_at;// - 5 * 60 * 60 * 1000;

    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(id)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + id + ' not exist');
            return {success: false, error: errors.NOTIFICATION_NOT_VALID};
        }

        let updateNotification = {
            notifier_user_id: notifierUser.id,
            notifier_area_code: notifierUser.job_area_code,
            notifier_area: notifierUser.job_area_name,
            sent_at: created_at,
            received_at: created_at,
            acuse_type: 'pdf',
            automatic: false
        }

        let paramsAcuseNotifier = {
            notifier_doc_type: notifierUser.docType.toUpperCase(),
            notifier_doc: notifierUser.doc,
            notifier_name: notifierUser.name + ' ' + notifierUser.lastname,
            notifier_area: notifierUser.job_area_name,
            inbox_doc_type: notification.inbox_doc_type.toUpperCase(),
            inbox_doc: notification.inbox_doc,
            inbox_name: notification.inbox_name,
            organization_doc: notification.organization_doc != null ? pad(notification.organization_doc, 11) : "",
            organization_name: notification.organization_name,
            expedient: notification.expedient,
            timestamp: dateFormat(new Date(created_at_pdf), "dd/mm/yyyy HH:MM:ss"),
            message_hash: utils.stringHash(notification.message),
            attachments_hashes: await getFilesHash(notification.attachments)
        }

        updateNotification.acuse_data = paramsAcuseNotifier;

        let resultAcuseNotifier = await pdfAcuseNotifier(paramsAcuseNotifier);

        if (!resultAcuseNotifier.success) {
            return {success: false, error: errors.INTERNAL_ERROR};
        }

        let pdf = path_upload_tmp + "/" + resultAcuseNotifier.filepdf;
        let pdf_firmado = path_upload + "/" + resultAcuseNotifier.filepdf;

        let pdf_firmado_copia = pdf_firmado;
        let _pdf_firmado = pdf_firmado_copia.split('/');
        let new_pdf_firmado_copia = pdf_firmado_copia.replace(_pdf_firmado[_pdf_firmado.length - 1], '');
        fs.mkdirSync(new_pdf_firmado_copia, {recursive: true});

        await agentClient.agentClient(pdf, pdf_firmado);

        let dataRedis = {notification: updateNotification, filepdf: resultAcuseNotifier.filepdf};

        await setNotificationRedis(notifierUser.docType, notifierUser.doc, notification.inbox_doc_type, notification.inbox_doc, dataRedis);

        let parameter = await invokerService.getParameters(notifierUser.docType, notifierUser.doc, notification.inbox_doc_type, notification.inbox_doc)

        return {success: true, param: parameter};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const sendNotificationAutomatic = async (id, user) => {
    try {

        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(id)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + id + ' not exist');
            return {success: false, error: errors.NOTIFICATION_NOT_VALID};
        }

        let key = user.docType + '_' + user.doc + '_' + notification.inbox_doc_type + '_' + notification.inbox_doc;

        const resultNotificationRedis = await getNotificationRedis(key);

        if (!resultNotificationRedis) {
            return {success: false};
        }

        let updateNotification = resultNotificationRedis.notification;

        let _arrayFilePdf = resultNotificationRedis.filepdf.split('/');

        updateNotification.received_at = new Date();

        updateNotification.acuse_notified = {
            path: resultNotificationRedis.filepdf,
            name: _arrayFilePdf[_arrayFilePdf.length - 1]
        };

        // if (!fs.existsSync(path_upload + '/' + resultNotificationRedis.filepdf)) {
        //     logger.error('not exist acuse in path_upload');
        //     return {success: false, error: errors.INTERNAL_ERROR};
        //
        // }

        if (notification.attachments.length > 0) {
            let _arrayAttachments = notification.attachments[0].path.split('/');

            let newPath = notification.attachments[0].path.replace(_arrayAttachments[_arrayAttachments.length - 1], '');

            fs.mkdirSync(path_upload + "/" + newPath, {recursive: true});

        }

        for await (let attachment of notification.attachments) {
            fs.copyFileSync(path_upload_tmp + '/' + attachment.path, path_upload + '/' + attachment.path);
        }

        await db.collection(mongoCollections.NOTIFICATIONS).update(filter, {$set: updateNotification});

        const resultEmail = await userService.getEmailCitizen(notification.inbox_doc_type, notification.inbox_doc);
        const urlNotification = appConstants.URL_REAL_NOTIFICATION + id;
        const expediente = notification.expedient === "Notificación automática - Credenciales del sistema CLARIDAD" ? "Credenciales del sistema CLARIDAD" : notification.expedient;

        if (resultEmail.success) {
            const bodySMS = "ONPE\nDocumento: ";
            const resultSendEmail = await emailService.sendEmailNewNotification(notification, urlNotification, resultEmail.email);
            await registerLogService.registerLog("email_sent", mongoCollections.NOTIFICATIONS, notification._id, resultEmail.id, resultEmail.email, resultSendEmail, "envio_notificacion");
            // await smsService.sendSms(resultEmail.cellphone, appConstants.MESSAGE_SEND_NOTIFICATION);
            const resultSendSMS = await smsService.sendSms(resultEmail.cellphone, bodySMS + expediente + "\nURL:" + urlNotification)
            await registerLogService.registerLog("sms_sent", mongoCollections.NOTIFICATIONS, notification._id, resultEmail.id, resultEmail.cellphone, resultSendSMS, "envio_notificacion");
        }

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

    return {success: true};
}

const downloadAttachment = async (idNotification, filename) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(idNotification)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + idNotification + ' not exist');
            return {success: false, error: errors.NOTIFICATION_NOT_VALID};
        }

        let i = 0;
        let result = {};

        for await (const attachment of notification.attachments) {
            if (attachment.name === filename) {
                if (attachment.blocked != null) {
                    if (attachment.blocked) {
                        result.success = false;
                        result.error = "Archivo bloqueado para el notificador";
                    } else {
                        result = validateFile(attachment);
                    }
                } else {
                    result = validateFile(attachment);
                }
                break;
            } else {
                i++;
            }
        }

        if (i == notification.attachments.length) {
            result.success = false;
            result.error = "Archivo no encontrado";
        }
        return result;

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

function validateFile(attachment) {
    let result = {};
    if (fs.existsSync(path_upload + '/' + attachment.path)) {
        result.success = true;
        result.pathfile = path_upload + '/' + attachment.path;
    } else {
        logger.error('attachment ' + path_upload + '/' + attachment.path + ' not exist');
        result.success = false;
        result.error = "Archivo no encontrado";
    }
    return result;
}

const downloadAcuseNotified = async (idNotification) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(idNotification)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + idNotification + ' not exist');
            return {success: false};
        }

        let result = {success: false};


        if (fs.existsSync(path_upload + '/' + notification.acuse_notified.path)) {
            result.success = true;
            result.pathfile = path_upload + '/' + notification.acuse_notified.path;
            result.filename = notification.acuse_notified.name;
        } else {
            logger.error('acuse notified: ' + path_upload + '/' + notification.acuse_notified.path + ' not exist');
        }

        return result;

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const downloadAcuse2Notified = async (idNotification) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(idNotification)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + idNotification + ' not exist');
            return {success: false};
        }

        let result = {success: false};

        if (fs.existsSync(path_upload + '/' + notification.acuse_read.path)) {
            result.success = true;
            result.pathfile = path_upload + '/' + notification.acuse_read.path;
            result.filename = notification.acuse_read.name;
        } else {
            logger.error('acuse notified: ' + path_upload + '/' + notification.acuse_read.path + ' not exist');
        }

        return result;

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const setNotificationRedis = async (notifier_doc_type, notifier_doc, addressee_doc_type, addressee_doc, data) => {
    const key = notifier_doc_type + "_" + notifier_doc + "_" + addressee_doc_type + "_" + addressee_doc;
    const result = await redisWriter.set(key, JSON.stringify(data));
    return result !== null;
}

const getNotificationRedis = async (key) => {
    return JSON.parse(await redisReader.get(key));
}

// const firmaConAgenteAutomatizado = async (job) => {
//     let box = job.data;
//     let nroDoc = box.doc;
//     let docType = box.docType;
//     await userService.searchCLARIDAD(nroDoc, docType, true);
//
//     const pathCredenciales = docType === 'ruc' ? process.env.PATH_BIENVENIDA_CLARIDAD : process.env.PATH_CREDENCIALES_CLARIDAD;
//     const nameCredencial = (docType === 'ruc' ? process.env.FILE_PREFIX_BIENVENIDA_CLARIDAD : process.env.FILE_PREFIX_CREDENCIALES_CLARIDAD) + nroDoc + '.pdf';
//     const pathCompleto = pathCredenciales + '/' + nameCredencial;
//
//     if (fs.existsSync(pathCompleto)) {
//         console.log(nroDoc + ' si es candidato.');
//
//         let notification_param = {
//             name: 'CLARIDAD',
//             doc: nroDoc,
//             docType: docType,
//         }
//
//         let res = await automaticNotificationCredencialClaridad(notification_param, pathCredenciales, nameCredencial);
//         if (res.success) {
//             let notificactionId = res.insert.insertedId;
//
//             //Datos del notificador de Agente Automatizado
//             const notifierUserDNI = process.env.NOTIFICADOR_AGENTE;
//             const profile = 'notifier';
//             const notifierAgente = await getNotifierAgente(notifierUserDNI, profile);
//             if (!notifierAgente.success) {
//                 console.log('\n No existe Notificador Agente \n ');
//             }
//             let notifierUser = notifierAgente.userNotifier;
//             notifierUser.docType = notifierUser.doc_type;
//
//             const result2 = await singNotificationAutomatic(notificactionId, notifierUser);
//             if (result2.success) {
//                 const parameter = result2.param;
//                 if (parameter.length > 0) {
//                     const result3 = await sendNotificationAutomatic(notificactionId, notifierUser);
//                     if (!result3) {
//                         console.log('Notificacion incompleta de: ' + nroDoc);
//                     }
//                 } else {
//                     console.log('No se envió notificación de: ' + nroDoc);
//                 }
//             } else {
//                 console.log('No se realizó la firma de Agente Automatizado de: ' + nroDoc);
//             }
//         } else {
//             console.log('No pudo crearse la notificacion de credencial de ' + nroDoc);
//         }
//     } else {
//         console.log(nroDoc + ' no es candidato.');
//     }
// }

// const firmaConAgenteAutomatizadoCiudadano = async (job) => {
//
//     //sleep(1000);
//
//     let datosFirma = job.data;
//
//     //let iduser= datosFirma.iduser;
//     let pendingInbox = datosFirma.pendingInbox;
//     let nroDoc = pendingInbox.doc;
//     let docType = pendingInbox.doc_type;
//
//     userService.searchCLARIDAD(nroDoc, docType, true);
//
//     //automaticNotificationCredencialClaridad
//     const pathCredenciales = docType == 'ruc' ? process.env.PATH_BIENVENIDA_CLARIDAD : process.env.PATH_CREDENCIALES_CLARIDAD;
//     const nameCredencial = (docType == 'ruc' ? process.env.FILE_PREFIX_BIENVENIDA_CLARIDAD : process.env.FILE_PREFIX_CREDENCIALES_CLARIDAD) + nroDoc + '.pdf';
//     const pathCompleto = pathCredenciales + '/' + nameCredencial;
//     if (fs.existsSync(pathCompleto)) {
//         console.log(nroDoc + ' si es candidato.');
//
//         let notification_param = {
//             name: 'CLARIDAD',
//             doc: nroDoc,
//             docType: docType,
//         }
//
//         let res = await automaticNotificationCredencialClaridad(notification_param, pathCredenciales, nameCredencial);
//         if (res.success) {
//
//             let notificactionId = res.insert.insertedId;
//
//             //Datos del notificador de Agente Automatizado
//             const notifierUserDNI = process.env.NOTIFICADOR_AGENTE;
//             const profile = 'notifier';
//             const notifierAgente = await getNotifierAgente(notifierUserDNI, profile);
//             if (!notifierAgente.success) {
//                 console.log('\n No existe Notificador Agente \n ');
//             }
//             let notifierUser = notifierAgente.userNotifier;
//             notifierUser.docType = notifierUser.doc_type;
//
//             //Se usa las credenciales de Notificador de Agente Automatizado
//             const result2 = await singNotificationAutomatic(notificactionId, notifierUser);
//             if (result2.success) {
//                 const parameter = result2.param;
//                 if (parameter.length > 0) {
//                     const result3 = await sendNotificationAutomatic(notificactionId, notifierUser);
//                     if (!result3) {
//                         console.log('Notificacion incompleta de: ' + nroDoc);
//                     }
//                 } else {
//                     console.log('No se envió notificación de: ' + nroDoc);
//                 }
//             } else {
//                 console.log('No se realizó la firma de Agente Automatizado de: ' + nroDoc);
//             }
//
//         } else {
//             console.log('No pudo crearse la notificacion de credencial de ' + nroDoc);
//         }
//     } else {
//         console.log(nroDoc + ' no es candidato.');
//     }
// }

const firmaConAgenteAutomatizadoMPVE = async (job) => {

    let notificactionId = job.data;

    let filter = {
        _id: ObjectId(notificactionId)
    }
    //Datos del notificador de Agente Automatizado
    const notifierUserDNI = process.env.NOTIFICADOR_AGENTE;
    const profile = 'notifier';
    const notifierAgente = await getNotifierAgente(notifierUserDNI, profile);
    if (!notifierAgente.success) {
        console.log('\n No existe Notificador Agente \n ');
    }
    let notifierUser = notifierAgente.userNotifier;
    notifierUser.docType = notifierUser.doc_type;

    try {
        const db = await mongodb.getDb();

        let notification = await db.collection(mongoCollections.NOTIFICATIONS_TMP).findOne(filter);
        const newNotification = {
            docType: notification.inbox_doc_type,
            doc: notification.inbox_doc,
            name: notification.inbox_name,
            expedient: notification.expedient,
            message: notification.message,
            isAutomatic: true,
            sistema: notification.sistema
        }
        if (!notification) {
            logger.error('notification ' + inbox_doc + ' de MPVE not exist');
        } else {
            //Se usa las credenciales de Notificador de Agente Automatizado
            const resultInbox = await inboxService.getApprovedInboxByDoc(newNotification.docType, newNotification.doc);
            const resultUser = await userService.getUserCitizen(newNotification.docType, newNotification.doc)

            const result2 = await sendNotificationTmp(newNotification, notification.attachments, resultInbox.inbox, resultUser.user, notifierUser);

            // const result2 = await singNotificationAutomatic(notification._id, notifierUser);
            if (result2.success) {
                const parameter = result2.param;
                if (parameter.length > 0) {
                    logger.info('\n Se realiza la firma automatizada MPVE correctamente\n ');
                    const result3 = await sendNotification(newNotification, notifierUser);
                    // const result3 = await sendNotificationAutomatic(notification._id, notifierUser);
                    if (!result3.success) {
                        logger.error('Notificacion incompleta');
                    }else {
                        await db.collection(mongoCollections.NOTIFICATIONS_TMP).updateOne(notification,{$set: {isProcessed: true}} );
                        logger.info('Notificacion automatica procesada correctamente');
                    }
                } else {
                    //No se puede enviar notificación
                    logger.error('No se envio notificación MPVE');
                }
                logger.info('Se realiza el envio de correo  MPVE correctamente');
            } else {
                //No se puede firmar
                logger.error('No se realizo la firma de Agente Automatizado de MPVE');
            }

        }

    } catch (err) {
        logger.error(err);
    }
}

const legendNotification = async (job) => {
    try {
        const db = await mongodb.getDb();
        let fRNV = {'read_at': {$exists: true}, 'expired': false};
        let total = await db.collection(mongoCollections.NOTIFICATIONS).find(fRNV).count();
        let fR = {'read_at': {$exists: false}, 'expired': false};
        let recibido = await db.collection(mongoCollections.NOTIFICATIONS).find(fR).count();
        let fNR = {'read_at': {$exists: false}, 'expired': true};
        let noRecibido = await db.collection(mongoCollections.NOTIFICATIONS).find(fNR).count();
        let fE = {'read_at': {$exists: true}, 'expired': true};
        let vencido = await db.collection(mongoCollections.NOTIFICATIONS).find(fE).count();
        return {success: true, total: total, recibido: recibido, noRecibido: noRecibido, vencido: vencido};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getReporteLecturaNotificacion = async (id, usuario) => {
    let today = utils.getDate();

    const workbook = new ExcelJS.Workbook();
    workbook.lastModifiedBy = 'ONPE';
    workbook.created = today;
    workbook.modified = today;
    workbook.lastPrinted = today;
    const worksheet = workbook.addWorksheet('Hoja1');

    worksheet.mergeCells('C1:Q3');
    worksheet.getCell('C1').value = 'Reporte de Lectura de Notificación';
    worksheet.getCell('C1').font = FONT_SHEET_HEADER;
    worksheet.getCell('C1').alignment = ALIGMENT_CENTER;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 50;
    worksheet.getColumn(6).width = 30;


    const HEADER = ['C8', 'D8', 'E8', 'F8'];
    for (let item of HEADER) {
        worksheet.getCell(item).fill = FILL_HEADER;
        worksheet.getCell(item).font = FONT_COLUMN_HEADER;
        worksheet.getCell(item).alignment = ALIGMENT_CENTER;
        worksheet.getCell(item).border = BORDER_THIN;
    }
    const logo = workbook.addImage({
        base64: recursos.LOGO_BASE64,
        extension: 'png',
    });
    worksheet.addImage(logo, 'A1:B3');
    worksheet.getCell('C5').value = 'Usuario: ';
    worksheet.getCell('D5').value = usuario;
    worksheet.getCell('D5').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C6').value = 'Fecha: ';
    worksheet.getCell('D6').value = moment(today).add(5, 'hours').format("YYYY-MM-DD HH:mm:ss");
    worksheet.getCell('D6').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C5').font = FONT_COLUMN_BOLD;
    worksheet.getCell('C6').font = FONT_COLUMN_BOLD;

    worksheet.getCell('C8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('D8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('E8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('F8').alignment = ALIGMENT_JUNP_TEXT;

    worksheet.getCell('C8').value = 'ÍTEM';
    worksheet.getCell('D8').value = 'PERFIL';
    worksheet.getCell('E8').value = 'USUARIO LECTOR';
    worksheet.getCell('F8').value = 'FECHA DE LECTURA DE NOTIFICACIÓN';
    let i = 1;
    let j = 9;

    const db = await mongodb.getDb();

    let filter = {
        _id: ObjectId(id)
    }

    let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);
    // Exportar solo una lectura por cargo
    const existPosition = new Set();

    if (notification.read_position) {
        for await (const item of notification.read_position) {
            if (!existPosition.has(item.cargo)) {
                existPosition.add(item.cargo);

                worksheet.getCell(`C${j}`).value = i;
                worksheet.getCell(`D${j}`).value = item.cargo;//`${item.created_at !== undefined ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;
                worksheet.getCell(`E${j}`).value = item.fullname;//item.inbox_doc_type.toUpperCase(); //item.inbox_name; //item.uuooName;
                worksheet.getCell(`F${j}`).value = moment(item.fecha).format("YYYY-MM-DD HH:mm:ss");

                worksheet.getCell(`C${j}`).border = BORDER_THIN;
                worksheet.getCell(`D${j}`).border = BORDER_THIN;
                worksheet.getCell(`E${j}`).border = BORDER_THIN;
                worksheet.getCell(`F${j}`).border = BORDER_THIN;

                worksheet.getCell(`C${j}`).font = FONT_ROWS;
                worksheet.getCell(`D${j}`).font = FONT_ROWS;
                worksheet.getCell(`E${j}`).font = FONT_ROWS;
                worksheet.getCell(`F${j}`).font = FONT_ROWS;

                j++;
                i++;
            }
        }
    }

    return await workbook.xlsx.writeBuffer();
}

const getNotificationByExpedient = async (docType, doc, expedient) =>{
    try {
        const db = await mongodb.getDb();
        let filter = {
            inbox_doc_type: docType,
            inbox_doc: doc,
            expedient
        }
        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);
        return {success: !notification};
    } catch (e) {
        logger.error(e);
        return sendStatus(400);
    }
}

module.exports = {
    sendNotificationTmp,
    getNotificationsByArea,
    getNotification,
    getCountSendEmailAndSms,
    pdfAcuseNotifier,
    sendNotification,
    downloadAttachment,
    downloadAcuseNotified,
    downloadAcuse2Notified,
    getNotificationRedis,
    getFilesHash,
    automaticNotification,
    singNotificationAutomatic,
    sendNotificationAutomatic,
    getNotificationCredencialAgente,
    getNotifierAgente,
    // firmaConAgenteAutomatizado,
    // firmaConAgenteAutomatizadoCiudadano,
    firmaConAgenteAutomatizadoMPVE,
    automaticNotificationCredencialClaridad,
    createpdfAcuse,
    legendNotification,
    getReporteLecturaNotificacion,
    getNotificationByExpedient
};


/**
 * Created by Angel Quispe
 */
const userService = require('./../services/userService');
const utils = require('./../common/utils');
const appConstants = require('./../common/appConstants');
const notificationService = require('./../services/notificationService');
const calendarService = require('./../services/calendarService');
const inboxService = require('./../services/inboxService');
const jwtService = require('./../services/jwtService');
const fs = require('fs');
const mime = require('mime-types');
require('./../services/colas/kitchen');
const placeOrder = require('./../services/colas/waiter');
const mongoCollections = require("../common/mongoCollections");
const mongodb = require("../database/mongodb");
const {redisWriter} = require("../database/redis");
const typeFiles = ["application/pdf", "image/jpg", "image/jpeg", "image/png", "image/bmp", "image/x-ms-bmp"];
const logger = require('../server/logger').logger;


const notifications = async (req, res, next) => {
    const {search, filter, page, count} = req.body;

    if (!page || !count) {
        return res.sendStatus(400);
    }

    if (!utils.validNumeric(page)
        || !utils.validNumeric(count)) {
        return res.sendStatus(400);
    }

    let response = {
        success: true,
        page: page,
        count: count,
    }

    let result = await notificationService.getNotificationsByArea(req.user.job_area_code, search, filter, page, count);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    for await (const item of result.notifications) {
        let day = new Date();

        let date = await fechaVencimiento(item.received_at);
        let state = 0;
        if (item.read_at !== undefined && item.read_at <= date) {
            state = 3;
        } else if (day <= date) {
            state = 2;
        } else if (day >= date) {
            state = 1;
        }
        item.state = state;
        item.expired_in = date;
    }
    response.recordsTotal = result.recordsTotal;
    response.Items = result.notifications;

    return res.json(response);

}

const notification = async (req, res, next) => {
    let {id} = req.body;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }

    let result = await notificationService.getNotification(id, req.token);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    let resultCount = await notificationService.getCountSendEmailAndSms(id, result.notification.event_history_notifications);
    let date = await fechaVencimiento(result.notification.received_at);

    let day = new Date();
    result.notification.expired_in = date;
    result.notification.expired = (day >= result.notification.expired_in);

    if (result.notification.read_at !== undefined) {
        const db = await mongodb.getDb();
        let user = await db.collection(mongoCollections.USERS).findOne({
            doc_type: result.notification.inbox_doc_type,
            doc: result.notification.inbox_doc,
            profile: appConstants.PROFILE_CITIZEN,
        });

        let resultUser={
            user:{
                names: user.name + ' ' + user.lastname + (user.second_lastname !== undefined ? ' ' + user.second_lastname : ''),
                name: user.name,
                lastname: user.lastname,
                second_lastname: user.second_lastname !== undefined ? user.second_lastname : '',
                organization_doc: user.organization_doc,
                organization_name: user.organization_name,
            }
        }

        if (result.notification.acuse_read === undefined) {
            let resultPdf = await notificationService.createpdfAcuse(result.notification.id, resultUser.user);
        }
    }

    result.notification.event_history = result.event_history;
    result.notification = {...result.notification, ...result.data_communication};

    return res.json({success: true, notification: result.notification, count_send: resultCount});
}

const personNotify = async (req, res, next) => {
    const {docType, doc} = req.body;

    if (utils.isEmpty(docType) || utils.isEmpty(doc)) {
        return res.sendStatus(400);
    }

    const result = await userService.getUserCitizen(docType, doc.toUpperCase());

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    let response = {
        success: true,
        person: (docType === 'ruc' || docType === 'pr') ? result.user.organization_name : result.user.names,
        email: result.user.email,
        pending_migration: result.user.pending_migration
    }

    return res.json(response);
}

const singNotification = async (req, res, next) => {
    let notification = req.fields;
    let files = req.files;
    let countFiles = Object.keys(files).length;

    if (utils.isEmpty(notification.docType)
        || utils.isEmpty(notification.doc)
        || utils.isEmpty(notification.name)
        || utils.isEmpty(notification.expedient)
        || utils.isEmpty(notification.message)
        || Object.keys(files).filter((x) => x.match(/^file[0-9]{1,3}$/g)).length === 0
        || countFiles === 0) {
        return res.status(400).json({success: false, error: "Datos no válidos"});
    }

    notification.doc = notification.doc.toUpperCase();
    let [resultInbox, resultUser] = await Promise.all([
        inboxService.getApprovedInboxByDoc(notification.docType, notification.doc),
        userService.getUserCitizen(notification.docType, notification.doc)
    ]);

    if (!resultInbox.success || !resultUser.success) {
        return res.status(400).json({success: false, error: "Nro. de documento no registrado"});
    }

    let filesIndex = [];
    let attachments = [];
    for (let i = 1; i <= countFiles; i++) {
        filesIndex.push({index: i});
    }

    let resultValidateFiles = await utils.validateNotiFiles(files, filesIndex, 'file');
    if (!resultValidateFiles.isValid) return res.status(400).json({success: false, error: resultValidateFiles.message});

    let _timestamp = Date.now();
    for await (file of filesIndex) {
        files['file' + file.index].path;
        file.file = await utils.copyFile(files['file' + file.index].path, appConstants.PATH_NOTIFICATION, files['file' + file.index].name, notification.doc, _timestamp, true, false);
        attachments.push(file.file);
    }

    const result = await notificationService.sendNotificationTmp(notification, attachments, resultInbox.inbox, resultUser.user, req.user);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    return res.json({success: true, param: result.param});
}

const sendNotification = async (req, res, next) => {
    let notification = req.fields;
    notification.doc = notification.doc.toUpperCase();
    let files = req.files;

    if (utils.isEmpty(notification.docType)
        || utils.isEmpty(notification.doc)
        || utils.isEmpty(notification.name)
        || utils.isEmpty(notification.expedient)
        || utils.isEmpty(notification.message)
        || utils.isEmpty(notification.procedure)
    ) {
        return res.sendStatus(400);
    }

    let [resultInbox, resultUser] = await Promise.all([
        inboxService.getInbox(notification.docType, notification.doc),
        userService.getUserCitizen(notification.docType, notification.doc)
    ]);

    if (!resultInbox.success || !resultUser.success) {
        return res.sendStatus(400);
    }

    const result = await notificationService.sendNotification(notification, req.user);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    return res.json({success: true});
}

const downloadAttachment = async (req, res, next) => {
    const {token, notification, filename} = req.query;

    if (utils.isEmpty(token) || utils.isEmpty(notification) || utils.isEmpty(filename)) {
        res.setHeader(appConstants.ERROR_HANDLER, "Datos no válidos");
        return res.status(400).send({
            success: false, error: "Datos no válidos"
        });
    }

    const resultVerifyToken = await jwtService.verifyToken(token, appConstants.PROFILE_NOTIFIER);

    if (!resultVerifyToken) {
        res.setHeader(appConstants.ERROR_HANDLER, "Token no válido");
        return res.status(401).send({
            success: false, error: "Token no válido"
        });
    }

    const resultAttachment = await notificationService.downloadAttachment(notification, filename);
    if (!resultAttachment.success) {
        res.setHeader(appConstants.ERROR_HANDLER, resultAttachment.error);
        return res.status(404).send(resultAttachment);
    }

    console.log("nombre archivo: " + filename);
    let extension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    console.log("extesion1: " + extension);
    res.setHeader('Content-Type', 'application/' + extension);
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.download(resultAttachment.pathfile, filename, (err) => {
        if (err) {
            logger.error('No se pudo descargar el archivo: ' + err);
            res.setHeader(appConstants.ERROR_HANDLER, "No se pudo descargar el archivo");
            res.status(500).send({
                success: false, error: "No se pudo descargar el archivo"
            });
        }
    });
    return res;
}

const downloadAcuseNotified = async (req, res, next) => {
    const {token, notification} = req.query;

    if (utils.isEmpty(token) || utils.isEmpty(notification)) {
        return res.sendStatus(400);
    }

    const resultVerifyToken = await jwtService.verifyToken(token, appConstants.PROFILE_NOTIFIER);

    if (!resultVerifyToken) {
        return res.sendStatus(401);
    }

    const resultAcuse = await notificationService.downloadAcuseNotified(notification);

    if (!resultAcuse.success) {
        return res.json(resultAcuse);
    }

    const content = fs.readFileSync(resultAcuse.pathfile);
    console.log(resultAcuse);
    if (content) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=' + resultAcuse.filename);
        res.send(content);

        return res;
    }

    return res.sendStatus(400);

}

const downloadAcuse2Notified = async (req, res, next) => {
    const {token, notification} = req.query;
    const db = await mongodb.getDb();
    console.log(token);
    console.log(notification);

    if (utils.isEmpty(token) || utils.isEmpty(notification)) {
        return res.sendStatus(400);
    }

    const resultVerifyToken = await jwtService.verifyToken(token, appConstants.PROFILE_NOTIFIER);

    if (!resultVerifyToken) {
        return res.sendStatus(401);
    }

    //Generating acuse automatically if notification was read
    let result = await notificationService.getNotification(notification, req.token);
    if (result.notification.read_at !== undefined) {
        //Fix considerar inbox deshabilitadas
        let user = await db.collection(mongoCollections.USERS).findOne({
            doc_type: result.notification.inbox_doc_type,
            doc: result.notification.inbox_doc,
            profile: appConstants.PROFILE_CITIZEN,
        });
        let resultUser={
            user:{
                names: user.name + ' ' + user.lastname + (user.second_lastname !== undefined ? ' ' + user.second_lastname : ''),
                name: user.name,
                lastname: user.lastname,
                second_lastname: user.second_lastname !== undefined ? user.second_lastname : '',
                organization_doc: user.organization_doc,
                organization_name: user.organization_name,
            }
        }

        if (result.notification.acuse_read === undefined) {
            let resultPdf = await notificationService.createpdfAcuse(result.notification.id, resultUser.user);
        }
    }

    const resultAcuse = await notificationService.downloadAcuse2Notified(notification);

    if (!resultAcuse.success) {
        return res.json(resultAcuse);
    }

    const content = fs.readFileSync(resultAcuse.pathfile);
    console.log(resultAcuse);
    if (content) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=' + resultAcuse.filename);
        res.send(content);

        return res;
    }

    return res.sendStatus(400);

}

const saveAutomaticNotification = async (req, res, next) => {
    let notification = req.fields;
    let files = req.files;
    const user = req.user.system;
    let [isValid, message] = await validarNotificacion(notification, files);
    if (!isValid) {
        return res.status(400).send({success: false, message: message});
    }
    const result = await notificationService.automaticNotification(notification, files, user);

    if (!result.success) {
        console.log("El ciudadano " + notification.doc + " no tiene casilla electronica");
        return res.status(400).json(result);
    }

    let notificactionId = result.insert.insertedId;
    //Envía a cola la firma automatizada y el envío de correo
    // if (result.success || result.sistema === 'MPVE') {
    //     placeOrder.placeOrderMPVE(notificactionId)
    //         .then((job) => {
    //             console.log('\n Se creo la notificacion MPVE y ahora se inicia la firma automatizada \n ');
    //         })
    //         .catch(() => {
    //             console.log('\n Se creo la notificacion MPVE y No se pudo realizar la firma automatizada " \n ');
    //         });
    // }
    //
    // if (!result.sistema === 'MPVE') {
    //     console.log("La notificacion NO tiene el campo name como MPVE");
    // }

    const response ={success: true, message: "Notificación en cola de procesamiento"}

    return res.status(!result ? 404 : 200).json(!result.success ? '' : response);
}

async function validarNotificacion(notification, files) {

    let countFiles = Object.keys(files).length;
    let countFields = Object.keys(notification).length;
    let isValid = true;
    let message = "";

    let validField = (utils.isEmpty(notification.docType)
        || utils.isEmpty(notification.doc)
        || utils.isEmpty(notification.name)
        || Object.keys(files).filter((x) => x.match(/^file[0-9]{1,3}$/g)).length === 0
        || countFiles === 0);

    if (validField) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Datos no válidos";
        return [isValid, message];
    }
    [isValid, message] = validarCampos(notification, countFiles, countFields);
    if (!isValid) return [isValid, message];

    let filesIndex = [];
    for (let i = 1; i <= countFiles; i++) {
        filesIndex.push({index: i});
    }

    let resultValidateFiles = await utils.validateFiles(files, filesIndex, 'file');

    return [resultValidateFiles.isValid, resultValidateFiles.message];
}

const saveAutomaticNotificationV2 = async (req, res, next) => {
    const {docType, doc, message, expedient, archivosList} = req.body;
    const system = req.user.system;
    const token = req.token;
    let notification = {
        docType: docType,
        doc: doc,
        message: message,
        expedient: expedient,
        archivosList: archivosList
    };
    let countFiles = notification.archivosList ? notification.archivosList.length : 0;

    let [isValid, mensaje] = await validarNotificacionV2(notification, countFiles, system);
    if (!isValid) {
        return res.status(400).send({success: false, message: mensaje});
    }

    const result = await notificationService.automaticNotification(notification, null, system, token);

    if (!result.success) {
        logger.error(result.message);
        return res.status(400).json(result);
    }

    let notificactionId = result.insert.insertedId;
    // Envía a cola la firma automatizada y el envío de correo
    if (result.success) {
        placeOrder.placeOrderMPVE(notificactionId)
            .then((job) => {
                console.log('\n Se creo la notificacion MPVE y ahora se inicia la firma automatizada \n ');
            })
            .catch(() => {
                console.log('\n Se creo la notificacion MPVE y No se pudo realizar la firma automatizada " \n ');
            });
    }

    await redisWriter.del(token);

    const response ={success: true, message: "Notificación en cola de procesamiento"}
    return res.status(!result ? 404 : 200).json(!result.success ? '' : response);
}

async function validarNotificacionV2(notification, countFiles, system) {

    let isValid = true;
    let message = "";
    let countFields = Object.keys(notification).length;

    let validField = (utils.isEmpty(notification.docType)
        || utils.isEmpty(notification.doc)
        || countFiles === 0);

    if (validField) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Datos no válidos";
        return [isValid, message];
    }

    [isValid, message] = validarCampos(notification, countFiles, countFields);
    if (!isValid) return [isValid, message];

    [isValid, message] = await validarArchivosV2(notification, countFiles, system);

    return [isValid, message];
}

function validarCampos(notification, countFiles, countFields) {
    let isValid = true;
    let message = "";
    let maxFiles = appConstants.MAX_FILES_AUTOMATIC_NOTIFICATION;
    let docType_ = ['dni', 'ce', 'ruc', 'pr'];
    if (!docType_.includes(notification.docType)) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Tipo de documento no válido.";
    }
    let doc_ = new String(notification.doc).toString();
    if (notification.docType === "dni" && doc_.length !== 8) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Documento no válido";
    }
    if (notification.docType === "ce" && (doc_.length < 8 || doc_.length > 12)) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Documento no válido";
    }
    if (notification.docType === "ruc" && (doc_.length !== 11 || !doc_.startsWith("20"))) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Documento no válido";
    }
    if (countFiles > maxFiles) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + `Máximo ${maxFiles} ${maxFiles == 1 ? "archivo" : "archivos"}`;
    }
    if (countFields < 3 || countFields > 7) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Número de campos no válido";
    }
    if (!notification.expedient) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Expediente requerido";
    }
    if (!notification.message) {
        isValid = false;
        message += ((message.length > 0) ? ", " : "") + "Mensaje requerido";
    }
    return [isValid, message];
}

async function validarArchivosV2(notification, countFiles, system) {
    let isValid = true;
    let message = "";
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

    for (let i = 0; i < countFiles; i++) {
        isValid = fs.existsSync(pathFileServer + notification.archivosList[i], 'utf8');
        if (!isValid) {
            message += ((message.length > 0) ? ", " : "") + `El Archivo ${i + 1} no existe`;
            break;
        }
        let fileStat = fs.statSync(pathFileServer + notification.archivosList[i], 'utf8');
        let typeFile = mime.lookup(pathFileServer + notification.archivosList[i]);
        console.log(fileStat.size, ' - ', typeFile);
        if (fileStat.size === 0 || fileStat.size > appConstants.TAM_MAX_FILE) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El Archivo ${i + 1} con tamaño no válido`;
            break;
        }
        if (!typeFiles.includes(typeFile)) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${i + 1} sólo en formato PDF, JPEG, JPG, PNG o BMP`;
            break;
        }
        const signedFile = fs.readFileSync(pathFileServer + notification.archivosList[i]);
        if (!utils.validateByteFile(typeFile, signedFile)) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${i + 1} está dañado o no es válido`;
            break;
        }
    }
    return [isValid, message];
}

const singNotificationAutomatic = async (req, res, next) => {
    let notification = req.fields;

    if (utils.isEmpty(notification.id)) {
        return res.sendStatus(400);
    }

    const result = await notificationService.singNotificationAutomatic(notification.id, req.user);

    return res.json(result);
}

const sendNotificationAutomatic = async (req, res, next) => {
    let notification = req.fields;

    if (utils.isEmpty(notification.id)) {
        return res.sendStatus(400);
    }

    const result = await notificationService.sendNotificationAutomatic(notification.id, req.user);

    return res.json(result);
}

async function fechaVencimiento(received_at) {
    var dias = 1;
    var acumulador = true;
    let diaActual = new Date(received_at);
    let diaFinal = new Date(received_at);
    diaFinal.setDate(diaFinal.getDate() + 25);

    var date = new Date(diaActual);
    var primerDia = new Date(date.getFullYear(), date.getMonth(), 1);
    var date1 = new Date(diaFinal);
    var ultimoDia = new Date(date1.getFullYear(), date1.getMonth() + 1, 0);
    let content = await calendarService.findByRangeDate('', primerDia, ultimoDia);
    do {
        diaActual.setDate(diaActual.getDate() + 1);
        acumulador = (diaActual.getDay() === 6 || diaActual.getDay() === 0) ? false : true;
        if (acumulador) {
            if (content.data.indexOf(diaActual.toLocaleDateString('en-CA')) === -1) {
                dias++;
            }
        }
    }
    while (dias <= 5);
    return diaActual;
}

const legendNotification = async (req, res, next) => {
    let response = {
        success: true
    }
    let result = await notificationService.legendNotification();
    response.recibido = result.recibido;
    response.vencido = result.vencido;
    response.total = result.total;
    response.noRecibido = result.noRecibido;
    return res.json(response);
}

const reporteLecturaNotification = async (req, res, next) => {
    try {
        let {id} = req.body;

        if (utils.isEmpty(id)) {
            return res.sendStatus(400);
        }

        let usuarioRegistro = `${req.user.name} ${req.user.lastname ? req.user.lastname + ' ' : ''}${req.user.second_lastname || ''}`.trim();

        const result = await notificationService.getReporteLecturaNotificacion(id, usuarioRegistro);

        if (result) {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=reporteLecturaNotificacion.xlsx');
            res.send(result);
            return res;
        }
        return res.sendStatus(400);
    } catch (e) {
        logger.error(e);
        return res.sendStatus(400);
    }
}
const validateExpedient = async (req, res, next) =>{
    try {
        let {docType, doc, expedient} = req.query;

        if (utils.isEmpty(docType) || utils.isEmpty(doc) || utils.isEmpty(expedient)) {
            return res.sendStatus(400);
        }
        const result = await notificationService.getNotificationByExpedient(docType, doc, expedient);
        return res.json(result);
    } catch (e) {
        logger.error(e);
        return res.sendStatus(400);
    }
}

module.exports = {
    notifications,
    notification,
    personNotify,
    singNotification,
    sendNotification,
    downloadAcuseNotified,
    downloadAcuse2Notified,
    downloadAttachment,
    saveAutomaticNotification,
    saveAutomaticNotificationV2,
    singNotificationAutomatic,
    sendNotificationAutomatic,
    legendNotification,
    reporteLecturaNotification,
    validateExpedient
};


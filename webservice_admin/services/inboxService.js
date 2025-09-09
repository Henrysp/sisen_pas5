/**
 * Created by Angel Quispe
 */
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const mongoCollections = require('./../common/mongoCollections');
const errors = require('./../common/errors');
const appConstants = require('./../common/appConstants');
const ObjectId = require('mongodb').ObjectId;
const fs = require('fs');
const representativeService = require('./../services/representativeService');
const registerLogService = require('./../services/registerLogService');

const base_url = process.env.BASE_URL;
const path_upload = process.env.PATH_UPLOAD;

const getInbox = async (docType, doc) => {
    try {
        const db = await mongodb.getDb();

        let _filter = {
            doc: doc,
            doc_type: docType
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne(_filter);

        if (!inbox) {
            logger.error('inbox ' + doc + '/' + docType + ' not exist');
            return {success: false};
        }

        return {success: true, inbox: {_id: inbox._id, doc: inbox.doc, doc_type: inbox.doc_type}};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const getApprovedInboxByDoc = async (docType, doc) => {
    try {
        const ESTADO_APROBADO = 'APROBADO';
        const ESTADO_PENDIENTE = 'PENDIENTE';
        const db = await mongodb.getDb();

        let _filter = {
            $or: [
                {
                    doc: doc.toUpperCase(),
                    doc_type: docType,
                    status: {$in: [ ESTADO_APROBADO, ESTADO_PENDIENTE]},
                },
                {
                    doc: doc,
                    doc_type: docType,
                    status: null,
                }
            ]
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne(_filter);

        if (!inbox) {
            logger.warn('inbox ' + doc + '/' + docType + ' approved not exist');
            return {success: false};
        }

        return {success: true, inbox: {_id: inbox._id, doc: inbox.doc, doc_type: inbox.doc_type}};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getApprovedInboxByEmail = async (correo) => {
    try {
        const ESTADO_APROBADO = 'APROBADO';
        const db = await mongodb.getDb();

        let _filter = {
            $and: [{email: correo,}, {$or: [{doc_type: 'dni'}, {doc_type: 'ce'}]}],
            $or: [
                {
                    email: correo,
                    status: ESTADO_APROBADO,
                },
                {
                    email: correo,
                    status: null,
                }
            ]
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne(_filter);

        if (!inbox) {
            logger.error('inbox with email ' + correo + ' approved not exist');
            return {success: false};
        }

        return {success: true};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getApprovedInboxByCellphone = async (cellphone) => {
    try {
        const ESTADO_APROBADO = 'APROBADO';
        const db = await mongodb.getDb();

        let _filter = {
            $and: [{cellphone: cellphone}, {$or: [{doc_type: 'dni'}, {doc_type: 'ce'}]}],
            $or: [
                {
                    cellphone: cellphone,
                    status: ESTADO_APROBADO,
                },
                {
                    cellphone: cellphone,
                    status: null,
                }
            ]
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne(_filter);

        if (!inbox) {
            logger.error('inbox with cellphone ' + cellphone + ' approved not exist');
            return {success: false};
        }

        return {success: true};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getInboxUserCitizen = async (docType, doc, jwt) => {
    try {
        const db = await mongodb.getDb();

        let _filter = {
            doc: doc,
            doc_type: docType
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne(_filter);

        if (!inbox) {
            logger.error('inbox ' + doc + '/' + docType + ' not exist');
            return {success: false};
        }

        return {
            success: true,
            inbox: {
                doc: inbox.doc,
                doc_type: inbox.doc_type,
                email: inbox.email,
                cellphone: inbox.cellphone,
                phone: inbox.phone,
                address: inbox.address,
                acreditation_type: inbox.acreditation_type,
                pdf_resolution: pdfBox(inbox._id, appConstants.BOX_PDF_RESOLUTION, inbox.pdf_resolution, jwt),
                pdf_creation_solicitude: pdfBox(inbox._id, appConstants.BOX_PDF_CREATION_SOLICITUDE, inbox.pdf_creation_solicitude, jwt),
                pdf_agree_tos: pdfBox(inbox._id, appConstants.BOX_PDF_AGREE_TOS, inbox.pdf_agree_tos, jwt)
            }
        };

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const pdfBox = (idInbox, pdf_type, pdf_inbox, jwt) => {
    return {
        name: pdf_inbox.name,
        url: encodeURI(base_url + '/download-pdf-box?token=' + jwt + '&inbox=' + idInbox + '&type=' + pdf_type)
    }
}

const downloadPdfInbox = async (idInbox, pdf_type) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(idInbox)
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne(filter);

        if (!inbox) {
            logger.error('inbox ' + idInbox + ' not exist');
            return {success: false};
        }

        let result = {success: false};

        if (fs.existsSync(path_upload + '/' + inbox[pdf_type].path)) {
            result.success = true;
            result.pathfile = path_upload + '/' + inbox[pdf_type].path;
            result.filename = inbox[pdf_type].name;
        } else {
            logger.error(pdf_type + ' - ' + path_upload + '/' + inbox[pdf_type].path + ' not exist');
        }

        return result;

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const inboxEdit = async (data, userLogged, attachment) => {
    let user;
    let rep = {};
    let isChangeEmail = false;
    let isChangeCellphone = false;
    let dataSetInbox = {
        email: data.email,
        address: data.address,
        cellphone: data.cellphone,
        phone: data.phone,
        update_user: userLogged,
        update_date: new Date(),
    };
    let dataSetUser = {
        email: data.email,
        cellphone: data.cellphone,
        address: data.address,
        Ubigeo: data.ubigeo,
        phone: data.phone,
        update_user: userLogged,
        update_date: new Date(),
        PaginaWeb: data.webSite,
    };

    try {
        const db = await mongodb.getDb();
        const oInbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectId(data.userId)
        });

        if (!oInbox) {
            return {success: false, error: 'No existe la casilla'};
        }

        if (oInbox.email !== data.email) {
            if (data.personType === 'pn'){
                const existInbox = await getApprovedInboxByEmail(data.email);
                if (existInbox.success) {
                    return {
                        success: false,
                        error: 'Ya existe una casilla con el correo ' + data.email + ', por favor ingrese otro correo'
                    }
                }
            }
            isChangeEmail = true;
        }

        if (oInbox.cellphone !== data.cellphone) {
            if (data.personType === 'pn') {
                const existInbox = await getApprovedInboxByCellphone(data.cellphone);
                if (existInbox.success) {
                    return {
                        success: false,
                        error: 'Ya existe una casilla con el número de celular ' + data.cellphone + ', por favor ingrese otro número'
                    }
                }
            }
            isChangeCellphone = true;
        }

        const users = await db.collection(mongoCollections.USERS).find({_id: ObjectId(data.userId)}).toArray();
        if (users.length === 1) {
            user = users[0];
        }

        if (!user) {
            return {success: false, error: 'No es posible determinar el usuario para la casilla seleccionada'};
        }

        if (data.personType === appConstants.PERSON_TYPE_PJ) {
            rep = data.rep;

            //update representative
            const updateRep = await representativeService.update(rep, userLogged, attachment);

            if (!updateRep.success) {
                return {
                    success: false,
                    error: 'No es posible determinar el representante para la casilla seleccionada'
                };
            }
        }

        const resultUpdateInbox = await db.collection(mongoCollections.INBOX).updateOne({_id: oInbox._id}, {
            $set: dataSetInbox
        });

        const resultUpdateUsers = await db.collection(mongoCollections.USERS).updateOne({_id: user._id}, {
            $set: dataSetUser
        });

        //register log data contact
        dataSetUser.user_id = user._id;
        dataSetUser.inbox_id = oInbox._id;
        dataSetUser.doc = user.doc;
        dataSetUser.doc_type = user.doc_type;

        if (isChangeEmail) {
            await registerLogService.registerContactHistory(dataSetUser, 'email', userLogged, dataSetUser.update_date, attachment);
        }

        if (isChangeCellphone) {
            await registerLogService.registerContactHistory(dataSetUser, 'cellphone', userLogged, dataSetUser.update_date, attachment);
        }

        // actualizar Correo Electronico y/o Número de celular de FUNCIONARIOS
        if (data.officials && data.officials.length > 0) {
            const listRep = await db.collection(mongoCollections.REPRESENTATIVE).find({
                inbox_id: dataSetUser.inbox_id,
                enabled: true
            }).toArray();

            for (let index = 0; index < data.officials.length; index++) {
                let isChangeEmailOfficial = false;
                let isChangeCellPhoneOfficial = false;

                const i = listRep.findIndex(rep => {
                    const result = rep._id.toString().toUpperCase() === data.officials[index]._id.toUpperCase() &&
                        (rep.email !== data.officials[index].email || rep.cellphone !== data.officials[index].cellphone);

                    if (result) {
                        isChangeEmailOfficial = rep.email !== data.officials[index].email;
                        isChangeCellPhoneOfficial = rep.cellphone !== data.officials[index].cellphone;
                    }

                    return result;
                });

                if (i >= 0) {
                    await db.collection(mongoCollections.REPRESENTATIVE).updateOne(
                        {_id: ObjectId(data.officials[index]._id)},
                        {
                            $set: {
                                email: data.officials[index].email,
                                cellphone: data.officials[index].cellphone,
                                update_user: dataSetUser.update_user,
                                update_date: dataSetUser.update_date
                            }
                        }
                    );

                    await db.collection(mongoCollections.USERS).updateOne(
                        {_id: ObjectId(data.officials[index].user_id)},
                        {
                            $set: {
                                email: data.officials[index].email,
                                cellphone: data.officials[index].cellphone,
                                update_user: dataSetUser.update_user,
                                update_date: dataSetUser.update_date
                            }
                        }
                    );

                    const dataOfficial = {
                        representative_id: ObjectId(data.officials[index]._id),
                        user_id: ObjectId(data.officials[index].user_id),
                        inbox_id: ObjectId(data.officials[index].inbox_id),
                        doc_type: data.officials[index].doc_type,
                        doc: data.officials[index].doc,
                        email: data.officials[index].email,
                        cellphone: data.officials[index].cellphone
                    }

                    if (isChangeEmailOfficial) {
                        await registerLogService.registerContactHistory(dataOfficial, 'email', userLogged, dataSetUser.update_date, attachment);
                    }

                    if (isChangeCellPhoneOfficial) {
                        await registerLogService.registerContactHistory(dataOfficial, 'cellphone', userLogged, dataSetUser.update_date, attachment);
                    }
                }
            }
        }

        return {success: true};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getInboxXNroexpediente = async (nroExpediente) => {
    try {
        const db = await mongodb.getDb();

        let _filter = {
            nroExpediente: nroExpediente
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne(_filter);

        if (!inbox) {
            logger.error('inbox ' + nroExpediente + ' not exist');
            return {success: false};
        }

        return {success: true, inbox: {_id: inbox._id, nroExpediente: inbox.nroExpediente}};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const getAttachments = async (idInbox, attachments, jwt) => {
    let result = []

    for await (const attachment of attachments) {
        result.push({
            path: attachment.path,
            name: attachment.name,
            url: encodeURI(base_url + '/download-file-inbox?token=' + jwt + '&idInbox=' + idInbox + '&filename=' + attachment.name),
            blocked: attachment.blocked,
        });
    }
    return result;
}

const downloadAttachment = async (idInbox, filename) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(idInbox)
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne(filter);

        if (!inbox) {
            logger.error('inbox ' + idInbox + ' not exist');
            return {success: false, error: errors.INBOX_NOT_VALID};
        }

        let i = 0;
        let result = {};

        for await (const attachment of inbox.attachments) {
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

        if (i == inbox.attachments.length) {
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

const getPdf = async (idInbox, pdf1, pdf2, pdf3, jwt) => {
    let result = []
    const pdfs = [pdf1, pdf2, pdf3];
    for await (const pdf of pdfs) {
        result.push({
            path: pdf.path,
            name: pdf.name,
            url: encodeURI(base_url + '/download-file-inbox?token=' + jwt + '&idInbox=' + idInbox + '&filename=' + pdf.name),
        });
    }
    return result;
}

module.exports = {
    getInbox,
    getInboxUserCitizen,
    downloadPdfInbox,
    getApprovedInboxByDoc,
    getApprovedInboxByEmail,
    getApprovedInboxByCellphone,
    inboxEdit,
    getInboxXNroexpediente,
    getAttachments,
    downloadAttachment,
    getPdf
};

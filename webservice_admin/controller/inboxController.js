/**
 * Created by Angel Quispe
 */
const utils = require('./../common/utils');
const inboxService = require('./../services/inboxService');
const logger = require('./../server/logger').logger;
const appConstants = require('./../common/appConstants');


const inboxEdit = async (req, res, next) => {
    let payload = req.fields;
    let files = req.files;
    let userLogged = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname : '') ;
    let attachments = [];

    if (payload.rep && typeof payload.rep === 'string') {
        try {
            payload.rep = JSON.parse(payload.rep);
        } catch (e) {
            console.error('Error al parsear el campo rep:', e);
            return res.status(400).json({success: false, error: "Formato de representante inválido"});
        }
    }

    if (payload.officials && typeof payload.officials === 'string') {
        try {
            payload.officials = JSON.parse(payload.officials);
        } catch (e) {
            console.error('Error al parsear el campo officials:', e);
            return res.status(400).json({success: false, error: "Formato de funcionarios inválido"});
        }
    }
    const rep = payload.rep || {};

    try {
        if (utils.isEmpty(payload.personType) ||
            utils.isEmpty(payload.userId) ||
            utils.isEmpty(payload.cellphone) ||
            utils.isEmpty(payload.ubigeo) ||
            utils.isEmpty(payload.address) ||
            utils.isEmpty(payload.email)) {
            return res.sendStatus(400);
        }

        if (payload.personType === appConstants.PERSON_TYPE_PJ) {
            if (utils.isEmpty(rep.id) ||
                utils.isEmpty(rep.email) ||
                utils.isEmpty(rep.cellphone)) {
                return res.sendStatus(400);
            }

            if (!utils.isEmpty(rep.phone) && rep.phone.length < 6) {
                return res.status(400).json({success: false, error: "Teléfono fijo no válido"});
            }
        }

        if (!utils.isEmpty(payload.phone) && payload.phone.length < 6) {
            return res.status(400).json({success: false, error: "Teléfono fijo no válido"});
        }
        if (files && files.file1){
            let filesIndex = [];
            filesIndex.push({index: 1});

            let resultValidatedFiles = await utils.validateFiles(files, filesIndex, 'file');
            if (!resultValidatedFiles.isValid) return res.status(400).json({
                success: false,
                error: resultValidatedFiles.message
            });

            for await (let file of filesIndex) {
                file.file = await utils.copyFile(
                    files['file' + file.index].path,
                    appConstants.PATH_BOX,
                    files['file' + file.index].name,
                    payload.doc,
                    Date.now(),
                    false,
                    false);
                attachments.push(file.file);
            }
        }
        let result = await inboxService.inboxEdit(payload, userLogged, attachments);
        return res.json(result);
    } catch (ex) {
        logger.error(ex);
        next({success: false, error: 'error'});
    }
}

const downloadAttachment = async (req, res, next) => {
    const {token, idInbox, filename} = req.query;

    /*if (utils.isEmpty(token) || utils.isEmpty(idInbox) || utils.isEmpty(filename)) {
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
    }*/
console.log("idInbox: "+idInbox)
console.log("filename: "+filename)
    const resultAttachment = await inboxService.downloadAttachment(idInbox, filename);
    if (!resultAttachment.success) {
        res.setHeader(appConstants.ERROR_HANDLER, resultAttachment.error);
        return res.status(404).send(resultAttachment);
    }

    //res.setHeader('Content-Type', 'application/pdf');
    console.log("nombre archivo: "+filename);
    var extension=filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);//filename.slice(3,2);
    console.log("extesion1: "+extension);
    res.setHeader('Content-Type', 'application/'+extension);
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.download(resultAttachment.pathfile, filename, (err) => {
        if(err) {
            logger.error('No se pudo descargar el archivo: ' + err);
            res.setHeader(appConstants.ERROR_HANDLER, "No se pudo descargar el archivo");
            res.status(500).send({
                success: false, error: "No se pudo descargar el archivo"
            });
        }
    });
    return res;
}

module.exports = {
    inboxEdit,
    downloadAttachment
};

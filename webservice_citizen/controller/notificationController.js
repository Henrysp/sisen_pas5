/**
 * Created by Angel Quispe
 */
const userInboxService = require('./../services/userInboxService');
const notificationService = require('./../services/notificationService');
const jwtService = require('./../services/jwtService');
const utils = require('./../common/utils');
const appConstants = require('./../common/appConstants');
const fs = require('fs');

const notifications = async (req, res, next) => {
    const {search, filter, page, count} = req.body;
    const userLogged = req.user;

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

    let resultInboxs = await userInboxService.getInboxs(req.user.docType, req.user.doc, req.user.id);

    if (!resultInboxs.success) {
        return res.json({success: false, error: resultInboxs.error});
    }

    let result = await notificationService.getNotificationByInboxs(resultInboxs.inboxs, search, filter, page, count, userLogged);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    response.recordsTotal = result.recordsTotal;
    response.Items = result.notifications;

    return res.json(response);

}

const getUnreadNotifications = async (req, res, next) => {

    let response = {success: true}
    // let resultInboxs = ""

    let resultInboxs = await userInboxService.getInboxs(req.user.docType, req.user.doc, req.user.id);

    // if (req.user.docType == 'ruc') {
    //     resultInboxs = await userInboxService.getInboxs(req.user.docType, req.user.doc, req.user.id);
    // } else {
    //     resultInboxs = await userInboxService.getInboxs(req.user.docType, req.user.doc, null);
    // }

    if (!resultInboxs.success) {
        return res.json({success: false, error: resultInboxs.error});
    }

    let result = await notificationService.getUnreadNotifications(resultInboxs.inboxs);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    response.recordsTotal = result.recordsTotal;

    return res.json(response);
}

const notification = async (req, res, next) => {
    //const data = req.body;
    let {id} = req.body;
    let userLogged = req.user;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }

    let result = await notificationService.getNotification(id, req.token);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    await notificationService.readPosition(id, result.notification, userLogged);

    if (!result.notification.read_at) {
        let resultRead = await notificationService.readNotification(id);
        if (!resultRead.success) {
            return res.json({success: false, error: result.error});
        }
        result.notification.read_at = resultRead.read_at;
        return res.json({success: true, notification: result.notification});
    } else {
        return res.json({success: true, notification: result.notification});
    }

}

const downloadAttachment = async (req, res, next) => {
    const {token, notification, filename} = req.query;

    if (utils.isEmpty(token) || utils.isEmpty(notification) || utils.isEmpty(filename)) {
        res.setHeader(appConstants.ERROR_HANDLER, "Datos no válidos");
        return res.status(400).send({
            success: false, error: "Datos no válidos"
        });
    }

    const resultVerifyToken = await jwtService.verifyToken(token);

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

    res.setHeader('Content-Type', 'application/pdf');
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

    /*const content = fs.readFileSync(resultAttachment.pathfile);

    if (content) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
        res.send(content);

        return res;
    }

    return res.sendStatus(400);*/
}

const downloadAcuseNotified = async (req, res, next) => {
    const {token, notification} = req.query;

    if (utils.isEmpty(token) || utils.isEmpty(notification)) {
        res.setHeader(appConstants.ERROR_HANDLER, "Datos no válidos");
        return res.status(400).send({
            success: false, error: "Datos no válidos"
        });
    }

    const resultVerifyToken = await jwtService.verifyToken(token);

    if (!resultVerifyToken) {
        res.setHeader(appConstants.ERROR_HANDLER, "Token no válido");
        return res.status(401).send({
            success: false, error: "Token no válido"
        });
    }

    const resultAcuse = await notificationService.downloadAcuseNotified(notification);

    if (!resultAcuse.success) {
        res.setHeader(appConstants.ERROR_HANDLER, resultAcuse.error);
        return res.status(404).send(resultAcuse);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + resultAcuse.filename);
    res.download(resultAcuse.pathfile, resultAcuse.filename, (err) => {
        if (err) {
            logger.error('No se pudo descargar el acuse: ' + err);
            res.setHeader(appConstants.ERROR_HANDLER, "No se pudo descargar el acuse");
            res.status(500).send({
                success: false, error: "No se pudo descargar el acuse"
            });
        }
    });

    //const content = fs.readFileSync(resultAcuse.pathfile);
    /*console.log(resultAcuse);
    if (content) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=' + resultAcuse.filename);
        res.send(content);

        return res;
    }*/

    //return res.sendStatus(400);
    return res;
}

module.exports = {notifications, getUnreadNotifications, notification, downloadAttachment, downloadAcuseNotified};

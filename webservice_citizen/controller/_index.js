/**
 * Created by Miguel Pazo (https://miguelpazo.com)
 */

const express = require('express');
const router = express.Router();
const loginController = require('./../controller/loginController');
const notificationController = require('./../controller/notificationController');
const urlShortenerController = require('./../controller/urlShortenerController');
const authFilter = require('./../filters/authFilter');
const authCitizenFilter = require('./../filters/authCitizenFilter');
const path = require('path');

module.exports = () => {

    router.get('/', (req, res, next) => {
        return res.status(200).json({status: 'ok'})
    });

    router.post('/login', loginController.login);
    router.post('/logout', loginController.logout);
    router.post('/recover-password', loginController.recoverPassword);
    router.get('/valida-contrasena/:id/:doc', loginController.validChangePassword);
    router.post('/new-password', authCitizenFilter, loginController.newPassword);
    router.post('/notifications', authCitizenFilter, notificationController.notifications);
    router.post('/notifications-unread', authCitizenFilter, notificationController.getUnreadNotifications);
    router.post('/notification', authCitizenFilter, notificationController.notification);
    router.get('/read-url/:code', authCitizenFilter, urlShortenerController.findByCode);
    router.get('/download-file', notificationController.downloadAttachment);
    router.get('/download-acuse', notificationController.downloadAcuseNotified);

    router.all('/*', (req, res) => {
        res.status('404').sendFile(path.join(__dirname, '../error/index.html'));
    });
    
    return router;
};


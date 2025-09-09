/**
 * Created by Miguel Pazo (https://miguelpazo.com)
 */

const express = require('express');
const formidableMiddleware = require('express-formidable');
const router = express.Router();
const loginController = require('./../controller/loginController');
const notificationController = require('./../controller/notificationController');
const servicesController = require('./../controller/servicesController');
const userController = require('./../controller/userController');
const reporteController = require('./../controller/reporteController');
const inboxController = require('./../controller/inboxController');
const ubigeoController = require('./../controller/ubigeoController');
const catalogController = require('./../controller/catalogController');
const invokerController = require('./../controller/invokerController');
const authNotifierFilter = require('./../filters/authNotifierFilter');
const authFilter = require('./../filters/authFilter');
const authFilterRole = require('../filters/authFilterRole');
const authFilterClaridad = require('./../filters/authFilterClaridad');
const authFilterSISCOM = require('./../filters/authFilterSISCOM');
const authFilterService = require('./../filters/authFilterService');
const appConstants = require('../common/appConstants');
const collectionsController = require('./../controller/collectionsController');
const representativeController = require('./../controller/representativeController');
const personController = require('./../controller/personController');
const calendarController = require('./../controller/calendarController');
const path = require('path');
const formidable = require("formidable");
const form = formidable.IncomingForm();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

module.exports = () => {

    router.get('/', (req, res, next) => {
        return res.status(200).json({status: 'ok'})
    });

    router.post('/login', loginController.login);
    router.post('/logout', loginController.logout);
    router.post('/recover-password', loginController.recoverPassword);
    router.post('/new-password', authFilter, loginController.newPassword);
    router.get('/download-file', notificationController.downloadAttachment);
    router.get('/download-file-inbox', inboxController.downloadAttachment);
    router.get('/download-acuse', notificationController.downloadAcuseNotified);
    router.get('/download-acuse2', notificationController.downloadAcuse2Notified);
    router.post('/update-service', servicesController.generateToken);

    router.post('/validar-casilla', function (req, res, next) {
        authFilterService([appConstants.PROFILE_SERVICE], req, res, next);
    }, formidableMiddleware(), userController.validarCasilla);

    router.get('/consult-SISCOM', function (req, res, next) {
        authFilterSISCOM([appConstants.PROFILE_SERVICE], req, res, next);
    }, userController.consultSiscom);

    router.get('/consult-inbox', function (req, res, next) {
        authFilterService([appConstants.PROFILE_SERVICE], req, res, next);
    }, userController.consultSiscom);

    router.post('/person-notify', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, notificationController.personNotify);

    router.post('/notifications', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, notificationController.notifications);
    router.post('/notification', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, notificationController.notification);
    router.post('/sing-notification', function (req, res, next) {
        form.maxFileSize = 1100 * 1024 * 1024;
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, formidableMiddleware(form), notificationController.singNotification);
    router.post('/send-notification', function (req, res, next) {
        form.maxFileSize = 1100 * 1024 * 1024;
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, formidableMiddleware(form), notificationController.sendNotification);
    router.post('/legendNotifications', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, notificationController.legendNotification);
    router.post('/save-automatic-notification', function (req, res, next) {
        authFilterService([appConstants.PROFILE_SERVICE], req, res, next);
    }, notificationController.saveAutomaticNotificationV2);
    router.get('/validate-expedient', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_NOTIFIER], req, res, next);
    }, notificationController.validateExpedient)

    router.get('/cache-send-notification', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, catalogController.getCacheSendNotification);

    router.post('/catalog/paginate', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, catalogController.paginateCatalog);
    router.post('/catalog/create', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, catalogController.createCatalog);
    router.post('/catalog/update', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, catalogController.updateCatalog);
    router.post('/catalog/remove', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, catalogController.removeCatalog);
    router.get('/catalog/types', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, catalogController.getTypes);
    router.get('/catalog/nextcode', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, catalogController.getNextCode);
    router.get('/admin/export-collection', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, collectionsController.exportCollection);
    router.get('/admin/collection-info', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, collectionsController.getCollectionsInfo);
    router.get('/catalog', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_CITIZEN, appConstants.PROFILE_NOTIFIER, appConstants.PROFILE_REGISTRADOR_NOTIFICADOR], req, res, next);
    }, catalogController.listCatalog);

    router.post('/users', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN, appConstants.PROFILE_EVALUATOR, appConstants.PROFILE_REGISTER_QUERY, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, userController.users);
    router.post('/list-users', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.listUsers);
    router.post('/delete-user', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.deleteUser);
    router.post('/delete-citizen', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.deleteCitizen);
    router.post('/create-user', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.createUser);
    router.put('/edit-user', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.editUser);
    router.get('/get-user-id', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.getUserById);
    // router.put('/edit-user-citizen', function (req, res, next) {
    //   authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    // }, userController.editUserCitizen);
    // router.put('/edit-user-org', function (req, res, next) {
    //   authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    // }, userController.editUserOrg);
    router.get('/get-user', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_REGISTER], req, res, next);
    }, userController.getUserCitizenById);
    /* router.get('/get-user-info-detail', function(req, res, next) {
         authFilterRole([appConstants.PROFILE_ADMIN,appConstants.PROFILE_EVALUATOR], req, res, next);
     }, userController.getUserCitizenDetailById);
     router.post('/updateEstateInbox', function(req, res, next) {
         authFilterRole([appConstants.PROFILE_ADMIN,appConstants.PROFILE_EVALUATOR], req, res, next);
     }, userController.updateEstateInbox);
     router.get('/download-pdf', function(req, res, next) {
         authFilterRole([appConstants.PROFILE_ADMIN,appConstants.PROFILE_EVALUATOR], req, res, next);
     }, userController.download);*/

    router.get('/get-user-info-detail', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_REGISTER], req, res, next);
    }, userController.getUserCitizenDetailById);
    router.get('/get-user-info-detail-edit', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_REGISTER], req, res, next);
    }, userController.getUserCitizenDetailByIdEdit);
    router.get('/get-user-info-detail-pj', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_REGISTER], req, res, next);
    }, userController.getUserCitizenDetailPjById);
    router.post('/updateEstateInbox', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_REGISTER], req, res, next);
    }, userController.updateEstateInbox);
    router.post('/inbox/edit', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, formidableMiddleware(), inboxController.inboxEdit);
    router.get('/download-pdf', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_REGISTER, appConstants.PROFILE_REGISTER_QUERY], req, res, next);
    }, userController.download);
    router.get('/search-user-mongo', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.searchUser);
    router.get('/search-user-ldap', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.searchUserLDAP);
    router.get('/search-user-ldap-mongo', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.searchUserLDAPMongo);
    router.get('/profiles-available', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN, appConstants.PROFILE_EVALUATOR,
            appConstants.PROFILE_REGISTER_QUERY, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, userController.profilesAvailable);
    router.post('/user-disable', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.userDisable);
    router.post('/user-enable', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.userEnable);
    router.post('/bulk-disable-user',upload.single('file'), function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.bulkDisableUsers);
    router.post('/user-citizen-disable', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.userCitizenDisable);
    router.post('/user-citizen-enable', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.userCitizenEnable);
    router.post('/inbox-status-change', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.inboxStatusChange);

    router.post('/person', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.person);
    router.post('/create-box', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, formidableMiddleware(), userController.createBox);
    router.get('/download-attachments', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.downloadAttachments);
    router.get('/cache-box', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, catalogController.getCacheBox);
    router.get('/search-person', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.searchPerson);
    router.get('/search-ruc', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.searchRuc);
    router.get('/search-ce', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.searchCE);
    router.get('/search-casilla', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.searchCasilla);
    router.get('/search-casilla-nroexpediente', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.searchCasillaNroexpediente);
    // router.post('/create-box', function (req, res, next) {
    //     authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    // }, userController.createBox);
    router.post('/box', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.box);
    router.get('/get-uuoo', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, userController.getUUOO);
    router.get('/get-processes', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_REGISTER], req, res, next);
    }, userController.getProcesses);

    router.get('/ubigeo/departamentos', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, ubigeoController.listaDepartamentos);
    router.get('/ubigeo/provincias/:codigod', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, ubigeoController.listaProvincias);
    router.get('/ubigeo/distritos/:codigod/:codigop', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, ubigeoController.listaDistritos);

    router.get('/download-pdf-box', userController.downloadPdfBox);
    router.get('/service/download/:token', invokerController.download);
    router.post('/service/upload/:token', formidableMiddleware(), invokerController.upload);

    router.get('/reporte/casillas', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER, appConstants.PROFILE_REGISTER_QUERY], req, res, next);
    }, reporteController.reporteCasillas);
    router.get('/reporte/notificaciones', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, reporteController.reporteNotificaciones);
    router.get('/reporte/usuarios', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, reporteController.reporteUsuarios);
    router.get('/reporte/usuariosHistorico', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, reporteController.reporteUsuariosHistorico);

    router.post('/representative/save', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, formidableMiddleware(), representativeController.save);

    router.post('/representative/official/save', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, formidableMiddleware(), representativeController.saveOfficial);

    router.get('/representative/official/list', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, formidableMiddleware(), representativeController.list);

    router.post('/person/save', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, formidableMiddleware(), personController.save);
    router.get('/person/findExiste', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN], req, res, next);
    }, formidableMiddleware(), personController.findExiste);
    router.get('/person/findByDni', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_REGISTER, appConstants.PROFILE_ADMIN], req, res, next);
    }, formidableMiddleware(), personController.findByDni);

    //calendar
    router.get('/calendar', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, formidableMiddleware(), calendarController.fetchAll);
    router.get('/calendar/one', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, formidableMiddleware(), calendarController.findById);
    router.post('/calendar/save', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, formidableMiddleware(), calendarController.save);
    router.put('/calendar/update', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, formidableMiddleware(), calendarController.update);
    router.post('/resend/communication', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_NOTIFIER, appConstants.PROFILE_REGISTER], req, res, next);
    }, userController.resendEmailAndSms);
    router.post('/reporteLecturaNotification', function (req, res, next) {
        authFilterRole([appConstants.PROFILE_ADMIN, appConstants.PROFILE_REGISTER, appConstants.PROFILE_NOTIFIER], req, res, next);
    }, notificationController.reporteLecturaNotification);

    router.all('/*', (req, res) => {
        res.status('404').sendFile(path.join(__dirname, '../error/index.html'));
    });

    return router;
};

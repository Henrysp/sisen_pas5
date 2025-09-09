/**
 * Created by Angel Quispe
 */
const utils = require('./../common/utils');
const userService = require('./../services/userService');
const calendarService = require('./../services/calendarService');
const candidateService = require('./../services/candidateService');
const inboxService = require('./../services/inboxService');
const emailService = require('./../services/emailService');
const jwtService = require('./../services/jwtService');
const appConstants = require('./../common/appConstants');
const errors = require('./../common/errors');
const fs = require('fs');
const archiver = require('archiver');
const request = require('request-promise');
const logger = require('./../server/logger').logger;
const notificationService = require('./../services/notificationService');
const representativeService = require('./../services/representativeService');

require('./../services/colas/kitchen');
const placeOrder = require('./../services/colas/waiter');
const {isReadable} = require('stream');
const ubigeoService = require("../services/ubigeoService");


const users = async (req, res, next) => {
    const {search, page, count, estado, fechaInicio, fechaFin, ordenFec} = req.body;

    if (!page || !count || search === undefined) {
        return res.sendStatus(400);
    }

    if (!utils.validNumeric(page) ||
        !utils.validNumeric(count)) {
        return res.sendStatus(400);
    }

    //Validacion del calendario
    await calendarService.updateEstate();

    let result = await userService.getUsersCitizen(search.toLowerCase().trim(), page, count, estado, fechaInicio, fechaFin, ordenFec);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    let response = {
        success: true,
        recordsTotal: result.recordsTotal,
        page: page,
        count: count,
        Items: result.users
    }

    return res.json(response);
}

/*const searchUserLDAP = async (req, res, next) => {
    const {usuario, password, recaptcha, profile} = req.body;

    if (utils.isEmpty(usuario) || utils.isEmpty(password) || utils.isEmpty(recaptcha) || utils.isEmpty(profile)) {
        return res.sendStatus(400);
    }

    if (process.env.DISABLED_RECAPTCHA === 'false' && !await recaptchaService.isValid(recaptcha, req.ip)) {
        return res.sendStatus(400);
    }

    const result = await loginService.login(usuario, password, profile);

    if (!result.jwtToken) {
        return res.json({success: false, error: result.error});
    }

    let response = {success: true, token: result.jwtToken, updated_password: result.updated_password};

    return res.json(response);
}*/

// controllers/userController.js

//const userService = require('../service/userService');

const searchUserLDAP = async (req, res) => {
  const ldapUsername = req.query.ldap_username;
  try {
    const data = await userService.searchUserLDAP(ldapUsername);
    if (data) {
      res.json({ success: true, message: data });
    } else {
      res.status(200).json({ success: false, message: 'Usuario no existe en el directorio LDAP', data: {} });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor', data: {} });
  }
};


const person = async (req, res, next) => {
    const {docType, doc} = req.body;

    if (utils.isEmpty(docType) || utils.isEmpty(doc)) {
        return res.sendStatus(400);
    }

    let resultUser = await userService.getUserCitizen(docType, doc);

    if (resultUser.success) {
        return res.json({success: false, error: errors.CREATE_BOX_EXIST_BOX_TO_CANDIDATE});
    }

    let result = await candidateService.getCandidate(docType, doc);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    let response = {
        success: true,
        person: {
            name: result.names
        }
    }

    return res.json(response);
}

const createBox = async (req, res, next) => {
    let box = req.fields;
    let files = req.files;
    let rep = {};

    let countFilesBox = 0;
    let countFilesRep = 0;

    for (const num of Object.keys(files)) {
        if (num.includes("fileBox")) countFilesBox = countFilesBox + 1;
        if (num.includes("fileRep")) countFilesRep = countFilesRep + 1;
    }

    if (utils.isEmpty(box.personType) ||
        utils.isEmpty(box.docType) ||
        utils.isEmpty(box.doc) ||
        utils.isEmpty(box.email) ||
        // utils.isEmpty(box.cellphone) ||
        utils.isEmpty(box.address) ||
        Object.keys(files).filter((x) => x.match(/^fileBox[0-9]{1,3}$/g)).length === 0 ||
        countFilesBox === 0) {
        return res.status(400).json({success: false, error: "Datos no válidos"});
    }

    if (box.personType === appConstants.PERSON_TYPE_PJ) {
        rep = JSON.parse(box.rep);

        if (utils.isEmpty(rep.email) ||
            utils.isEmpty(rep.cellphone)
            // ||
            // Object.keys(files).filter((x) => x.match(/^fileRep[0-9]{1,3}$/g)).length === 0 ||
            // countFilesRep === 0)
        )
        {
            return res.sendStatus(400);
        }

        if (!utils.isEmpty(rep.phone) && rep.phone.length < 6) {
            return res.status(400).json({success: false, error: "Teléfono fijo no válido"});
        }
    }

    if (!utils.validNumeric(box.cellphone) || box.cellphone.length < 9) {
        return res.status(400).json({success: false, error: "Celular no válido"});
    }

    if (!utils.isEmpty(box.phone) && box.phone.length < 6) {
        return res.status(400).json({success: false, error: "Teléfono fijo no válido"});
    }

    if (!utils.isEmpty(box.dateFiling) && !utils.isValidDate(box.dateFiling)) {
        return res.status(400).json({success: false, error: "Fecha de presentación no válida"});
    }

    box.doc = box.doc.toUpperCase();
    box.email = box.email.toLowerCase();

    let filesIndexRep = [];
    let filesIndexBox = [];
    let attachmentsRep = [];
    let attachmentsBox = [];
    for (let i = 1; i <= countFilesRep; i++) {
        filesIndexRep.push({index: i});
    }

    for (let i = 1; i <= countFilesBox; i++) {
        filesIndexBox.push({index: i});
    }

    let resultValidateFiles = await utils.validateFiles(files, filesIndexRep, 'fileRep');
    if (!resultValidateFiles.isValid) return res.status(400).json({success: false, error: resultValidateFiles.message});

    let resultValidateFilesBox = await utils.validateFiles(files, filesIndexBox, 'fileBox');
    if (!resultValidateFilesBox.isValid) return res.status(400).json({
        success: false,
        error: resultValidateFilesBox.message
    });

    let userExist = await inboxService.getApprovedInboxByDoc(box.doc_type, box.doc);
    if (userExist.success) {
        return res.status(400).json({success: false, error: errors.CREATE_BOX_EXIST_BOX_TO_CANDIDATE.message});
    }

    if (box.personType === appConstants.PERSON_TYPE_PN) {
        let emailExist = await inboxService.getApprovedInboxByEmail(box.email);
        if (emailExist.success) {
            return res.status(400).json({success: false, error: errors.CREATE_BOX_EXIST_BOX_TO_EMAIL.message});
        }

        let cellphoneExist = await inboxService.getApprovedInboxByCellphone(box.cellphone);
        if (cellphoneExist.success) {
            return res.status(400).json({success: false, error: errors.CREATE_BOX_EXIST_BOX_TO_CELLPHONE.message});
        }
    }

    for await (let file of filesIndexRep) {
        file.file = await utils.copyFile(
            files['fileRep' + file.index].path,
            appConstants.PATH_BOX,
            files['fileRep' + file.index].name,
            rep.doc,
            Date.now(),
            false,
            false
        );
        attachmentsRep.push(file.file);
    }

    for await (let file of filesIndexBox) {
        file.file = await utils.copyFile(
            files['fileBox' + file.index].path,
            appConstants.PATH_BOX,
            files['fileBox' + file.index].name,
            box.doc,
            Date.now(),
            false,
            false
        );
        attachmentsBox.push(file.file);
    }
    let creatorUserName = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname : '');
    let result = await userService.createUserCitizen(box, req.user, attachmentsBox, attachmentsRep, creatorUserName.trim());

    /*placeOrder.placeOrder(box)
        .then((job) => {
            console.log('\n Se creó la casilla y ahora se inicia la notificación \n ');
        })
        .catch(() => {
            console.log('\n Se creó la casilla y No se pudo realizar la notificación" \n ');
        });
    */
    return res.json(result);
}

const downloadAttachments = async (req, res, next) => {
    const {id} = req.query;
    let result = await userService.getUserCitizenById(id);

    if (result.success) {
        if (result.data.attachments === undefined) {
            return res.json({success: false, error: 'No se encontraron registros'});
        }
        try {
            res.writeHead(200, {
                'Content-Type': 'application/zip',
                'Content-disposition': 'attachment; filename=myFile.zip'
            });
            var zip = archiver('zip', {gzip: true, zlib: {level: 9}});
            zip.pipe(res);
            for (file of result.data.attachments) {
                const path_upload = process.env.PATH_UPLOAD;
                const content = fs.readFileSync(path_upload + '/' + file.path);
                zip.append(content, {name: file.name});
            }
            zip.finalize();
        } catch (err) {
            zip.finalize();
            return res.json({success: false, error: err});
        }
    } else {
        return res.json({success: false, error: 'No se encontraron registros'});
    }
}

const searchPerson = async (req, res, next) => {
    const {dni} = req.query;
    let result = null;

    try {
        let response = await request({
            uri: `${process.env.URL_RENIEC}`,
            method: 'POST',
            json: true,
            body: {
                codigo: process.env.CODIGO_RENIEC,
                clave: process.env.CLAVE_RENIEC,
                dni: dni,
            },
            resolveWithFullResponse: true
        });

        if (response.statusCode === 200) {
            result = {statusCode: response.statusCode, body: response.body};
        }

    } catch (err) {
        console.error('Error validating questions in questionService: ' + err);
        result = {statusCode: err.statusCode, body: err.error};
    }
    return res.json(result);
};

const searchRuc = async (req, res, next) => {
    const {ruc} = req.query;
    let result = {success: false};
    let data = {};

    try {
        if (process.env.DISABLED_API_SUNAT !== 'true') {
            let params = {
                uri: `${process.env.URL_SUNAT}`,
                qs: {
                    numruc: ruc,
                    out: 'json'
                },
                headers: {
                    'Accept': 'application/json'
                },
                resolveWithFullResponse: true
            };
            let response = await request(params);

            if (response.statusCode === 200) {
                let responseBody = JSON.parse(response.body);

                if (responseBody.list.multiRef) {
                    let newData = responseBody.list.multiRef;
                    data.organizationName = (newData.ddp_nombre.$).trim();
                    data.type = newData.desc_identi.$;
                    data.ruc = newData.ddp_numruc.$;

                    result.data = data;
                    result.success = true;
                }
            }
        } else {
            result.data = {
                organizationName: 'ONPE || pruebas',
                ruc: ruc
            }
            result.success = true;
        }
    } catch (err) {
        console.error('Error getting data for API SUNAT: ' + err);
    }

    return res.json(result);
};

// const searchCasilla = async (req, res, next) => {
//   const { doc, type } = req.query;
//
//   let userExist = await userService.getUserCitizen(type, doc);
//
//   if (userExist.success) {
//     return res.json({ success: false, error: errors.CREATE_BOX_EXIST_BOX_TO_CANDIDATE });
//   }
//   return res.json({ success: true });
//
// };

const box = async (req, res, next) => {
    const {docType, doc} = req.body;

    if (utils.isEmpty(docType) || utils.isEmpty(doc)) {
        return res.sendStatus(400);
    }

    let result = await inboxService.getInboxUserCitizen(docType, doc, req.token);

    return res.json({result});
}

const downloadPdfBox = async (req, res, next) => {
    const {token, inbox, type} = req.query;

    if (utils.isEmpty(token) || utils.isEmpty(inbox) || utils.isEmpty(type)) {
        return res.sendStatus(400);
    }

    const resultVerifyToken = await jwtService.verifyToken(token, appConstants.PROFILE_REGISTER);

    if (!resultVerifyToken) {
        return res.sendStatus(401);
    }

    const resultPdfBox = await inboxService.downloadPdfInbox(inbox, type);

    if (!resultPdfBox.success) {
        return res.json(resultPdfBox);
    }

    const content = fs.readFileSync(resultPdfBox.pathfile);

    if (content) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=' + resultPdfBox.filename);
        res.send(content);

        return res;
    }

    return res.sendStatus(400);

}

const download = async (req, res, next) => {
    const {path} = req.query;

    if (utils.isEmpty(path)) {
        return res.sendStatus(400);
    }
    const path_upload = process.env.PATH_UPLOAD;

    const content = fs.readFileSync(path_upload + '/' + path);

    if (content) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=' + content.filename);
        res.send(content);

        return res;
    }

    return res.sendStatus(400);
}

const deleteCitizen = async (req, res, next) => {
    const {doc, docType} = req.body;

    if (utils.isEmpty(docType) ||
        utils.isEmpty(doc)) {
        return res.sendStatus(400);
    }

    let result = await userService.deleteCitizen(docType, doc);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    return res.json(result);
}

const sendEmailEstateInbox = async (req, res, next) => {
    const Body = req.body;

    var email = Body.email;
    var estado = Body.estado;
    var nombre = Body.nombres;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }
    let result = await emailService.sendEmailEstateInbox(nombre, email, estado);
    return res.json(result);
}

const deleteUser = async (req, res, next) => {
    const {doc, docType} = req.body;

    if (utils.isEmpty(docType) ||
        utils.isEmpty(doc)) {
        return res.sendStatus(400);
    }

    let result = await userService.deleteUser(docType, doc);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    return res.json(result);
}

const createUser = async (req, res, next) => {
    try {
        let user = req.body;
        let usuarioRegistro = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname: '' );
        let usuarioRegistroid = req.user.id;
        if (
            utils.isEmpty(user.doc) ||
            utils.isEmpty(user.name) ||
            utils.isEmpty(user.email) ||
            utils.isEmpty(user.UUOO)) {
            return res.sendStatus(400);
        }

        let result = await userService.newUser(user.docType, user.doc, user.profiles, user.name, user.lastname, user.second_lastname, user.email, user.UUOO, user.UUOO_name, user.LDAP, usuarioRegistro, usuarioRegistroid);
        return res.json(result);
    } catch (ex) {
        logger.error(ex);
        next({success: false, error: 'error'});
    }
}

const editUser = async (req, res, next) => {
    try {
        let usuarioRegistro = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname: '' );
        let usuario = req.user.id;
        let user = req.body;
        if (utils.isEmpty(user.email) ||
            utils.isEmpty(user.UUOO_name) ||
            utils.isEmpty(user.UUOO)) {
            return res.sendStatus(400);
        }

        let result = await userService.editUser(user.id, user.UUOO, user.UUOO_name, user.email, user.profiles, usuarioRegistro, usuario);
        return res.json(result);
    } catch (ex) {
        logger.error(ex);
        next({success: false, error: 'error'});
    }
}

const listUsers = async (req, res, next) => {
    const {search, page, count, estado, profile, fechaInicio, fechaFin, ordenFec} = req.body;

    if (!page || !count || search === undefined) {
        return res.sendStatus(400);
    }

    if (!utils.validNumeric(page) ||
        !utils.validNumeric(count)) {
        return res.sendStatus(400);
    }

    let result = await userService.getUsers(search.toLowerCase().trim(), page, count, estado, profile, fechaInicio, fechaFin, ordenFec);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    let response = {
        success: true,
        recordsTotal: result.recordsTotal,
        page: page,
        count: count,
        Items: result.users
    }

    return res.json(response);
}

const getUserCitizenById = async (req, res, next) => {
    const {id} = req.query;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }
    let result = await userService.getUserCitizenById(id);
    return res.json(result);
}

const searchUser = async (req, res, next) => {
    const {doc, type} = req.query;

    console.log("doc: ", doc, " type: ", type);
    let exist = await userService.existUserRegister(type,doc);

    if (exist) {
        return res.json({success: false, error: 'Ya existe un usuario registrado con el mismo número de documento'});
    }

    return res.json({success: true});
};

const searchUserLDAPMongo = async (req, res, next) => {
    const {usuario} = req.query;

    if (utils.isEmpty(usuario)) {
        return res.sendStatus(400);
    }

    console.log("usuario" + usuario);

    let exist = await userService.existUserRegisterLDAP(usuario);

    if (exist) {
        return res.json({success: false, error: 'Ya existe un usuario registrado con LDAP ' + usuario});
    }

    return res.json({success: true});
};
const getUserById = async (req, res, next) => {
    const {id} = req.query;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }
    let result = await userService.getUserById(id);
    return res.json(result);
}

const getUserCitizenDetailById = async (req, res, next) => {
    const {id, atender} = req.query;
    const token = req.token;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }

    let result = await userService.getUserCitizenDetailById(id, token, atender);
    return res.json(result);
}

const getUserCitizenDetailByIdEdit = async (req, res, next) => {
    const {id, atender} = req.query;
    const token = req.token;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }

    let result = await userService.getUserCitizenDetailByIdEdit(id, token, atender);
    return res.json(result);
}

const getUserCitizenDetailPjById = async (req, res, next) => {
    const {id, atender} = req.query;
    const token = req.token;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }
    let result = await userService.getUserCitizenDetailPjById(id, token, atender);
    return res.json(result);
}

const updateEstateInbox = async (req, res, next) => {
    const body = req.body;

    const iduser = body.idUser;
    const status = body.estado;
    const motive = body.motivo;
    const name = body.name;
    const email = body.email;
    const sessionUser = req.user;

    if (utils.isEmpty(iduser)) {
        return res.sendStatus(400);
    }

    const result = await userService.updateEstateInbox(iduser, status, motive, name, email, sessionUser);

    if (result.pendingInbox && (result.pendingInbox.doc_type === 'ruc' || result.pendingInbox.doc_type === 'pr')) {
        await representativeService.updateApprove(iduser, sessionUser, status);
    }

    return res.json(result);
}
const validarLogClaridad = async (req, res, next) => {
    let result = {};
    userService.getLogClaridad();
    result.message = `Se inicia el proceso para enviar notificaciones no registradas`;
    return res.json(result);
}

const validarCasilla = async (req, res, next) => {
    let casilla = req.fields;
    let [isValid, message] = validarCampos(casilla);
    if (!isValid) {
        return res.status(400).send({success: false, message: message});
    }
    const result = await userService.getUserCasilla(casilla.docType, casilla.doc);
    return res.status(!result ? 404 : 200).json({
        "success": result.success,
        "message": (result.success) ? result.message : result.error,
        ...(result.success && { "email": result.email })
    });
}

function validarCampos(casilla) {
    const errors = [];
    const { docType, doc } = casilla;

    if (Object.keys(casilla).length !== 2) {
        errors.push("Número de campos no válido");
    }

    if (utils.isEmpty(docType) || utils.isEmpty(doc)) {
        errors.push("Datos no válidos");
    }

    const validDocTypes = ["dni", "ce", "ruc", "pr"];
    if (!validDocTypes.includes(docType)) {
        errors.push("Tipo de documento no válido");
    }

    if (docType && doc) {
        const docStr = String(doc);
        switch (docType) {
            case "dni":
                if (docStr.length !== 8) {
                    errors.push("Documento no válido");
                }
                break;

            case "ce":
                if (docStr.length < 8 || docStr.length > 12) {
                    errors.push("Documento no válido");
                }
                break;

            case "ruc":
                if (docStr.length !== 11 || !docStr.startsWith('20')) {
                    errors.push("Documento RUC no válido");
                }
                break;

            case "pr":
                break;
        }
    }

    const isValid = errors.length === 0;
    const message = errors.join(", ");

    return [isValid, message];
}

const searchCE = async (req, res, next) => {
    const {doc, type} = req.query;

    let exist = await userService.existCE(doc, type);

    if (exist) {
        let response = {
            success: true,
            name: exist.name,
            lastname: exist.lastname != null ? exist.lastname : null,
            second_lastname: exist.second_lastname != null ? exist.second_lastname : null
        }
        return res.json(response);
    }
    return res.json({success: false});
};

const searchCasilla = async (req, res, next) => {
    const {doc, type} = req.query;

    let userExist = await inboxService.getApprovedInboxByDoc(type, doc);

    if (userExist.success) {
        return res.json({success: false, error: errors.CREATE_BOX_EXIST_BOX_TO_CANDIDATE});
    }

    return res.json({success: true});
};

const searchCasillaNroexpediente = async (req, res, next) => {
    const {nro_expediente} = req.query;
    let casillaExist = await inboxService.getInboxXNroexpediente(nro_expediente);
    if (casillaExist.success) {
        return res.json({success: false, error: errors.CREATE_BOX_EXIST_BOX_TO_CANDIDATE});
    }
    return res.json({success: true});
}

const resendEmailAndSms = async (req, res, next) => {
    const data = req.body;
    const token = req.token;

    if (utils.isEmpty(data.mode)) {
        return res.sendStatus(400);
    }

    if (data.mode === 'notification') {
        if (utils.isEmpty(data.notificationId)) {
            return res.sendStatus(400);
        }
    } else {
        if (utils.isEmpty(data.userId)) {
            return res.sendStatus(400);
        }
    }

    if (data.sendType === 'email') {
        if (utils.isEmpty(data.email)) {
            return res.sendStatus(400);
        }
    }

    if (data.sendType === 'sms') {
        if (utils.isEmpty(data.cellphone)) {
            return res.sendStatus(400);
        }
    }

    let result = data.mode === 'notification' ? await userService.resendEmailAndSmsNotification(data) : await userService.resendEmailAndSms(data);
    return res.json(result);
}
const consultSiscom = async (req, res, next) => {
    try {
        const { usersData } = req.body;
        console.log(usersData)
        let result = await userService.consultExistInbox(usersData);
        res.json({
            message: 'Se inicia el proceso de consulta de casilla',
            data: result
        });
    } catch (error) {
        next(error);
    }
}
const profilesAvailable = async (req, res, next) => {
    const {id,profile} = req.query;

    if (utils.isEmpty(id) || utils.isEmpty(profile)) {
        return res.sendStatus(400);
    }
    let result = await userService.profilesAvailable(id,profile);
    return res.json(result);
}
const userDisable = async (req, res, next) => {
    let usuarioRegistro = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname: '' );
    let usuario = req.user.id;
    const {id,motivo} = req.body;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }
    let result = await userService.userDisable(id,motivo,usuarioRegistro, usuario);
    return res.json(result);
}
const userEnable = async (req, res, next) => {
    let usuarioRegistro = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname: '') ;
    let usuario = req.user.id;
    const {id,motivo} = req.body;

    if (utils.isEmpty(id)) {
        return res.sendStatus(400);
    }
    let result = await userService.userEnable(id,motivo,usuarioRegistro, usuario);
    return res.json(result);
}
const bulkDisableUsers = async (req, res, next) => {
    let usuarioRegistro = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname: '' );
    let usuario = req.user.id;

    if (!req.file || !req.file.buffer){
        return res.status(400).json({ error: 'No se envió ningún archivo.' })
    }
    const {buffer} = req.file;

    // if (!buffer) {
    //     return res.status(400).json({ message: 'No se envió ningún archivo.' });
    // }

    // return res.json(await userService.DisableUsers(buffer,usuarioRegistro, usuario));

    const resultado = await userService.DisableUsers(buffer, usuarioRegistro, usuario);

    if (resultado.success) {
        // res.setHeader('Content-Disposition', 'attachment; filename=ReporteDeshabilitacion.xlsx');
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // return res.send(resultado.file);
        return res.status(200).json(resultado);
    } else {
        return res.status(200).json({ success:false, message: resultado.error });
    }
}
const userCitizenDisable = async (req, res, next) => {
    let usuarioRegistro = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname: '' );
    let usuario = req.user.id;
    const {official,motivo} = req.body;

    if (!official) {
        return res.sendStatus(400);
    }
    let result = await userService.userCitizenDisable(official,motivo,usuarioRegistro, usuario);
    return res.json(result);
}
const userCitizenEnable = async (req, res, next) => {
    let usuarioRegistro = req.user.name + ' ' + req.user.lastname + ' ' + (req.user.second_lastname? req.user.second_lastname: '' );
    let usuario = req.user.id;
    const {official,motivo} = req.body;

    if (!official) {
        return res.sendStatus(400);
    }
    let result = await userService.userCitizenEnable(official,motivo,usuarioRegistro, usuario);
    return res.json(result);
}
const inboxStatusChange = async (req, res, next) => {
    let usuarioRegistro = req.user.name + ' ' + req.user.lastname + (req.user.second_lastname? ' ' + req.user.second_lastname : '' );
    let usuario = req.user.id;
    const {id,motivo,change} = req.body;

    if (utils.isEmpty(id) || utils.isEmpty(change) ) {
        return res.sendStatus(400);
    }
    let result = change === 'disable' ? await userService.inboxDisable(id,motivo,usuarioRegistro, usuario) : await userService.inboxEnable(id,motivo,usuarioRegistro, usuario);
    return res.json(result);
}
const getUUOO = async (req, res, next) => {
    try {
        let result = await userService.getUUOO();
        return res.json(result);
    } catch (ex) {
        logger.error(ex);
        next({success: false, error: 'error'});
    }
}
const getProcesses = async (req, res, next) => {
    try {
        let result = await userService.getProcessesActive();
        return res.json(result);
    } catch (ex) {
        logger.error(ex);
        next({success: false, error: 'error'});
    }
}
module.exports = {
    users,
    person,
    createBox,
    box,
    downloadPdfBox,
    deleteCitizen,
    deleteUser,
    searchPerson,
    searchRuc,
    searchCasilla,
    createUser,
    editUser,
    listUsers,
    getUserCitizenById,
    download,
    validarLogClaridad,
    validarCasilla,
    downloadAttachments,
    searchUser,
    searchCE,
    getUserCitizenDetailById,
    getUserCitizenDetailPjById,
    updateEstateInbox,
    sendEmailEstateInbox,
    searchCasillaNroexpediente,
    getUserCitizenDetailByIdEdit,
    resendEmailAndSms,
    consultSiscom,
    searchUserLDAPMongo,
    getUserById,
    profilesAvailable,
    searchUserLDAP,
    userDisable,
    userEnable,
    bulkDisableUsers,
    userCitizenDisable,
    userCitizenEnable,
    inboxStatusChange,
    getUUOO,
    getProcesses
};

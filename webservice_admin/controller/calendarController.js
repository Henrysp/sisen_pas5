/**
 * @author Alexander Llacho
 */

const logger = require('./../server/logger').logger;
const calendarService = require('./../services/calendarService');
const utils = require('./../common/utils');
const appConstants = require("../common/appConstants");
const fs = require("fs");

const typeFiles = ["application/pdf", "image/jpg", "image/jpeg", "image/png", "image/bmp", "image/x-ms-bmp"];

const fetchAll = async (req, res, next) => {
    const data = req.query;
    let content = await calendarService.fetchAll(parseInt(data.page), parseInt(data.size), data.filters);
    return res.json(content);
}

const findById = async (req, res, next) => {
    const data = req.query;

    if (utils.isEmpty(data.id)) {
        return res.status(400).json({success: false, error: "Datos no válidos"});
    }

    return res.json(await calendarService.findById(data.id));
}

const save = async (req, res, next) => {
    let data = req.fields;
    let files = req.files;
    let isValid = true;
    let message = "";
    let file;

    if (utils.isEmpty(data.title) ||
        utils.isEmpty(data.dateBegin)) {
        return res.status(400).json({success: false, error: "Datos no válidos"});
    }

    let rangeDate = await calendarService.rangoFechas(data.dateBegin, data.dateEnd);

    var date = new Date(data.dateBegin);
    var primerDia = new Date(date.getFullYear(), date.getMonth(), 1);
    var date1 = new Date(data.dateEnd);
    var ultimoDia = new Date(date1.getFullYear(), date1.getMonth() + 1, 0);
    let content = await calendarService.findByRangeDate('', primerDia, ultimoDia);
    if(content.success){ 
        for (let index = 0; index < rangeDate.length; index++) {
            if(content.data.indexOf(rangeDate[index]) != -1){
                return res.status(400).json({success: false, error: 'Hay feriados en el rango de fechas.'});
            } 
        }
    }

    let countFiles = Object.keys(files).length;
    let _files = [];
    let attachments = [];

    for (let i = 1; i <= countFiles; i++) {
        _files.push({index: i});
    }

    for await (file of _files) {
        if (files['file' + file.index].size === 0 || files['file' + file.index].size > appConstants.TAM_MAX_FILE_CALENDAR) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${files['file' + file.index].name} tiene tamaño no válido`;
            break;
        }
        if (!typeFiles.includes(files['file' + file.index].type)) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${files['file' + file.index].name} debe ser formato PDF, JPEG, JPG, PNG o BMP`;
            break;
        }
        const signedFile = fs.readFileSync(files['file' + file.index].path);
        if (!utils.validateByteFile(files['file' + file.index].type, signedFile)) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${files['file' + file.index].name} está dañado o no es válido`;
        }
    }

    if (!isValid) {
        return res.status(400).json({success: false, error: message});
    }

    for await (file of _files) {
        file.file = await utils.copyFile(
            files['file' + file.index].path,
            appConstants.PATH_CALENDAR,
            files['file' + file.index].name,
            data.doc,
            Date.now(),
            false,
            false);
        attachments.push(file.file);
    }
    return res.json(await calendarService.save(data, attachments, rangeDate.toString()));
}

const update = async (req, res, next) => {
    let data = req.fields;
    let files = req.files;
    let isValid = true;
    let message = "";
    let file;

    if (utils.isEmpty(data.id) ||
        utils.isEmpty(data.title) ||
        utils.isEmpty(data.dateBegin)) {
        return res.status(400).json({success: false, error: "Datos no válidos"});
    }

    let rangeDate = await calendarService.rangoFechas(data.dateBegin, data.dateEnd);

    var date = new Date(data.dateBegin);
    var primerDia = new Date(date.getFullYear(), date.getMonth(), 1);
    var date1 = new Date(data.dateEnd);
    var ultimoDia = new Date(date1.getFullYear(), date1.getMonth() + 1, 0);
    let content = await calendarService.findByRangeDate(data.id, primerDia, ultimoDia);
    if(content.success){ 
        for (let index = 0; index < rangeDate.length; index++) {
            if(content.data.indexOf(rangeDate[index]) != -1){
                return res.status(400).json({success: false, error: 'Hay feriados en el rango de fechas.'});
            } 
        }
    }

    let _files = [];
    let attachments = [];

    if(data.filesDisabled !== "0"){
        for (let i = 1; i <= Object.keys(files).length; i++) {
            _files.push({index: i});
        }

        for await (file of _files) {
            if (files['file' + file.index].size === 0 || files['file' + file.index].size > appConstants.TAM_MAX_FILE_CALENDAR) {
                isValid = false;
                message += ((message.length > 0) ? ", " : "") + `El archivo ${files['file' + file.index].name} con tamaño no válido`;
                break;
            }
            if (!typeFiles.includes(files['file' + file.index].type)) {
                isValid = false;
                message += ((message.length > 0) ? ", " : "") + `El archivo ${files['file' + file.index].name} debe ser formato PDF, JPEG, JPG, PNG o BMP`;
                break;
            }
            const signedFile = fs.readFileSync(files['file' + file.index].path);
            if (!utils.validateByteFile(files['file' + file.index].type, signedFile)) {
                isValid = false;
                message += ((message.length > 0) ? ", " : "") + `El archivo ${files['file' + file.index].name} está dañado o no es válido`;
            }
        }

        if (!isValid) {
            return res.status(400).json({success: false, error: message});
        }

        for await (file of _files) {
            file.file = await utils.copyFile(
                files['file' + file.index].path,
                appConstants.PATH_CALENDAR,
                files['file' + file.index].name,
                data.doc,
                Date.now(),
                false,
                false);
            attachments.push(file.file);
        }
    }

    return res.json(await calendarService.update(data, attachments, rangeDate.toString()));
}

module.exports = {
    fetchAll,
    findById,
    save,
    update
};

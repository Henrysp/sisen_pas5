const representativeService = require('./../services/representativeService');
const utils = require('./../common/utils');
const appConstants = require('./../common/appConstants');
const fs = require("fs");


const save = async (req, res) => {
    let data = req.fields;
    let files = req.files;
    let sessionUser = req.user;

    if (
        utils.isEmpty(data.docType) ||
        utils.isEmpty(data.doc) ||
        utils.isEmpty(data.names) ||
        utils.isEmpty(data.lastname + data.second_lastname) ||
        utils.isEmpty(data.email) ||
        utils.isEmpty(data.cellphone) ||
        utils.isEmpty(data.position) ||
        // utils.isEmpty(data.documentTypeAttachment) || data.documentTypeAttachment === 'undefined' ||
        utils.isEmpty(data.userId) /*||
        Object.keys(files).length === 0*/) {
        return res.status(400).json({success: false, error: "Datos no válidos"});
    }

    let countFiles = Object.keys(files).length;
    let filesIndex = [];
    let attachments = [];

    for (let i = 1; i <= countFiles; i++) {
        filesIndex.push({index: i});
    }

    let resultValidateFiles = await utils.validateFiles(files, filesIndex, 'file');
    if (!resultValidateFiles.isValid) return res.status(400).json({success: false, error: resultValidateFiles.message});

    for await (let file of filesIndex) {
        file.file = await utils.copyFile(
            files['file' + file.index].path,
            appConstants.PATH_BOX,
            files['file' + file.index].name,
            data.doc,
            Date.now(),
            false,
            false);
        attachments.push(file.file);
    }

    let response = await representativeService.save(data, attachments, sessionUser,false);

    return res.status(200).json(response);
}

const saveOfficial = async (req, res) => {
    let data = req.fields;
    let files = req.files;
    let sessionUser = req.user;

    if (utils.isEmpty(data.docType) ||
        utils.isEmpty(data.doc) ||
        utils.isEmpty(data.names) ||
        utils.isEmpty(data.lastname + data.second_lastname) ||
        utils.isEmpty(data.email) ||
        utils.isEmpty(data.cellphone) ||
        utils.isEmpty(data.position) ||
        utils.isEmpty(data.userId) ||
        Object.keys(files).length === 0) {
        return res.status(400).json({success: false, error: "Datos no válidos"});
    }
    let filesIndex = [];
    let attachments = [];
    filesIndex.push({index: 1});

    let resultValidatedFiles = await utils.validateFiles(files, filesIndex, 'file');
    if (!resultValidatedFiles.isValid) return res.status(400).json({success: false, error: resultValidatedFiles.message});

    for await (let file of filesIndex) {
        file.file = await utils.copyFile(
            files['file' + file.index].path,
            appConstants.PATH_BOX,
            files['file' + file.index].name,
            data.doc,
            Date.now(),
            false,
            false);
        attachments.push(file.file);
    }
    let response = await representativeService.saveOfficial(data, attachments, sessionUser);

    return res.status(200).json(response);
}
const list = async (req, res) => {
    const {id} = req.query;

    let response = await representativeService.listOfficials(id);

    return res.status(200).json(response);
}

module.exports = {save, saveOfficial, list};

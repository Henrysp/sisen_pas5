/**
 * @author Alexander Llacho
 */

const logger = require('./../server/logger').logger;
const urlShortenerService = require('./../services/urlShortenerService');
const utils = require('./../common/utils');
const appConstants = require("../common/appConstants");
const fs = require("fs");


const findByCode = async (req, res, next) => {
    const {code} = req.params;

    if (utils.isEmpty(code)) {
        return res.status(400).json({success: false, error: "Datos no válidos"});
    }

    return res.json(await urlShortenerService.findByCode(code));
}

module.exports = {
    findByCode,
};

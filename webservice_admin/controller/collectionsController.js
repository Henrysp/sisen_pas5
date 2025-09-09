const logger = require('./../server/logger').logger;
const collectionService = require('./../services/collectionsService');
const utils = require('./../common/utils');
const Json2csvParser = require("json2csv").Parser;
const convert = require("json2csv").convert;
const fs = require("fs");

const exportCollection = async (req, res, next) => {
    try {
        const { name, label } = req.query;
        logger.debug('parametros', req.query);

        if (utils.isEmpty(name)) {
            return res.sendStatus(400);
        }
        logger.debug('iniciando descarga');
        let data = await collectionService.getCollection(name);
        const json2csvParser = new Json2csvParser({ header: true });
        let data_string = JSON.stringify(data);
        data_string = data_string.replace(/\\n/g, '');
        const content = json2csvParser.parse(JSON.parse(data_string));

        const path = `${process.env.PATH_UPLOAD}/${name}_${new Date().getTime()}.csv`;
        fs.writeFileSync(path, content,{encoding: 'utf8'});
        const readFile = fs.readFileSync(path,{encoding: 'utf8'});
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=' + label + ".csv");
        res.send(readFile);
    } catch (e) {
        logger.error("Error al exportar coleccion", e);
        next();
    }
}
const getCollectionsInfo = async (req, res, next) => {
    try {
        const data = await collectionService.getCollectionInfo();
        res.json(data);
    } catch (e) {
        logger.error("Error al exportar coleccion", e);
        next();
    }
}
module.exports = { exportCollection, getCollectionsInfo};
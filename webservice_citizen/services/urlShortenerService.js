/**
 * @author Alexander Llacho
 */
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const mongoCollections = require('./../common/mongoCollections');


const findByCode = async (code) => {
    const db = await mongodb.getDb();

    try {
        const result = await db.collection(mongoCollections.NOTIFICATION_URL_SHORTENER).findOne({code: code});

        if (result != null) {
            return {success: true, data: result.url_original};
        }
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

module.exports = {
    findByCode,
};

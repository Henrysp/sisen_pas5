/**
 * Created by Alexander Llacho
 */
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const mongoCollections = require('./../common/mongoCollections');


const saveHistory = async (event, id) => {
    let event_history = {
        event: event,
        collection: mongoCollections.USERS,
        id: id,
        date: new Date()
    }

    try {
        const db = await mongodb.getDb();
        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

module.exports = {saveHistory};

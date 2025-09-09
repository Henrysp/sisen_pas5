/**
 * Created by Alexander Llacho
 */
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const errors = require('./../common/errors');
const utils = require('./../common/utils');
const appConstants = require('./../common/appConstants');
const mongoCollections = require('./../common/mongoCollections');
const ObjectId = require('mongodb').ObjectId;

const getInboxs = async (docType, doc, user_id) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            doc: doc,
            doc_type: docType
        }

        let cursor = await db.collection(mongoCollections.INBOX).find(filter);

        let inboxs = [];

        for await(const inbox of cursor) {
            inboxs.push({id: inbox._id.toString()});
        }

        return {success: true, inboxs: inboxs};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

module.exports = {getInboxs};
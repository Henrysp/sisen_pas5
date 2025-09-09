
const mongodb = require('./../database/mongodb');
const mongoCollections = require('./../common/mongoCollections');
const utils = require('./../common/utils');

const getCollection = async (name) => {
    const db = await mongodb.getDb();
    const collection = await db.collection(name).find().toArray();
    return collection;
}
const getCollectionInfo = async () => {
    const db = await mongodb.getDb();
    const collections = [{
        label: 'USUARIOS',
        name: mongoCollections.USERS,
        lastUpdate: utils.getDate(),
        count: await db.collection(mongoCollections.USERS).count()
    }, {
        label: 'CATÁLOGO',
        name: mongoCollections.CATALOG,
        lastUpdate: utils.getDate(),
        count: await db.collection(mongoCollections.CATALOG).count()
    }, {
        label: 'HISTORIAL DE EVENTOS',
        name: mongoCollections.EVENT_HISTORY,
        lastUpdate: utils.getDate(),
        count: await db.collection(mongoCollections.EVENT_HISTORY).count()
    }, {
        label: 'CASILLAS',
        name: mongoCollections.INBOX,
        lastUpdate: utils.getDate(),
        count: await db.collection(mongoCollections.INBOX).count()
    }, {
        label: 'NOTIFICACIONES',
        name: mongoCollections.NOTIFICATIONS,
        lastUpdate: utils.getDate(),
        count: await db.collection(mongoCollections.NOTIFICATIONS).count()
    },
    {
        label: 'ORGANIZACIONES',
        name: mongoCollections.ORGANIZATIONS,
        lastUpdate: utils.getDate(),
        count: await db.collection(mongoCollections.ORGANIZATIONS).count()
    },
    {
        label: 'USUARIOS-CASILLA',
        name: mongoCollections.USER_INBOX,
        lastUpdate: utils.getDate(),
        count: await db.collection(mongoCollections.USER_INBOX).count()
    }];

    return collections;
}
module.exports = { getCollection, getCollectionInfo };



/**
 * Created by Angel Quispe
 */
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const errors = require('./../common/errors');
const mongoCollections = require('./../common/mongoCollections');
const ObjectID = require('mongodb').ObjectID;
const utils = require('./../common/utils');
const appConstants = require('./../common/appConstants');

function diacriticSensitiveRegex(string = '') {
    return string.replace(/a/g, '[a,á,à,ä]')
        .replace(/e/g, '[e,é,ë]')
        .replace(/i/g, '[i,í,ï]')
        .replace(/o/g, '[o,ó,ö,ò]')
        .replace(/u/g, '[u,ü,ú,ù]');
}

const getCatalogByType = async (type) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            type: type
        }

        let cursor = await db.collection(mongoCollections.CATALOG).find(filter);

        let catalogs = [];

        for await (const catalog of cursor) {
            catalogs.push({ code: catalog.code, value: catalog.value });
        }

        return { success: true, catalogs: catalogs };

    } catch (err) {
        logger.error(err);
        return { success: false, error: errors.INTERNAL_ERROR };
    }
}




const listCatalog = async (type) => {
    try {
        const db = await mongodb.getDb();
        let _filter = { type };

        let cursor = await db.collection(mongoCollections.CATALOG).find(_filter).sort({ create_date: -1 });
        let data = [];
        for await (const item of cursor) {
            data.push({
                value: item.value,
                code: item.code,
            });
        }
        return data ;

    } catch (err) {
        logger.error(err);
        return { success: false, error: errors.INTERNAL_ERROR };
    }
}

const paginateCatalog = async (search, page, count) => {
    try {
        const db = await mongodb.getDb();
        let _filter = {
            type:'procedure',
            $or: [/*{ type: new RegExp(diacriticSensitiveRegex(search), 'i') },*/
            { code: new RegExp(diacriticSensitiveRegex(search), 'i') },
            { value: new RegExp(diacriticSensitiveRegex(search), 'i') }
            ]
        };

        let cursor = await db.collection(mongoCollections.CATALOG).find(_filter).skip(page > 0 ? ((page - 1) * count) : 0).limit(count).sort({$natural:-1});
        let recordsTotal = await cursor.count();
        let data = [];
        for await (const item of cursor) {
            data.push({
                id: item._id,
                type: item.type,
                value: item.value,
                code: item.code,
            });
        }
        return { success: true, recordsTotal: recordsTotal, data: data, count: count };

    } catch (err) {
        logger.error(err);
        return { success: false, error: errors.INTERNAL_ERROR };
    }
}


const createCatalog = async (type, code, value, usuarioRegistro) => {
    const db = await mongodb.getDb();
    const filter = {
        type,
        code: new RegExp(diacriticSensitiveRegex(code), 'i')
    };
    const data = await db.collection(mongoCollections.CATALOG).findOne(filter);

    if (data) {
        return { success: false, error: 'Ya existe código registrado para el tipo seleccionado' };
    }

    const filter_name = {
        type,
        value: value
    }

    const data_name = await db.collection(mongoCollections.CATALOG).findOne(filter_name);

    if (data_name) {
        if(data_name.value.toUpperCase()===value.toUpperCase()) {
            return { success: false, error: 'Ya existe nombre registrado para el tipo seleccionado' };
        }
    }

    await db.collection(mongoCollections.CATALOG).insertOne({
        type,
        code,
        value,
        create_user: usuarioRegistro,
        create_date: utils.getDate(),
    });
    return { success: true };
}

const updateCatalog = async (id, type, value, valueold, usuarioRegistro) => {
    const db = await mongodb.getDb();

    const data_notifi = await db.collection(mongoCollections.NOTIFICATIONS).findOne({procedure: valueold},{_id:1});
    if(data_notifi) {
        return { success: false, error: 'Existen notificaciones asignadas a este proceso, no puede modificarse ni eliminarse'}
    }
    
    const filter_name = {
        type,
        value: value
    }

    const data_name = await db.collection(mongoCollections.CATALOG).findOne(filter_name);

    if (data_name) {
        if(data_name.value.toUpperCase()===value.toUpperCase()) {
            return { success: false, error: 'Ya existe nombre registrado para el tipo seleccionado' };
        }
    }

    const filter = {
        _id: ObjectID(id)
    };
    const data = await db.collection(mongoCollections.CATALOG).findOne(filter);

    if (!data) {
        return { success: false, error: 'Catálogo no existe' };
    }

    await db.collection(mongoCollections.CATALOG).update(filter, {
        $set: {
            value,
            update_user: usuarioRegistro,
            update_date: utils.getDate(),
        }
    });
    return { success: true };
}
const removeCatalog = async (id) => {
    const db = await mongodb.getDb();
    const filter = {
        _id: ObjectID(id)
    };
    const data = await db.collection(mongoCollections.CATALOG).findOne(filter);

    if (!data) {
        return { success: false, error: 'Catálogo no existe' };
    }
    
    if(appConstants.CATALOG_TYPE_ACREDITATION == data.type) {
        let user = await db.collection(mongoCollections.USERS).findOne({
            acreditation_type: data.code,
            
        });
        let inbox = await db.collection(mongoCollections.INBOX).findOne({
            acreditation_type: data.code
        });
    
        if(user != null || inbox != null) {
            return { success: false, error: 'Catálogo en uso' };
        }
    }

    else if(appConstants.CATALOG_TYPE_JOB_AREA == data.type) {
        let user = await db.collection(mongoCollections.USERS).findOne({
            job_area_code: data.code,
        });
    
        if(user != null) {
            return { success: false, error: 'Catálogo en uso' };
        }
    } else if (appConstants.CATALOG_TYPE_PROCEDURE == data.type) {
        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne({
            procedure: data.value
        });
        if (notification != null) {
            return {success: false, error: 'Catálogo en uso' };
        }
    }

    await db.collection(mongoCollections.CATALOG).deleteOne(filter);
    return { success: true };
}
const getTypes = async () => {
    const db = await mongodb.getDb();
    const data = await db.collection(mongoCollections.CATALOG).distinct("type");
    let catalogs = [];
    for await (const catalog of data) {
        catalogs.push(catalog);
    }
    return catalogs;
}
const getNextCode = async (type) => {
    try {
        const db = await mongodb.getDb();
        let _filter = { type: type }
        let cursor = await db.collection(mongoCollections.CATALOG).find(_filter).sort({$natural:-1}).limit(1);
        let num = 0;
        for await (const item of cursor) {
            num = item.code
        }
        return String(++num);
    } catch (error) {
        logger.error(err);
        return { success: false, error: errors.INTERNAL_ERROR };
    }
}
module.exports = { getCatalogByType, paginateCatalog, createCatalog, updateCatalog, removeCatalog, getTypes,listCatalog, getNextCode };
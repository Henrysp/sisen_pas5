/**
 * Created by Alexander Llacho
 */
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const errors = require('./../common/errors');
const utils = require('./../common/utils');
const mongoCollections = require('./../common/mongoCollections');
const appConstants = require('./../common/appConstants');
const ObjectId = require('mongodb').ObjectId;
const fs = require('fs');

const path_upload = process.env.PATH_UPLOAD;
const base_url = process.env.BASE_URL;

const getNotificationByInboxs = async (inboxs, search, filter, page, count, userLogged) => {
    let inboxString = [];

    const ObjectId = require('mongodb').ObjectId;

    for await (inbox of inboxs) {
        inboxString.push(ObjectId(inbox.id));
    }

    // let _filter = {
    //     inbox_id: {$in: inboxString},
    //     $or: [{expedient: new RegExp(search, 'i')}, {notifier_area: new RegExp(search, 'i')}]
    // }

    let _filter = {
        $and: [
            {inbox_id: {$in: inboxString}},
            {$or: [{automatic: null}, {automatic: false}]},
            {$or: [{expedient: new RegExp(search, 'i')}, {notifier_area: new RegExp(search, 'i')}]}
        ]
    }

    let resultFilter = await switchFilter((filter ? parseInt(filter) : filter));

    if (resultFilter) {
        _filter.read_at = resultFilter;
    }

    try {
        const db = await mongodb.getDb();

        let cursor = await db.collection(mongoCollections.NOTIFICATIONS).find(_filter).sort({received_at: -1}).skip(page > 0 ? ((page - 1) * count) : 0).limit(count);

        let recordsTotal = await cursor.count();

        let notifications = [];

        for await(const notification of cursor) {
            let read_position_status = false;
            if (notification.read_position !== undefined) {
                // const read_position = notification.read_position === undefined ? [] : notification.read_position;
                const read_position = notification.read_position;
                const found = read_position.find((element) => element.id.toString() === userLogged.id);
                if (found && notification.read_at !== undefined) {
                    read_position_status = true;
                }
            } else {
                read_position_status = notification.read_at !== undefined;
            }

            notifications.push({
                id: notification._id,
                expedient: notification.expedient,
                notifier_area: notification.notifier_area,
                received_at: notification.received_at,
                read_at: notification.read_at,
                read_position_status: read_position_status
            });
        }

        return {success: true, recordsTotal: recordsTotal, notifications: notifications};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const switchFilter = async (option) => {
    switch (option) {
        case appConstants.FILTER_READ:
            return {$exists: true};
        case appConstants.FILTER_UNREAD:
            return {$exists: false};
        default:
            return null;
    }
}

const getUnreadNotifications = async (inboxs) => {
    let inboxString = [];

    const ObjectId = require('mongodb').ObjectId;

    for await (inbox of inboxs) {
        inboxString.push(ObjectId(inbox.id));
    }

    let _filter = {
        $and: [
            {inbox_id: {$in: inboxString}},
            {$or: [{automatic: null}, {automatic: false}]},
            {read_at: null}
        ]
    }

    try {
        const db = await mongodb.getDb();

        let cursor = await db.collection(mongoCollections.NOTIFICATIONS).find(_filter);

        let recordsTotal = await cursor.count();

        return {success: true, recordsTotal: recordsTotal};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getAttachments = async (idNotification, attachments, jwt) => {
    let result = []

    for await (const attachment of attachments) {
        result.push({
            name: attachment.name,
            url: encodeURI(base_url + '/download-file?token=' + jwt + '&notification=' + idNotification + '&filename=' + attachment.name)
        });
    }
    return result;
}

const getAcuseNotifier = (idNotification, acuse_notified, jwt) => {
    return {
        name: acuse_notified.name,
        url: encodeURI(base_url + '/download-acuse?token=' + jwt + '&notification=' + idNotification)
    }
}

const getNotification = async (id, jwt) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(id)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + id + ' not exist');
            return {success: false};
        }

        return {
            success: true,
            notification:
                {
                    id: notification.id,
                    inbox_doc: notification.inbox_doc,
                    expedient: notification.expedient,
                    notifier_area: notification.notifier_area,
                    received_at: notification.received_at,
                    read_at: notification.read_at,
                    message: notification.message,
                    attachments: await getAttachments(id, notification.attachments, jwt),
                    acuse: getAcuseNotifier(id, notification.acuse_notified, jwt),
                    read_position: notification.read_position === undefined ? [] : notification.read_position,
                }
        };

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const readNotification = async (id) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(id)
        }
        let read_at = new Date();

        await db.collection(mongoCollections.NOTIFICATIONS).update(filter, {$set: {read_at: read_at}});

        logger.info('notification ' + id + ' success update read_at');

        return {success: true, read_at: read_at};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const readPosition = async (id, notification, userLogged) => {
    try {
        const db = await mongodb.getDb();
        let rep, name;

        let filter = {
            _id: ObjectId(id)
        }
        let read_position = notification.read_position;
        const found = read_position.find((element) => element.id.toString() === userLogged.id);

        rep = await db.collection(mongoCollections.REPRESENTATIVE).findOne({user_id: ObjectId(userLogged.id)});
        rep ? name = `${rep.names} ${rep.lastname ? rep.lastname + ' ' : ''}${rep.second_lastname || ''}`.trim() : '';
        if (!found) {
            const nowDate = new Date();
            let element = {
                "id": ObjectId(userLogged.id),
                "cargo": userLogged.cargo_name,
                "fullname": name,
                "fecha": nowDate
            }
            read_position.push(element)
            await db.collection(mongoCollections.NOTIFICATIONS).update(filter, {$set: {read_position: read_position}});
        }

        return {success: true};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const downloadAttachment = async (idNotification, filename) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(idNotification)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + idNotification + ' not exist');
            return {success: false, error: errors.NOTIFICATION_NOT_VALID};
        }

        let result = {success: false};
        let i = 0;
        for await (const attachment of notification.attachments) {
            if (attachment.name === filename) {

                if (fs.existsSync(path_upload + '/' + attachment.path)) {
                    result.success = true;
                    result.pathfile = path_upload + '/' + attachment.path;
                } else {
                    logger.error('attachment ' + path_upload + '/' + attachment.path + ' not exist');
                    result.error = "Archivo no encontrado";
                }
                break;
            } else {
                i++;
            }
        }

        if (i == notification.attachments.length) result.error = "Archivo no encontrado";
        return result;

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const downloadAcuseNotified = async (idNotification) => {
    try {
        const db = await mongodb.getDb();

        let filter = {
            _id: ObjectId(idNotification)
        }

        let notification = await db.collection(mongoCollections.NOTIFICATIONS).findOne(filter);

        if (!notification) {
            logger.error('notification ' + idNotification + ' not exist');
            return {success: false, error: errors.NOTIFICATION_NOT_VALID};
        }

        let result = {success: false};

        if (fs.existsSync(path_upload + '/' + notification.acuse_notified.path)) {
            result.success = true;
            result.pathfile = path_upload + '/' + notification.acuse_notified.path;
            result.filename = notification.acuse_notified.name;
        } else {
            logger.error('acuse notified: ' + path_upload + '/' + notification.acuse_notified.path + ' not exist');
            result.error = "Acuse no encontrado";
        }

        return result;

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

module.exports = {
    getNotificationByInboxs,
    getUnreadNotifications,
    getNotification,
    readNotification,
    downloadAttachment,
    downloadAcuseNotified,
    readPosition
};

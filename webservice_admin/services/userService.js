/**
 * Created by Angel Quispe
 */

const ObjectID = require('mongodb').ObjectID;
const mongodb = require('./../database/mongodb');
const ObjectId = require('mongodb').ObjectId;
const logger = require('./../server/logger').logger;
const errors = require('./../common/errors');
const utils = require('./../common/utils');
const appConstants = require('./../common/appConstants');
const mongoCollections = require('./../common/mongoCollections');
const emailService = require('./../services/emailService');
const smsService = require('./../services/smsService');
const crypto = require("crypto");
const axios = require('axios');
const fs = require('fs');
const {redisWriter, redisReader} = require('./../database/redis');
const representativeService = require('./../services/representativeService');
const inboxService = require('./../services/inboxService');
const registerLogService = require('./../services/registerLogService');
const moment = require('moment');
const {findByUserId, findByUsersId} = require("./representativeService");
const XLSX = require('xlsx');
const {reportDisableUsers} = require("./reportService");
const LdapAuthenticator = require('./LdapAuthenticator');
const db = require("mongodb/lib/db");

const takenInboxTtl = 5 * 60;

const getUsersCitizen = async (search, page, count, estado, fechaInicio, fechaFin, ordenFec) => {
    try {
        const db = await mongodb.getDb();
        let _filter = {};
        if (search !== "") {
            let search1 = search.split(" ");
            if (search1.length === 1) {
                if (search.includes("@")) {
                    _filter = {"email": new RegExp(diacriticSensitiveRegex(search), 'i')}
                } else if (/^\d+$/.test(search)) {
                    _filter = {
                        $or: [{
                            $and: [{"doc":new RegExp(diacriticSensitiveRegex(search), 'i')}],
                        },{
                            $and: [{"organization_name":new RegExp(diacriticSensitiveRegex(search), 'i')}],
                        }]
                    }
                } else {
                    _filter = {
                        $or: [{
                            $and: [{"full_name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[3]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[4]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[5]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[6]), 'i')}]
                        }, {
                            $and: [{"organization_name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[3]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[4]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[5]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[6]), 'i')}]
                        }, {
                            $and: [{"doc": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[3]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[4]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[5]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[6]), 'i')}]
                        }]
                    }
                }
            } else {
                _filter = {
                    $or: [{
                        $and: [{"full_name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[3]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[4]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[5]), 'i')}, {"full_name": new RegExp(diacriticSensitiveRegex(search1[6]), 'i')}]
                    }, {
                        $and: [{"organization_name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[3]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[4]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[5]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[6]), 'i')}]
                    }, {
                        $and: [{"doc": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[3]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[4]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[5]), 'i')}, {"doc": new RegExp(diacriticSensitiveRegex(search1[6]), 'i')}]
                    }]

                }
            }
        }
        if (estado !== '' && estado !== 'REGISTRO INTERNO') {
            _filter.status = estado;
        }
        if (estado === 'REGISTRO INTERNO') {
            _filter.status = null;
        }
        if(estado ==='notificador'){
            _filter.status = {$in: [null, 'APROBADO']};
        }
        if(estado ==='admin'){
            _filter.status = {$nin: ['PENDIENTE', 'DESAPROBADO']};
        }

        if (isNaN(fechaInicio) && !isNaN(Date.parse(fechaInicio))) {
            let fechaInicial = new Date(fechaInicio);
            fechaInicial.setTime(fechaInicial.getTime() + (5 * 60 * 60 * 1000));

            _filter.created_at = {$gt: fechaInicial};
        }
        if (isNaN(fechaFin) && !isNaN(Date.parse(fechaFin))) {
            let fechaFinal = new Date(fechaFin);
            fechaFinal.setDate(fechaFinal.getDate() + 1);
            fechaFinal.setTime(fechaFinal.getTime() + (5 * 60 * 60 * 1000));

            if (_filter.created_at) {
                _filter.created_at.$lt = fechaFinal;
            } else {
                _filter.created_at = {$lt: fechaFinal};
            }
        }

        let cursor = await db.collection(mongoCollections.INBOX)
            .find(_filter)
            .sort({created_at: (ordenFec === undefined || ordenFec === 'asc' ? 1 : -1)})
            .skip(page > 0 ? ((page - 1) * count) : 0)
            .limit(count);

        let inbox_user_id_list = [];
        let inboxes = {};
        for await (const inbox of cursor) {
            inbox_user_id_list.push(inbox.user_id);
            inboxes[inbox._id] = inbox;
        }

        let recordsTotal = await cursor.count();

        let users_by_id = (await db.collection(mongoCollections.USERS)
            .find({profile: appConstants.PROFILE_CITIZEN, _id: {$in: inbox_user_id_list}})
            .toArray())
            .reduce((acc, user) => {
                return {...acc, [user._id.toString()]: user}
            }, {});

        let users = [];
        for await (const inbox of Object.values(inboxes)) {
            let user = users_by_id[inbox.user_id];
            if (user === undefined) {
                continue;
            }
            let name;
            if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
                name = `${user.name}`;
            } else {
                name = `${user.name} ${user.lastname} ${user.second_lastname ? user.second_lastname : ''}`;
            }

            if (inbox.status === null) {
                inbox.status = "";
            }

            let isTaken = (await validarEnAtencion(inbox._id.toString())) != null;

            users.push({
                id: inbox.user_id,
                inbox_id: inbox._id,
                name: name,
                doc_type: user.doc_type,
                doc: user.doc,
                organization: user.organization_name,
                createdAt: inbox.created_at,
                evaluatedAt: inbox.evaluated_at,
                updateddAt: inbox.update_date,
                createUser: user.create_user,
                estate_inbox: inbox.status === 'DESHABILITADO' && inbox.create_user !== 'owner' ? '1' : inbox.status,
                enAtencion: isTaken,
                pending_migration: user.pending_migration
            });
        }

        return {success: true, recordsTotal: recordsTotal, users: users};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getUsersCitizenV2 = async (search, page, count, estado, fechaInicio, fechaFin, ordenFec) => {
    //no usado, se busca por inbox,user con aggregate, demora demasiado (porque demora se dejo de lado)
    try {
        const db = await mongodb.getDb();
        let _filter = {};
        if (search !== "") {
            let search1 = search.split(" ");
            if (search1.length === 1) {
                _filter = {
                    $or: [{"user.email": new RegExp(diacriticSensitiveRegex(search), 'i')}, {"user.doc": new RegExp(diacriticSensitiveRegex(search), 'i')}, {"user.name": new RegExp(diacriticSensitiveRegex(search), 'i')}, {"user.lastname": new RegExp(diacriticSensitiveRegex(search), 'i')}, {"user.second_lastname": new RegExp(diacriticSensitiveRegex(search), 'i')}, {"user.organization_name": new RegExp(diacriticSensitiveRegex(search), 'i')}]
                }
            } else if (search1.length === 2) {
                _filter = {
                    $or: [{"user.organization_name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1]), 'i')}, {
                        $and: [{"user.name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1]), 'i')}]
                    }, {
                        $and: [{"user.name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"user.lastname": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')},]
                    }, {
                        $and: [{"user.name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"user.second_lastname": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')},]
                    }]
                }
            } else if (search1.length >= 3) {
                _filter = {
                    $or: [{"user.organization_name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1] + " " + search1[2]), 'i')}, {
                        $and: [{"user.name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1] + " " + search1[2]), 'i')},]
                    }, {
                        $and: [{"user.name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"user.lastname": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')}, {"user.second_lastname": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')},]
                    }]
                }
            }
        }

        if (estado !== '' && estado !== 'REGISTRO INTERNO') {
            _filter.status = estado;
        }
        if (estado === 'REGISTRO INTERNO') {
            _filter.status = null;
        }

        if (isNaN(fechaInicio) && !isNaN(Date.parse(fechaInicio))) {
            let fechaInicial = new Date(fechaInicio);
            fechaInicial.setTime(fechaInicial.getTime() + (5 * 60 * 60 * 1000));

            _filter.created_at = {$gt: fechaInicial};
        }
        if (isNaN(fechaFin) && !isNaN(Date.parse(fechaFin))) {
            let fechaFinal = new Date(fechaFin);
            fechaFinal.setDate(fechaFinal.getDate() + 1);
            fechaFinal.setTime(fechaFinal.getTime() + (5 * 60 * 60 * 1000));

            if (_filter.created_at) {
                _filter.created_at.$lt = fechaFinal;
            } else {
                _filter.created_at = {$lt: fechaFinal};
            }
        }
        console.log("pagina: " + (page > 0 ? ((page - 1) * count) : 0))
        let cursor1 = await db.collection(mongoCollections.INBOX).aggregate([{
            $lookup: {
                "from": "users", "foreignField": "_id", "localField": "user_id", "as": "user"
            }
        }, {$unwind: "$user"}, {$match: _filter}, {$sort: {created_at: (ordenFec === undefined || ordenFec === 'asc' ? 1 : -1)}}, {$skip: (page > 0 ? ((page - 1) * count) : 0)}, {$limit: count}]);
        let recordsTotal = 100; // await cursor1.count();
        let users1 = [];

        for await (const inbox of cursor1) {
            let name;
            if (inbox.doc_type === 'ruc' || inbox.doc_type === 'pr') {
                name = `${inbox.user.name}`;
            } else {
                name = `${inbox.user.name} ${inbox.user.lastname} ${inbox.user.second_lastname ? inbox.user.second_lastname : ''}`;
            }

            if (inbox.status == null) {
                inbox.status = "";
            }

            let isTaken = (await validarEnAtencion(inbox._id.toString())) != null;

            users1.push({
                id: inbox.user_id,
                inbox_id: inbox._id,
                name: name,
                doc_type: inbox.user.doc_type,
                doc: inbox.user.doc,
                organization: inbox.user.organization_name,
                createdAt: inbox.created_at,
                updateddAt: inbox.update_date,
                createUser: inbox.user.create_user,
                estate_inbox: inbox.status,
                enAtencion: isTaken
            });
        }
        return {success: true, recordsTotal: recordsTotal, users: users1};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
//FALLA
const getUsersCitizenV3 = async (search, page, count, estado, fechaInicio, fechaFin, ordenFec) => { //ESTA FALLANDO no usado (se pretende buscar por nombre find inbox, find user de los inbox, filtrar por nombre, apellido)
    try {
        const db = await mongodb.getDb();

        let _filter = {};
        if (search !== "") {
            let search1 = search.split(" ");
            if (search1.length === 1) {
                if (search.includes("@")) {
                    _filter = {"email": new RegExp(diacriticSensitiveRegex(search), 'i')}
                } else if (/^\d+$/.test(search)) {
                    _filter = {"doc": new RegExp(diacriticSensitiveRegex(search), 'i')}
                }
            }
        }

        if (estado !== '' && estado !== 'REGISTRO INTERNO') {
            _filter.status = estado;
        }
        if (estado === 'REGISTRO INTERNO') {
            _filter.status = null;
        }

        if (isNaN(fechaInicio) && !isNaN(Date.parse(fechaInicio))) {
            let fechaInicial = new Date(fechaInicio);
            fechaInicial.setTime(fechaInicial.getTime() + (5 * 60 * 60 * 1000));

            _filter.created_at = {$gt: fechaInicial};
        }
        if (isNaN(fechaFin) && !isNaN(Date.parse(fechaFin))) {
            let fechaFinal = new Date(fechaFin);
            fechaFinal.setDate(fechaFinal.getDate() + 1);
            fechaFinal.setTime(fechaFinal.getTime() + (5 * 60 * 60 * 1000));

            if (_filter.created_at) {
                _filter.created_at.$lt = fechaFinal;
            } else {
                _filter.created_at = {$lt: fechaFinal};
            }
        }

        let cursor = await db.collection(mongoCollections.INBOX)
            .find(_filter)
            .sort({created_at: (ordenFec === undefined || ordenFec === 'asc' ? 1 : -1)})
            .skip(page > 0 ? ((page - 1) * count) : 0)
            .limit(count);

        let inbox_user_id_list = [];
        let inboxes = {};
        for await (const inbox of cursor) {
            inbox_user_id_list.push(inbox.user_id);
            inboxes[inbox._id] = inbox;
        }

        let recordsTotal = await cursor.count();

        let _filterUser = {}
        if (search !== "") {
            let search1 = search.split(" ");
            if (search1.length === 1) {
                if (search.includes("@")) {
                } else if (/^\d+$/.test(search)) {
                } else {
                    _filterUser = {
                        $or: [{"name": new RegExp(diacriticSensitiveRegex(search), 'i')}, {"lastname": new RegExp(diacriticSensitiveRegex(search), 'i')}, {"second_lastname": new RegExp(diacriticSensitiveRegex(search), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search), 'i')}]
                    }
                }
            } else if (search1.length === 2) {
                _filterUser = {
                    $or: [{"organization_name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1]), 'i')}, {
                        $and: [{"name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1]), 'i')}]
                    }, {
                        $and: [{"name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"lastname": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')},]
                    }, {
                        $and: [{"name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"second_lastname": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')},]
                    }, {
                        $and: [{"lastname": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"second_lastname": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')},]
                    }]
                }
            } else if (search1.length === 3) {
                _filterUser = {
                    $or: [{"lastname": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1] + " " + search1[2]), 'i')}, {"second_lastname": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1] + " " + search1[2]), 'i')}, {"organization_name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1] + " " + search1[2]), 'i')}, {
                        $and: [{"name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1]), 'i')}, {"lastname": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')},]
                    }, {
                        $and: [{"name": new RegExp(diacriticSensitiveRegex(search1[0]), 'i')}, {"lastname": new RegExp(diacriticSensitiveRegex(search1[1]), 'i')}, {"second_lastname": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')},]
                    }]
                }
            } else if (search1.length >= 4) {
                _filterUser = {
                    $or: [{"organization_name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1] + " " + search1[2] + " " + search1[3]), 'i')}, {
                        $and: [{"name": new RegExp(diacriticSensitiveRegex(search1[0] + " " + search1[1]), 'i')}, {"lastname": new RegExp(diacriticSensitiveRegex(search1[2]), 'i')}, {"second_lastname": new RegExp(diacriticSensitiveRegex(search1[3]), 'i')},]
                    }]
                }
            }
        }
        _filterUser.profile = appConstants.PROFILE_CITIZEN;
        let users_by_id = (await db.collection(mongoCollections.USERS)
            .find(_filterUser)
            .toArray())
            .reduce((acc, user) => {
                return {...acc, [user._id.toString()]: user}
            }, {});

        let dato = db.collection(mongoCollections.USERS).find(_filterUser).count();

        console.log("registros de usuarios: " + dato)
        let users = [];
        for await (const inbox of Object.values(inboxes)) {
            let user = users_by_id[inbox.user_id];
            if (user === undefined) {
                continue;
            }
            let name;
            if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
                name = `${user.name}`;
            } else {
                name = `${user.name} ${user.lastname} ${user.second_lastname ? user.second_lastname : ''}`;
            }

            if (inbox.status == null) {
                inbox.status = "";
            }

            let isTaken = (await validarEnAtencion(inbox._id.toString())) != null;

            users.push({
                id: inbox.user_id,
                inbox_id: inbox._id,
                name: name,
                doc_type: user.doc_type,
                doc: user.doc,
                organization: user.organization_name,
                createdAt: inbox.created_at,
                updateddAt: inbox.update_date,
                createUser: user.create_user,
                estate_inbox: inbox.status,
                enAtencion: isTaken
            });
        }

        return {success: true, recordsTotal: recordsTotal, users: users};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getUsers = async (search, page, count, estado, profile, fechaInicio, fechaFin, ordenFec) => {
    try {
        const db = await mongodb.getDb();
        let _filter = {};
        const searchTerms = search.trim().split(/\s+/);

        _filter = {
            doc_type: { $in : ['dni', 'ce'] },
            profile: {
                $ne: appConstants.PROFILE_CITIZEN
            },
            profiles: { $exists : true },
            disabled_list: { $ne: true },//Excluye los usuarios duplicados por script
            $and: searchTerms.map(term => ({
                $or: [
                    { name: new RegExp(diacriticSensitiveRegex(term), 'i') },
                    { lastname: new RegExp(diacriticSensitiveRegex(term), 'i') },
                    { second_lastname: new RegExp(diacriticSensitiveRegex(term), 'i') },
                    { job_area_name: new RegExp(diacriticSensitiveRegex(term), 'i') },
                    { doc: new RegExp(diacriticSensitiveRegex(term)) },
                    { LDAP: new RegExp(diacriticSensitiveRegex(term), 'i') },
                    { email: new RegExp(diacriticSensitiveRegex(term), 'i') },
                ]
            }))
        };
        if (profile !== '') {
            _filter[`profiles.${profile}.estado`] = true;
        }
        if (estado === 'DESHABILITADO') {
            _filter.status = estado
        } else if (estado === 'HABILITADO' ) {
            _filter.status = null;
        }

        if (isNaN(fechaInicio) && !isNaN(Date.parse(fechaInicio))) {
            let fechaInicial = new Date(fechaInicio);
            fechaInicial.setTime(fechaInicial.getTime() + (5 * 60 * 60 * 1000));

            _filter.created_at = {$gt: fechaInicial};
        }
        if (isNaN(fechaFin) && !isNaN(Date.parse(fechaFin))) {
            let fechaFinal = new Date(fechaFin);
            fechaFinal.setDate(fechaFinal.getDate() + 1);
            fechaFinal.setTime(fechaFinal.getTime() + (5 * 60 * 60 * 1000));

            if (_filter.created_at) {
                _filter.created_at.$lt = fechaFinal;
            } else {
                _filter.created_at = {$lt: fechaFinal};
            }
        }

        let cursor = await db.collection(mongoCollections.USERS).find(_filter).sort({created_at: (ordenFec === 'asc' ? 1 : -1)}).skip(page > 0 ? ((page - 1) * count) : 0).limit(count);
        let recordsTotal = await cursor.count();
        let users = [];
        const profileNames = {
            'admin': 'Administrador',
            'notifier': 'Notificador',
            'register': 'Operador de registro',
            'consult': 'Operador de consulta'
        };
        for await (const user of cursor) {
            const activeProfiles = user.profiles
                ? Object.keys(user.profiles)
                    .filter(profileKey => user.profiles[profileKey].estado)
                    .map(profileKey => profileNames[profileKey])
                    .join(' | ')
                : '';

            name = `${user.name} ${user.lastname} ${user.second_lastname ? user.second_lastname : ''}`;

            users.push({
                id: user._id,
                name: name.toUpperCase(),
                // lastname: user.lastname + ' ' + (user.second_lastname? user.second_lastname : ''),
                doc_type: user.doc_type,
                doc: user.doc,
                organization: user.job_area_name,
                createdAt: user.created_at,
                createUser: user.create_user,
                email: user.email,
                profile: user.profile,
                profiles: activeProfiles,
                status: user.status? user.status : 'HABILITADO',
                LDAP: user.LDAP
            });
        }
        return {success: true, recordsTotal: recordsTotal, users: users};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

function diacriticSensitiveRegex(string = '') {
    return string.replace(/a/g, '[a,á,à,ä]')
        .replace(/e/g, '[e,é,ë]')
        .replace(/i/g, '[i,í,ï]')
        .replace(/o/g, '[o,ó,ö,ò]')
        .replace(/u/g, '[u,ü,ú,ù]')
        .replace('|', '\\|');
}

const createUserCitizen = async (box, sessionUser, attachmentsBox, attachmentsRep, creatorUserName) => {
    let created_at = new Date();
    const personNatural = {name: '', lastname: '', second_lastname: ''};
    let organizationName = '';
    let webSite = '';
    let rep = {};
    let tes = {};
    let repLeg = {};
    let pre = {};
    let preOEC = {};
    let nameSendToEmail, nameOfficial = '';
    let creatorUserId = sessionUser.id;
    let ids = [];
    let officials = {};
    let result_official;
    const db = await mongodb.getDb();

    let newInbox = {
        doc_type: box.docType,
        doc: box.doc,
        full_name: '',
        organization_name: '',
        email: box.email,
        cellphone: box.cellphone,
        phone: box.phone,
        address: box.address,
        acreditation_type: '',
        attachments: attachmentsBox.length !== 0 ? attachmentsBox : null,
        register_user_id: creatorUserId,
        created_at: created_at,
        create_user: creatorUserName,
        dateFiling: box.dateFiling,
        nroExpediente: box.nroExpediente,
        observacion: box.observacion,
        orgPol: box.orgPol
    };

    const password = crypto.randomBytes(5).toString('hex');

    if (box.personType === appConstants.PERSON_TYPE_PN) {
        personNatural.name = box.name.toUpperCase();
        personNatural.lastname = box.lastname != null ? box.lastname.toUpperCase() : '';
        personNatural.second_lastname = box.second_lastname != null ? box.second_lastname.toUpperCase() : '';

        nameSendToEmail = `${personNatural.name} ${personNatural.lastname} ${personNatural.second_lastname}`;
        newInbox.full_name = nameSendToEmail;
        if (box.candidate === true || box.candidate === 'true') {
            newInbox.statusCandidateElectoralProcess = true;
            const process = await db.collection(mongoCollections.ELECTORAL_PROCESS).findOne({ code: box.electoralProcess },{ projection: { _id: 1 } });
            if (process) newInbox.electoralProcess_id = process._id;
        } else {
            newInbox.statusCandidateElectoralProcess = false;
        }
    }

    if (box.personType === appConstants.PERSON_TYPE_PJ) {
        rep = JSON.parse(box.rep);
        organizationName = box.organizationName.toUpperCase();
        webSite = box.webSite;

        nameSendToEmail = `${organizationName}`;
        newInbox.organization_name = nameSendToEmail;
    }

    let newUser = {
        doc_type: box.docType,
        doc: box.doc,
        profile: appConstants.PROFILE_CITIZEN,
        password: utils.passwordHash(password),
        password_old: utils.passwordHash(password),
        name: personNatural.name,
        lastname: personNatural.lastname,
        second_lastname: personNatural.second_lastname,
        numeroPartida: box.partidaRegistral,
        asientoRegistral: box.asientoRegistral,
        email: box.email,
        cellphone: box.cellphone,
        phone: box.phone,
        address: box.address,
        organization_name: organizationName,
        register_user_id: creatorUserId,
        created_at: created_at,
        updated_password: false,
        create_user: creatorUserName,
        Ubigeo: box.ubigeo,
        PaginaWeb: webSite,
        orgPol: box.orgPol
    };

    try {

        let _newUser = await db.collection(mongoCollections.USERS).insertOne(newUser);
        ids.push(_newUser.insertedId);
        logger.info('success insert in users');

        newInbox.user_id = _newUser.insertedId;
        let _newInbox = await db.collection(mongoCollections.INBOX).insertOne(newInbox);
        logger.info('success insert in inbox');

        //register history-data
        newUser.user_id = _newUser.insertedId;
        newUser.inbox_id = _newInbox.insertedId;

        await registerLogService.registerContactHistory(newUser, 'email', creatorUserName, created_at);
        await registerLogService.registerContactHistory(newUser, 'cellphone', creatorUserName, created_at);
        logger.info('success insert history contact');

        //add representative
        if (box.personType === appConstants.PERSON_TYPE_PJ) {
            rep.user_id = _newUser.insertedId;
            rep.inbox_id = _newInbox.insertedId;
            result_official = await representativeService.save(rep, attachmentsRep, sessionUser, true);
            officials[rep.position] = {active: true, id: result_official.result.insertedId};
        }

        //add other representantives
        if (box.personType === appConstants.PERSON_TYPE_PJ) {
            if(box.tes != undefined){
                tes = JSON.parse(box.tes);
                const passTes = crypto.randomBytes(5).toString('hex');
                let newUserTes = {
                    doc_type: box.docType,
                    doc: box.doc,
                    profile: appConstants.PROFILE_CITIZEN,
                    password: utils.passwordHash(passTes),
                    password_old: utils.passwordHash(passTes),
                    name: tes.names,
                    lastname: tes.lastname,
                    second_lastname: tes.second_lastname,
                    numeroPartida: box.partidaRegistral,
                    email: tes.email,
                    cellphone: tes.cellphone,
                    organization_name: organizationName,
                    register_user_id: creatorUserId,
                    created_at: created_at,
                    updated_password: false,
                    create_user: creatorUserName,
                    orgPol: box.orgPol
                };
                let _newUserTes = await db.collection(mongoCollections.USERS).insertOne(newUserTes);
                ids.push(_newUserTes.insertedId);
                logger.info('success insert in users');

                let newTes = {
                    docType: tes.docType,
                    doc: tes.doc,
                    names: tes.names,
                    lastname: tes.lastname,
                    second_lastname: tes.second_lastname,
                    email: tes.email,
                    cellphone: tes.cellphone,
                    position: tes.position,
                    positionName: tes.positionName,
                    enabled: true,
                    created_at: created_at,
                    user_id: _newUserTes.insertedId,
                    inbox_id: _newInbox.insertedId
                }

                result_official = await representativeService.save(newTes, [], sessionUser, true);

                officials[newTes.position] = {active: true, id: result_official.result.insertedId};

                nameOfficial =`${tes.names} ${tes.lastname} ${tes.second_lastname}`;

                Promise.all([emailService.sendEmailNewUserCitizen(nameOfficial, tes.email, tes.positionName, passTes, box.doc), smsService.sendSms(tes.cellphone, appConstants.MESSAGE_CREATE_INBOX)]).then((values) => {
                    let motivoEnvio = "aprobacion_registro_interno"
                    registerLogService.registerLog("email_sent", mongoCollections.INBOX, _newInbox.insertedId, null, tes.email, values[0], motivoEnvio, _newUserTes.insertedId);
                    registerLogService.registerLog("sms_sent", mongoCollections.INBOX, _newInbox.insertedId, null, tes.cellphone, values[1], motivoEnvio, _newUserTes.insertedId);
                });
            }
            if(box.repre != undefined && box.repre != '{}' ){
                repLeg = JSON.parse(box.repre);
                const passRep = crypto.randomBytes(5).toString('hex');
                let newUserRepLeg = {
                    doc_type: box.docType,
                    doc: box.doc,
                    profile: appConstants.PROFILE_CITIZEN,
                    password: utils.passwordHash(passRep),
                    password_old: utils.passwordHash(passRep),
                    name: repLeg.names,
                    lastname: repLeg.lastname,
                    second_lastname: repLeg.second_lastname,
                    numeroPartida: box.partidaRegistral,
                    email: repLeg.email,
                    cellphone: repLeg.cellphone,
                    organization_name: organizationName,
                    register_user_id: creatorUserId,
                    created_at: created_at,
                    updated_password: false,
                    create_user: creatorUserName,
                    orgPol: box.orgPol
                };
                let _newUserRepLeg = await db.collection(mongoCollections.USERS).insertOne(newUserRepLeg);
                ids.push(_newUserRepLeg.insertedId);
                logger.info('success insert in users');

                let newRepre = {
                    docType: repLeg.docType,
                    doc: repLeg.doc,
                    names: repLeg.names,
                    lastname: repLeg.lastname,
                    second_lastname: repLeg.second_lastname,
                    email: repLeg.email,
                    cellphone: repLeg.cellphone,
                    position: repLeg.position,
                    positionName: repLeg.positionName,
                    enabled: true,
                    created_at: created_at,
                    user_id: _newUserRepLeg.insertedId,
                    inbox_id: _newInbox.insertedId
                }

                result_official = await representativeService.save(newRepre, [], sessionUser, true);

                officials[newRepre.position] = {active: true, id: result_official.result.insertedId};

                nameOfficial =`${repLeg.names} ${repLeg.lastname} ${repLeg.second_lastname}`;

                Promise.all([emailService.sendEmailNewUserCitizen(nameOfficial, repLeg.email, repLeg.positionName, passRep, box.doc), smsService.sendSms(repLeg.cellphone, appConstants.MESSAGE_CREATE_INBOX)]).then((values) => {
                    let motivoEnvio = "aprobacion_registro_interno"
                    registerLogService.registerLog("email_sent", mongoCollections.INBOX, _newInbox.insertedId, null, repLeg.email, values[0], motivoEnvio, _newUserRepLeg.insertedId);
                    registerLogService.registerLog("sms_sent", mongoCollections.INBOX, _newInbox.insertedId,null, repLeg.cellphone, values[1], motivoEnvio, _newUserRepLeg.insertedId);
                });
            }
            if(box.pres != undefined){
                if(box.pres != '{}'){
                    pre = JSON.parse(box.pres);
                    const passPre = crypto.randomBytes(5).toString('hex');
                    let newUserPre = {
                        doc_type: box.docType,
                        doc: box.doc,
                        profile: appConstants.PROFILE_CITIZEN,
                        password: utils.passwordHash(passPre),
                        password_old: utils.passwordHash(passPre),
                        name: pre.names,
                        lastname: pre.lastname,
                        second_lastname: pre.second_lastname,
                        numeroPartida: box.partidaRegistral,
                        email: pre.email,
                        cellphone: pre.cellphone,
                        organization_name: organizationName,
                        register_user_id: creatorUserId,
                        created_at: created_at,
                        updated_password: false,
                        create_user: creatorUserName,
                        orgPol: box.orgPol
                    };
                    let _newUserPre = await db.collection(mongoCollections.USERS).insertOne(newUserPre);
                    ids.push(_newUserPre.insertedId);
                    logger.info('success insert in users');
        
                    let newPre = {
                        docType: pre.docType,
                        doc: pre.doc,
                        names: pre.names,
                        lastname: pre.lastname,
                        second_lastname: pre.second_lastname,
                        email: pre.email,
                        cellphone: pre.cellphone,
                        position: pre.position,
                        positionName: pre.positionName,
                        enabled: true,
                        created_at: created_at,
                        user_id: _newUserPre.insertedId,
                        inbox_id: _newInbox.insertedId
                    }
                    
                    result_official = await representativeService.save(newPre, [], sessionUser, true);

                    officials[newPre.position] = {active: true, id: result_official.result.insertedId};

                    nameOfficial =`${pre.names} ${pre.lastname} ${pre.second_lastname}`;

                    Promise.all([emailService.sendEmailNewUserCitizen(nameOfficial, pre.email, pre.positionName, passPre, box.doc), smsService.sendSms(pre.cellphone, appConstants.MESSAGE_CREATE_INBOX)]).then((values) => {
                        let motivoEnvio = "aprobacion_registro_interno"
                        registerLogService.registerLog("email_sent", mongoCollections.INBOX, _newInbox.insertedId, null, pre.email, values[0], motivoEnvio, _newUserPre.insertedId);
                        registerLogService.registerLog("sms_sent", mongoCollections.INBOX, _newInbox.insertedId, null, pre.cellphone, values[1], motivoEnvio, _newUserPre.insertedId);
                    });
                }
            }
            if(box.presiOEC !== undefined && box.presiOEC !== '{}'){
                preOEC = JSON.parse(box.presiOEC);
                    const passPreOEC = crypto.randomBytes(5).toString('hex');
                    let newUserPreOEC = {
                        doc_type: box.docType,
                        doc: box.doc,
                        profile: appConstants.PROFILE_CITIZEN,
                        password: utils.passwordHash(passPreOEC),
                        password_old: utils.passwordHash(passPreOEC),
                        name: preOEC.names,
                        lastname: preOEC.lastname,
                        second_lastname: preOEC.second_lastname,
                        numeroPartida: box.partidaRegistral,
                        email: preOEC.email,
                        cellphone: preOEC.cellphone,
                        organization_name: organizationName,
                        register_user_id: creatorUserId,
                        created_at: created_at,
                        updated_password: false,
                        create_user: creatorUserName,
                        orgPol: box.orgPol
                    };
                    let _newUserPreOEC = await db.collection(mongoCollections.USERS).insertOne(newUserPreOEC);
                    ids.push(_newUserPreOEC.insertedId);
                    logger.info('success insert in users');

                    let newPreOEC = {
                        docType: preOEC.docType,
                        doc: preOEC.doc,
                        names: preOEC.names,
                        lastname: preOEC.lastname,
                        second_lastname: preOEC.second_lastname,
                        email: preOEC.email,
                        cellphone: preOEC.cellphone,
                        position: preOEC.position,
                        positionName: preOEC.positionName,
                        enabled: true,
                        created_at: created_at,
                        user_id: _newUserPreOEC.insertedId,
                        inbox_id: _newInbox.insertedId
                    }

                    result_official = await representativeService.save(newPreOEC, [], sessionUser, true);

                    officials[newPreOEC.position] = {active: true, id: result_official.result.insertedId};

                    nameOfficial =`${preOEC.names} ${preOEC.lastname} ${preOEC.second_lastname}`;

                    Promise.all([emailService.sendEmailNewUserCitizen(nameOfficial, preOEC.email, preOEC.positionName, passPreOEC, box.doc), smsService.sendSms(preOEC.cellphone, appConstants.MESSAGE_CREATE_INBOX)]).then((values) => {
                        let motivoEnvio = "aprobacion_registro_interno"
                        registerLogService.registerLog("email_sent", mongoCollections.INBOX, _newInbox.insertedId, null, preOEC.email, values[0], motivoEnvio, _newUserPreOEC.insertedId);
                        registerLogService.registerLog("sms_sent", mongoCollections.INBOX, _newInbox.insertedId, null, preOEC.cellphone, values[1], motivoEnvio, _newUserPreOEC.insertedId);
                    });
            }
            const res = await db.collection(mongoCollections.INBOX).update({_id: _newInbox.insertedId}, {
                $set: {
                    user_ids: ids,
                    officials: officials
                }
            });
        }

        //Validating if box is for a political organization or not
        let cargo = box.orgPol === "1" ? "Personero Legal Titular" : ""

        Promise.all([emailService.sendEmailNewUserCitizen(nameSendToEmail, newUser.email, cargo, password, box.doc), smsService.sendSms(newUser.cellphone, appConstants.MESSAGE_CREATE_INBOX), searchCLARIDAD(box.doc, box.docType, true)]).then(async (values) =>  {
            let motivoEnvio = "aprobacion_registro_interno"
            await registerLogService.registerLog("email_sent", mongoCollections.INBOX, _newInbox.insertedId, _newUser.insertedId, newUser.email, values[0], motivoEnvio,null, values[0] ? null : await utils.encrypt(password));
            await registerLogService.registerLog("sms_sent", mongoCollections.INBOX, _newInbox.insertedId, _newUser.insertedId, newUser.cellphone, values[1], motivoEnvio);
        });

        //Sending messages to Representative
        if (newUser.doc_type === 'ruc' || newUser.doc_type === 'pr') {
            let motivoEnvio = "aprobacion_registro_interno"
            const representative = await representativeService.findByUserId(_newUser.insertedId, true);
            if (representative.success) {
                let name = `${representative.data.names} ${representative.data.lastname != null ? representative.data.lastname : ''} ${representative.data.second_lastname != null ? representative.data.second_lastname : ''}`;
                if (representative.data.cellphone !== newUser.cellphone) {
                    Promise.all([smsService.sendSms(representative.data.cellphone, appConstants.MESSAGE_CREATE_INBOX),]).then((values) => {
                        registerLogService.registerLog("sms_sent", mongoCollections.INBOX, _newInbox.insertedId, null, representative.data.cellphone, values[0], motivoEnvio, representative.data._id);
                    });
                }

                if (representative.data.email !== newUser.email) {
                    await Promise.all([emailService.sendEmailNewUserCitizen(name, representative.data.email, cargo, password, box.doc),]).then(async (values) => {
                        await registerLogService.registerLog("email_sent", mongoCollections.INBOX, _newInbox.insertedId, null, representative.data.email, values[0], motivoEnvio, representative.data._id, values[0] ? null : await utils.encrypt(password));
                    });
                }
            }
        }

        return {success: true};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const searchCLARIDAD = async (dniCandidato, tipoDoc, generarPassword) => {
    let result = {};
    logger.info('URL Claridad: ' + process.env.WS_CLARIDAD);
    console.log('URL Claridad: ' + process.env.WS_CLARIDAD);
    try {
        let response = await axios({
            url: `${process.env.WS_CLARIDAD}`,
            method: 'post',
            responseType: 'json',
            headers: {'apiKeyClaridad': appConstants.apiKeyClaridad},
            data: {
                dniCandidato: dniCandidato, generarPassword: generarPassword
            },
            timeout: process.env.SERVER_TIMEOUT
        });
        result.success = true;
        result.esCandidato = response.data.success;
        result.respuestaClaveGenerada = response.data.data.clave;
        result.statusCode = response.statusCode;
    } catch (error) {
        let err = error.toJSON();
        logger.error("Error Status Claridad: " + err.status + " - DOC: " + dniCandidato);
        console.log("ERROR Status Claridad: " + err.status + " - DOC: " + dniCandidato);
        if (err.status !== 404) await saveDoc(dniCandidato, tipoDoc);
        result.success = false;
        result.statusCode = err.status;
    }
    return result;
}

const saveDoc = async (doc, docType) => {
    try {
        let logDoc = {
            doc: doc, docType: docType, created_at: new Date()
        }
        const db = await mongodb.getDb();
        const filter = {docType: docType, doc: doc};
        let user = await db.collection(mongoCollections.LOG_CLARIDAD).findOne(filter);
        if (!user) await db.collection(mongoCollections.LOG_CLARIDAD).insertOne(logDoc);
    } catch (err) {
        logger.error(err);
    }
}

const getLogClaridad = async () => {
    let count = 0;
    try {
        const db = await mongodb.getDb();
        let info = await db.collection(mongoCollections.LOG_CLARIDAD).find();
        for await (logDoc of info) {
            let result = await searchCLARIDAD(logDoc.doc, logDoc.docType, true);
            if (result.success || result.statusCode === 404) {
                await db.collection(mongoCollections.LOG_CLARIDAD).deleteOne({
                    doc: logDoc.doc, docType: logDoc.docType
                });
                count++;
            }
        }
    } catch (err) {
        logger.error(err);
    }
    console.log("count: ", count);
}

const getUserCitizen = async (docType, doc) => {
    const ESTADO_APROBADO = 'APROBADO';
    try {
        const db = await mongodb.getDb();

        let inbox = await db.collection(mongoCollections.INBOX).findOne({
            doc_type: docType, doc: doc, $or: [{status: ESTADO_APROBADO}, {status: null}],
        });

        let user = await db.collection(mongoCollections.USERS).findOne({
            doc_type: docType,
            doc: doc,
            profile: appConstants.PROFILE_CITIZEN,
            $or: [{status: ESTADO_APROBADO}, {status: null}],
        });

        if (!inbox || !user) {
            logger.error('approved user citizen ' + doc + '/' + docType + ' not exist');
            return {success: false, error: errors.ADDRESSEE_CITIZEN_NOT_EXIST};
        }

        return {
            success: true, message: "Tiene casilla electrónica", user: {
                names: user.name + ' ' + user.lastname + (user.second_lastname !== undefined ? ' ' + user.second_lastname : ''),
                name: user.name,
                lastname: user.lastname,
                second_lastname: user.second_lastname !== undefined ? user.second_lastname : '',
                organization_doc: user.organization_doc,
                organization_name: user.organization_name,
                pending_migration: user.pending_migration
            }
        };

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getUserCasilla = async (docType, doc) => {
    try {
        const db = await mongodb.getDb();

        let user = await db.collection(mongoCollections.USERS).findOne({
            doc_type: docType, doc: doc, profile: appConstants.PROFILE_CITIZEN, $or: [{
                'status': {
                    '$eq': 'APROBADO'
                }
            }, {
                'status': {
                    '$exists': false
                }
            }]
        });

        if (!user) {
            logger.error('inbox validation: user citizen ' + doc + '/' + docType + ' not exist');
            return {success: false, error: errors.CITIZEN_NOT_EXIST.message};
        }

        return {
            success: true, message: "Tiene casilla electrónica", email: user.email
        };

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const createUser = async (newUser) => {
    try {
        if (await existUser(newUser.doc_type, newUser.doc, newUser.profile)) {
            return {success: false, error: errors.CREATE_USER_EXIST};
        }

        newUser.password = 'f4e98344541784f2eabcf6fcd1daf050afd9a1bfa2c59819356fe0543752f311';
        newUser.password_old = 'f4e98344541784f2eabcf6fcd1daf050afd9a1bfa2c59819356fe0543752f311';
        newUser.created_at = new Date();
        newUser.updated_password = false;

        const db = await mongodb.getDb();

        let result = await db.collection(mongoCollections.USERS).insertOne(newUser);

        logger.info('success insert in users');

        return {success: true, data : result};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const createUsers = async (newUser) => {
    try {
        newUser.password = 'f4e98344541784f2eabcf6fcd1daf050afd9a1bfa2c59819356fe0543752f311';
        newUser.password_old = '';
        newUser.created_at = new Date();
        newUser.updated_password = false;

        const db = await mongodb.getDb();
        let result = await db.collection(mongoCollections.USERS).insertOne(newUser);
        logger.info('success insert in users');
        return {success: true, data : result};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const existUser = async (docType, doc, profile) => {
    try {
        const db = await mongodb.getDb();

        let user = await db.collection(mongoCollections.USERS).findOne({
            doc_type: docType, doc: doc, profile: profile
        });

        if (!user) {
            return false
        }

        return true;

    } catch (err) {
        logger.error(err);

        return false;
    }

}

const updatePassword = async (docType, doc, profile, oldPassword, newPassword) => {
    try {
        const db = await mongodb.getDb();

        const filter = {doc_type: docType, doc: doc, profile: profile, $or: [{status: 'APROBADO'}, {status: null}],};

        let user = await db.collection(mongoCollections.USERS).findOne(filter);

        if (user) {
            if (user.password !== utils.passwordHash(oldPassword)) {
                logger.info('user ' + doc + '/' + docType + '/' + profile + ' old password not equals');

                return {success: false, error: errors.UPDATE_PASSWORD_INCORRECT_OLD_PASSWORD};
            }

            if (user.password === utils.passwordHash(newPassword)) {
                logger.info('user ' + doc + '/' + docType + '/' + profile + ' old password and new password are the same');

                return {success: false, error: errors.UPDATE_PASSWORD_NEW_PASSWORD_NOT_EQUALS_OLD_PASSWORD};
            }

            let event_history = {
                event: 'update_password', collection: mongoCollections.USERS, id: user._id, date: new Date()
            }

            await db.collection(mongoCollections.USERS).update(filter, {
                $set: {
                    updated_password: true, password: utils.passwordHash(newPassword)
                }
            });

            logger.info('user ' + doc + '/' + docType + '/' + profile + ' success password update');

            await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

            logger.info('success insert in event_history');

            return {success: true};

        } else {
            logger.info('user ' + doc + ', ' + docType + '/' + profile + ' user invalid');

            return {success: false, error: errors.INTERNAL_ERROR};
        }

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const recoverPassword = async (docType, doc) => {
    let user;
    try {
        const db = await mongodb.getDb();

        const filter = {
            doc_type: docType,
            doc: doc,
            $or: [{profile: appConstants.PROFILE_REGISTER}, {profile: appConstants.PROFILE_NOTIFIER}, {profile: appConstants.PROFILE_ADMIN}, {profile: appConstants.PROFILE_REGISTER_QUERY}]
        }

        user = await db.collection(mongoCollections.USERS).findOne(filter);

        if (user) {

            const newPassword = crypto.randomBytes(5).toString('hex');
            let name = `${user.name} ${user.lastname} ${user.second_lastname !== undefined ? user.second_lastname : ''}`;
            await emailService.sendEmailNewPassword(name, user.email, newPassword, doc);

            const _filter = {doc_type: docType, doc: doc, profile: user.profile}

            await db.collection(mongoCollections.USERS).update(filter, {
                $set: {
                    updated_password: false, password: utils.passwordHash(newPassword)
                }
            });
            return {success: true};
        } else {
            return {
                success: false,
                error: {message: 'No se ha encontrado un usuario con el documento ingresado en el sistema. Por favor, verifique la información ingresada o póngase en contacto con el administrador.'}
            };
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: {message: 'El servicio no esta disponible, inténtelo de nuevo o más tarde'}}
    }

}

const getEmailCitizen = async (docType, doc) => {
    try {
        const db = await mongodb.getDb();

        let user = await db.collection(mongoCollections.USERS).findOne({
            doc_type: docType,
            doc: doc,
            profile: appConstants.PROFILE_CITIZEN,
            $or: [{status: 'APROBADO'}, {status: null}],
        });

        if (!user) {
            logger.error('getting citizen email: user citizen ' + doc + '/' + docType + ' not exist');
            return {success: false, error: errors.ADDRESSEE_CITIZEN_NOT_EXIST};
        }

        return {success: true, email: user.email, cellphone: user.cellphone, id: user._id};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getEmailCitizen2 = async (email) => {
    try {
        const db = await mongodb.getDb();

        let user = await db.collection(mongoCollections.USERS).findOne({
            email: email, profile: appConstants.PROFILE_CITIZEN
        });

        if (user != null) {
            logger.error('user email ' + email + ' exist');
            return {success: true, error: errors.ADDRESSEE_CITIZEN_NOT_EXIST};
        }

        return {success: false};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}
const getEmailCitizen3 = async (Id) => {
    try {
        const db = await mongodb.getDb();

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(Id),
            profile: appConstants.PROFILE_CITIZEN,
            $or: [{status: 'APROBADO'}, {status: null}],
        });

        if (!user) {
            logger.error('getting citizen email: user citizen ' + doc + '/' + docType + ' not exist');
            return {success: false, error: errors.ADDRESSEE_CITIZEN_NOT_EXIST};
        }

        return {success: true, email: user.email, cellphone: user.cellphone, id: user._id};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const newUser = async (docType, dni, profiles, name, lastname, second_lastname, email, UUOO, UUOO_name, LDAP, usuarioRegistro, usuarioRegistroid) => {
    try{
        const db = await mongodb.getDb();
        let user_history = [];

        const exists = await db.collection(mongoCollections.USERS).findOne({
            doc: dni,
            profile: {$ne: 'citizen'}
        });

        if (exists) {
            return {success: false, error: 'Ya existe un usuario registrado con el mismo número de documento'};
        }

        Object.keys(profiles).forEach(key => {
            const profile = profiles[key];
            profile.fechaIni = profile.fechaIni ? new Date(profile.fechaIni) : null;
            profile.fechaFin = profile.fechaFin === 'Indeterminado' ? 'Indeterminado' :
                !isNaN(new Date(profile.fechaFin).getTime()) ?
                    new Date(new Date(profile.fechaFin).setHours(23, 59, 59, 999)) :
                    null;
            profile.updated_user = profile.estado ? usuarioRegistro : null;
            profile.updated_at = profile.estado ? new Date() : null;
        });

        let usuario = {
            doc_type: docType,
            doc: dni,
            profiles: profiles,
            LDAP: LDAP,
            name: name,
            lastname: lastname,
            second_lastname: second_lastname,
            email: email,
            created_at: new Date(),
            create_user: usuarioRegistro,
            create_user_id: ObjectId(usuarioRegistroid),
            job_area_code: UUOO,
            job_area_name: UUOO_name,
        };

        let result = await db.collection(mongoCollections.USERS).insertOne(usuario);

        Object.keys(usuario.profiles).forEach(key => {
            user_history.push([key, usuario.profiles[key]]);
        })

        let event_history = {
            event: 'create_user',
            collection: mongoCollections.USERS,
            id: result.insertedId,
            date: new Date(),
            create_user_id: ObjectId(usuarioRegistroid),
        }
        await registerLogService.registerUserHistory(result.insertedId.toString(), user_history, usuarioRegistro, usuarioRegistroid)
        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

        return {success: true};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const editUser = async (id, UUOO, UUOO_name, email, profiles, usuarioRegistro, usuario) => {
    try{
        const db = await mongodb.getDb();
        let user_history = [];
        const user = await db.collection(mongoCollections.USERS).findOne(
            {_id: ObjectId(id)},
            {
                projection: {profiles: 1, job_area_code: 1, job_area_name: 1, email: 1, isSuperAdmin: 1}
            });
        const editor = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectId(usuario)
        });
        const setInfo = {
            email: email,
            job_area_code: UUOO,
            job_area_name: UUOO_name,
            update_user: usuarioRegistro,
            update_date: new Date(),
        }
        if (!user) {
            return {success: false, error: 'Usuario no existe'};
        }

        if (user.isSuperAdmin) {
            return {success: false, error: 'No puede editar este usuario'}
        }

        if (editor.create_user_id?.toString() === user._id.toString()) {
            return {success: false, error: 'No puede realizar cambios en el usuario que lo creó'}
        }

        if (usuario === user._id.toString()) {
            return {success: false, error: 'El usuario no puede editarse a sí mismo'}
        }
        const profiles_final = JSON.parse(JSON.stringify(user.profiles));
        Object.keys(profiles).forEach(key => {
            const profile = profiles[key];
            profile.fechaIni = profile.fechaIni ? new Date(profile.fechaIni) : null;
            profile.fechaFin = profile.fechaFin === 'Indeterminado' ? 'Indeterminado' :
                !isNaN(new Date(profile.fechaFin).getTime()) ?
                    new Date(new Date(profile.fechaFin).setHours(23, 59, 59, 999)) :
                    null;
        });
        Object.keys(user.profiles).forEach(key => {
            const profile = user.profiles[key];
            delete profile.updated_user;
            delete profile.updated_at;
        });

        if (JSON.stringify(user.profiles) === JSON.stringify(profiles)) {
            if (user.email === email && user.job_area_code === UUOO) {
                return {success: false, error: 'No se detectaron cambios que guardar'};
            }
        } else {
            setInfo.profiles = profiles;
            Object.keys(profiles).forEach(key => {
                const edit = JSON.stringify(profiles[key]) !== JSON.stringify(user.profiles[key]);
                if (edit) {
                    user_history.push([key, user.profiles[key], profiles[key], 2]);
                    profiles[key].updated_user = profiles[key].estado ? usuarioRegistro : null;
                    profiles[key].updated_at = profiles[key].estado ? new Date() : null;
                }
                else{
                    profiles[key].updated_user = profiles_final[key].updated_user ? profiles_final[key].updated_user : null;
                    profiles[key].updated_at = profiles_final[key].updated_at ? new Date(profiles_final[key].updated_at) : null;
                }
            })
        }

        await db.collection(mongoCollections.USERS).updateOne( {_id: ObjectId(id)}, {
            $set: setInfo
        });

        let updatedUser = await db.collection(mongoCollections.USERS).findOne(
            {_id: ObjectId(id)},
            {projection: {profiles: 1, job_area_code: 1, job_area_name: 1, email: 1, _id: 0}}
        );

        let event_history = {
            event: 'edit_user',
            collection: mongoCollections.USERS,
            id: user._id,
            date: new Date(),
            editing_user_id: ObjectId(usuario),
            user_old: user,
            user_now: updatedUser
        }


        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);
        await registerLogService.registerUserHistory(id, user_history, usuarioRegistro, usuario)

        return {success: true};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const deleteUser = async (docType, doc) => {
    try {
        const db = await mongodb.getDb();


        user_inboxes = await db.collection(mongoCollections.USER_INBOX).find({
            doc_type: docType, doc: doc,
        });


        await user_inboxes.forEach(async (element) => {
            await db.collection(mongoCollections.INBOX).deleteOne({
                $or: [{_id: ObjectID(element.inbox_id)}, {_id: element.inbox_id}]
            });
        });


        await db.collection(mongoCollections.USER_INBOX).deleteMany({
            doc_type: docType, doc: doc,
        });

        await db.collection(mongoCollections.USERS).deleteOne({
            doc_type: docType, doc: doc,
        });

        return {success: true};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const getUserCitizenById = async (id) => {
    try {
        const db = await mongodb.getDb();

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id),
            updated_password: updated_password(id)
        });

        if (!user) {
            return {success: false};
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectID(id)
        });

        return {
            success: true, user: {
                doc: user.doc,
                doc_type: user.doc_type,
                name: user.name,
                lastname: user.lastname,
                second_lastname: user.second_lastname,
                organization_doc: user.organization_doc,
                organization_name: user.organization_name,
                email: user.email,
                cellphone: user.cellphone,
                phone: user.phone,
                addres: user.addres,
                accreditation: inbox.acreditation_type,
                attachments: inbox.attachments,
                address: user.address,
                ubigeo: user.Ubigeo,
                updated_password: user.updated_password,
                nroExpediente: inbox.nroExpediente,
                dateFiling: inbox.dateFiling
            }
        };

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}

const existCE = async (doc, docType) => {
    const ESTADO_APROBADO = 'APROBADO';
    const db = await mongodb.getDb();

    const exist = await db.collection(mongoCollections.USERS).findOne({
        doc_type: docType, doc: doc, $or: [{status: ESTADO_APROBADO}, {status: null}],
    });

    const exist_2 = await db.collection(mongoCollections.USERS).findOne({
        rep_doc_type: docType, rep_doc: doc
    });

    return exist != null ? exist : exist_2;
}

const getImageDNI = async (pathPrincipal) => {
    //const { path } = pathPrincipal;
    const path_upload = process.env.PATH_UPLOAD;
    const pathFinal = path_upload + '/' + pathPrincipal;
    try {
        console.log("\nEl pathFinal de la imagen: \n", pathFinal, "\n=========================== \n");
        const content = fs.readFileSync(pathFinal);
        return content;
    } catch (err) {
        logger.error(err);
        return {success: false, error: "No se puede leer la imagen"};
    }
}

const getUserCitizenDetailById = async (id, token, atender) => {
    try {
        const db = await mongodb.getDb();
        let userType = "pn";
        let imgDNI = "";
        let representative = {};
        let resultOfficials = [];

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id),
        });

        if (!user) {
            return {success: false, message: "no found user"};
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectID(id)
        });

        if (!inbox) {
            return {success: false, message: "no found inbox"};
        }

        let histories = await db.collection(mongoCollections.EVENT_HISTORY).find({
            id: inbox._id,
            collection: 'inbox',
            motivo: {$in: ['aprobacion_registro_interno', 'aprobacion_casilla', 'desaprobacion_casilla', 'reenvio_aprobacion_casilla', 'reenvio_desaprobacion_casilla']}
        }).toArray();

        if (inbox.imageDNI) {
            let FileDNI = inbox.imageDNI
            let path = FileDNI.path
            imgDNI = await getImageDNI(path);
        }

        if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
            userType = 'pj'

            const resultRep = await representativeService.findByUserId(id, true);
            if (!resultRep.success) {
                return {success: false, message: "no found representative"};
            }

            representative = resultRep.data;

            resultOfficials = await representativeService.findByUsersId(id);

            // VALIDAR SI EXISTE EL ATRIBUTO "file_document"
            if (typeof representative.file_document === "undefined") {
                representative.file_document = [];
            }

            // VALIDAR SI EL ATRIBUTO "file_document" ES ARRAY
            if (!Array.isArray(representative.file_document)) {
                let temp = representative.file_document;
                representative.file_document = [];
                representative.file_document.push(temp);
            }

            if (typeof representative.file_document1 !== "undefined") {
                if (typeof representative.file_document1[0] !== "undefined" && typeof representative.file_document1[0].path !== "undefined") {
                    representative.file_document.push(representative.file_document1[0]);
                }
            }

            if (typeof representative.file_document2 !== "undefined") {
                if (typeof representative.file_document2[0] !== "undefined" && typeof representative.file_document2[0].path !== "undefined") {
                    representative.file_document.push(representative.file_document2[0]);
                }
            }

            if (representative.file_photo != null) {
                let FileDNI = representative.file_photo
                let path = FileDNI.path
                imgDNI = await getImageDNI(path);
            }
        } else {
            userType = 'pn'
        }

        let estadoAtencion = {enAtencion: false};
        if (atender !== undefined && atender === "true") {
            estadoAtencion = await procesarEnAtencion(inbox._id.toString(), token);
        }

        //show motivo
        let reason_disapproved = [];
        if (inbox.status === 'DESAPROBADO') {
            let motive = inbox.motivo;
            for (let i = 1; i <= Object.keys(motive).length; i++) {
                if (motive['motivo' + i] && motive['motivo' + i].value) {
                    reason_disapproved.push(motive['motivo' + i].detalle);
                }
            }
        }

        let historyContact = null;
        if (inbox.status === 'APROBADO' || inbox.create_user !== 'owner') {
            historyContact = await registerLogService.findAllContactHistory(inbox._id);
        }

        let electoralProcess = null;

        if (inbox.electoralProcess_id !== undefined && inbox.electoralProcess_id !== 'undefined' && inbox.electoralProcess_id !== null) {
            electoralProcess = await db.collection(mongoCollections.ELECTORAL_PROCESS).findOne({
                _id: ObjectId(inbox.electoralProcess_id)
            });            
        }
        
        let electoralProcessName = null ;
        let statusCandidateElectoralProcess = inbox.statusCandidateElectoralProcess;

        if (electoralProcess) {
            electoralProcessName = electoralProcess.name;
        }
        //let statusCandidateElectoralProcess =  
        const responseData = {
            doc: user.doc,
            doc_type: user.doc_type,
            type_user: userType,
            name: user.name,
            lastname: user.lastname,
            second_lastname: user.second_lastname,
            organization_doc: user.organization_doc,
            organization_name: user.organization_name,
            startingNumber: user.numeroPartida,
            registrySeat: user.asientoRegistral,
            email: user.email,
            ubigeo: user.Ubigeo,
            paginaweb: user.PaginaWeb,
            cellphone: user.cellphone,
            phone: (user.phone != null ? user.phone !== "undefined" ? user.phone : '' : ''),
            addres: user.addres,
            created_at: inbox.created_at ? moment(inbox.created_at).format("DD/MM/YYYY HH:mm:ss") : '',
            evaluated_at: inbox.evaluated_at ? moment(inbox.evaluated_at).format("DD/MM/YYYY HH:mm:ss") : '',
            status: inbox.status,
            officials: resultOfficials.data,
            update_user: inbox.update_user,
            create_user: inbox.create_user,
            evaluator_user_names: inbox.evaluator_user_names,
            updated_password: user.updated_password,
            accreditation: inbox.acreditation_type,
            attachments: inbox.attachments,
            imageDNI: imgDNI,
            address: user.address,
            enAtencion: estadoAtencion.taken,
            enAtencionPor: (estadoAtencion.takenBy != null ? estadoAtencion.takenBy.name : ''),
            nroExpediente: (inbox.nroExpediente !== undefined ? inbox.nroExpediente : ''),
            dateFiling: (inbox.dateFiling !== undefined ? inbox.dateFiling : ''),
            representative: representative,
            contact_history: historyContact,
            observacion: (inbox.observacion === 'null') ? '' : inbox.observacion,
            disabled_at: (inbox.disabled_at !== undefined ? inbox.disabled_at : ''),
            reason_disapproved: reason_disapproved,
            email_sent_at: inbox.email_sent_at ? moment(inbox.email_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
            email_sent_status: inbox.email_sent_status,
            sms_sent_at: inbox.sms_sent_at ? moment(inbox.sms_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
            sms_sent_status: inbox.sms_sent_status,
            email_sent_at_rep: inbox.email_sent_at_rep ? moment(inbox.email_sent_at_rep).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
            email_sent_status_rep: inbox.email_sent_status_rep,
            sms_sent_at_rep: inbox.sms_sent_at_rep ? moment(inbox.sms_sent_at_rep).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
            sms_sent_status_rep: inbox.sms_sent_status_rep,
            filesGenerated: inbox.filesGenerated,
            inboxId: inbox._id,
            electoralProcessName: electoralProcessName,
            statusCandidateElectoralProcess: statusCandidateElectoralProcess,
            orgPol: (user.orgPol !== undefined ) ? user.orgPol : '0'
        };

        const dataHistory = {};
        let historyEmailFirst = {};
        let historySMSFirst = {};
        if (histories.length > 0) {
            for (const history of histories) {
                if (history.event === 'sms_sent' && history.collection === 'inbox' && history.idRepresentante === null) {
                    dataHistory.sms = {sent_to: history.sent_to, date: history.date};
                    if (history.motivo === 'aprobacion_registro_interno' || history.motivo === 'aprobacion_casilla' || history.motivo === 'desaprobacion_casilla') {
                        historySMSFirst = {sent_to: history.sent_to, date: history.date};
                    }
                }
                if (history.event === 'email_sent' && history.collection === 'inbox' && history.idRepresentante === null) {
                    dataHistory.email = {sent_to: history.sent_to, date: history.date};
                    if (history.motivo === 'aprobacion_registro_interno' || history.motivo === 'aprobacion_casilla' || history.motivo === 'desaprobacion_casilla') {
                        historyEmailFirst = {sent_to: history.sent_to, date: history.date};
                    }
                }
                if (history.event === 'sms_sent' && history.collection === 'inbox' && history.idRepresentante !== null) {
                    dataHistory.sms_rep = {sent_to: history.sent_to, date: history.date};
                }
                if (history.event === 'email_sent' && history.collection === 'inbox' && history.idRepresentante !== null) {
                    dataHistory.email_rep = {sent_to: history.sent_to, date: history.date};
                }
            }

            if (!dataHistory.sms) dataHistory.sms = {sent_to: user.cellphone};
            if (!dataHistory.email) dataHistory.email = {sent_to: user.email};
            if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
                dataHistory.sms_rep = dataHistory.sms_rep === undefined ? historySMSFirst : dataHistory.sms_rep;
                dataHistory.email_rep = dataHistory.email_rep === undefined ? historyEmailFirst : dataHistory.email_rep;
            }
        } else {
            dataHistory.email = {sent_to: user.email};
            dataHistory.sms = {sent_to: user.cellphone};

            if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
                dataHistory.email_rep = {sent_to: representative.email};
                dataHistory.sms_rep = {sent_to: representative.cellphone};
            }
        }

        responseData.event_history = dataHistory;
        return {success: true, user: responseData};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getUserCitizenDetailByIdEdit = async (id, token, atender) => {
    try {
        const db = await mongodb.getDb();
        let userType = "pn";
        let imgDNI = "";
        let representative = {};

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id),
        });

        if (!user) {
            return {success: false, message: "no found user"};
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectID(id)
        });

        if (!inbox) {
            return {success: false, message: "no found inbox"};
        }

        let histories = await db.collection(mongoCollections.EVENT_HISTORY).find({
            id: inbox._id, collection: 'inbox',
            motivo: {$in: ['aprobacion_registro_interno', 'aprobacion_casilla', 'desaprobacion_casilla', 'reenvio_aprobacion_casilla', 'reenvio_desaprobacion_casilla']}
        }).toArray();

        if (inbox.imageDNI) {
            let FileDNI = inbox.imageDNI
            let path = FileDNI.path
            imgDNI = await getImageDNI(path);
        }

        if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
            userType = 'pj'

            let enabled = atender !== 'true';

            const resultRep = await representativeService.findByUserId(id, enabled);
            if (!resultRep.success) {
                return {success: false, message: "no found representative"};
            }

            representative = resultRep.data;

            if (representative.file_photo != null) {
                let FileDNI = representative.file_photo
                let path = FileDNI.path
                imgDNI = await getImageDNI(path);
            }
        } else {
            userType = 'pn'
        }

        let estadoAtencion = {enAtencion: false};
        if (atender !== undefined && atender === "true") {
            estadoAtencion = await procesarEnAtencion(inbox._id.toString(), token);
        }

        let historyContact = null;
        if (inbox.status === 'APROBADO' || inbox.create_user !== 'owner') {
            historyContact = await registerLogService.findAllContactHistory(inbox._id);
        }

        const dataUser = {
            doc: user.doc,
            doc_type: user.doc_type,
            type_user: userType,
            name: user.name,
            lastname: user.lastname,
            second_lastname: user.second_lastname,
            organization_doc: user.organization_doc,
            organization_name: user.organization_name,
            email: user.email,
            ubigeo: user.Ubigeo,
            paginaweb: user.PaginaWeb,
            cellphone: user.cellphone,
            phone: (user.phone != null ? user.phone !== "undefined" ? user.phone : '' : ''),
            addres: user.addres,
            accreditation: inbox.acreditation_type,
            created_at: inbox.created_at ? moment(inbox.created_at).format("DD/MM/YYYY HH:mm:ss") : '',
            evaluated_at: inbox.evaluated_at ? moment(inbox.evaluated_at).format("DD/MM/YYYY HH:mm:ss") : '',
            status: inbox.status,
            create_user: inbox.create_user,
            update_user: inbox.update_user,
            updated_password: user.updated_password,
            attachments: (inbox.attachments != null ? inbox.attachments !== "undefined" ? await inboxService.getAttachments(inbox._id, inbox.attachments, token) : '' : ''),
            pdf: (inbox.pdf_resolution != null ? inbox.pdf_resolution !== "undefined" ? await inboxService.getPdf(inbox._id,inbox.pdf_resolution, inbox.pdf_creation_solicitude, inbox.pdf_agree_tos,token):'' : ''),
            imageDNI: imgDNI,
            address: user.address,
            enAtencion: estadoAtencion.taken,
            enAtencionPor: (estadoAtencion.takenBy != null ? estadoAtencion.takenBy.name : ''),
            nroExpediente: (inbox.nroExpediente !== undefined ? inbox.nroExpediente : ''),
            dateFiling: (inbox.dateFiling !== undefined ? inbox.dateFiling : ''),
            representative: representative,
            contact_history: historyContact,
            observacion: (inbox.observacion === 'null') ? '' : inbox.observacion,
            email_sent_at: inbox.email_sent_at ? moment(inbox.email_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
            email_sent_status: inbox.email_sent_status,
            sms_sent_at: inbox.sms_sent_at ? moment(inbox.sms_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
            sms_sent_status: inbox.sms_sent_status,
            orgPol: inbox.orgPol,
            candidate: inbox.statusCandidateElectoralProcess,
            electoralProcess: inbox.electoralProcess_id ? await getProcessName(inbox.electoralProcess_id) : null
        }

        const dataHistory = {};
        let historyEmailFirst = {};
        let historySMSFirst = {};
        if (histories.length > 0) {
            for (const history of histories) {
                if (history.event === 'sms_sent' && history.collection === 'inbox' && history.idRepresentante === null) {
                    dataHistory.sms = {sent_to: history.sent_to, date: history.date};
                    if (history.motivo === 'aprobacion_registro_interno' || history.motivo === 'aprobacion_casilla' || history.motivo === 'desaprobacion_casilla') {
                        historySMSFirst = {sent_to: history.sent_to, date: history.date};
                    }
                }
                if (history.event === 'email_sent' && history.collection === 'inbox' && history.idRepresentante === null) {
                    dataHistory.email = {sent_to: history.sent_to, date: history.date};
                    if (history.motivo === 'aprobacion_registro_interno' || history.motivo === 'aprobacion_casilla' || history.motivo === 'desaprobacion_casilla') {
                        historyEmailFirst = {sent_to: history.sent_to, date: history.date};
                    }
                }
                if (history.event === 'sms_sent' && history.collection === 'inbox' && history.idRepresentante !== null) {
                    dataHistory.sms_rep = {sent_to: history.sent_to, date: history.date};
                }
                if (history.event === 'email_sent' && history.collection === 'inbox' && history.idRepresentante !== null) {
                    dataHistory.email_rep = {sent_to: history.sent_to, date: history.date};
                }
            }

            if (!dataHistory.sms) dataHistory.sms = {sent_to: user.cellphone};
            if (!dataHistory.email) dataHistory.email = {sent_to: user.email};
            if (user.inbox_doc_type === 'ruc' || user.inbox_doc_type === 'pr') {
                dataHistory.sms_rep = dataHistory.sms_rep === undefined ? historySMSFirst : dataHistory.sms_rep;
                dataHistory.email_rep = dataHistory.email_rep === undefined ? historyEmailFirst : dataHistory.email_rep;
            }
        } else {
            dataHistory.email = {sent_to: user.email};
            dataHistory.sms = {sent_to: user.cellphone};
            if (user.inbox_doc_type === 'ruc' || user.inbox_doc_type === 'pr') {
                dataHistory.email_rep = {sent_to: representative.email};
                dataHistory.sms_rep = {sent_to: representative.cellphone};
            }
        }

        dataUser.event_history = dataHistory;
        return {success: true, user: dataUser};
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const getUserCitizenDetailPjById = async (id, token, atender) => {
    try {
        const db = await mongodb.getDb();
        var tipoUser = "";
        let imgDNI = "";
        let resultOfficials = [];

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id),
        });

        if (!user) {
            return {success: false};
        }

        let inbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectID(id)
        });

        let histories = await db.collection(mongoCollections.EVENT_HISTORY).find({
            id: inbox._id,
            collection: 'inbox',
            motivo: {$in: ['aprobacion_registro_interno', 'aprobacion_casilla', 'desaprobacion_casilla', 'reenvio_aprobacion_casilla', 'reenvio_desaprobacion_casilla']}
        }).toArray();

        if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
            tipoUser = 'J';
            let cursorRepresentative;
            if(inbox.status !== 'DESAPROBADO'){
                cursorRepresentative = await db.collection(mongoCollections.REPRESENTATIVE).find({user_id: ObjectID(id)}).sort({created_at: -1});
            }else {
                cursorRepresentative = await db.collection(mongoCollections.REPRESENTATIVE).find({user_id: ObjectID(id),position: {$in: ['1', '2']}}).sort({created_at: -1});
            }
            let representantes = [];
            for await (const representative of cursorRepresentative) {
                if (representative.created_at !== undefined) representative.created_at = moment(representative.created_at).format("YYYY-MM-DD HH:mm:ss");
                if (representative.updated_at !== undefined) representative.updated_at = moment(representative.updated_at).format("YYYY-MM-DD HH:mm:ss");
                if (representative.date_begin !== undefined) representative.date_begin = moment(representative.date_begin).format("YYYY-MM-DD HH:mm:ss");
                if (representative.date_end !== undefined) representative.date_end = moment(representative.date_end).format("YYYY-MM-DD HH:mm:ss");
                if (representative.evaluated_at !== undefined) representative.evaluated_at = moment(representative.evaluated_at).format("YYYY-MM-DD HH:mm:ss");
                representative.doc_type = representative.doc_type.toUpperCase();
                if (representative.email_sent_at !== undefined) representative.email_sent_at = moment(representative.email_sent_at).format("DD/MM/YYYY HH:mm:ss");
                if (representative.sms_sent_at !== undefined) representative.sms_sent_at = moment(representative.sms_sent_at).format("DD/MM/YYYY HH:mm:ss");

                // VALIDAR SI EXISTE EL ATRIBUTO "file_document"
                if (typeof representative.file_document === "undefined") {
                    representative.file_document = [];
                }

                // VALIDAR SI EL ATRIBUTO "file_document" ES ARRAY
                if (!Array.isArray(representative.file_document)) {
                    let temp = representative.file_document;
                    representative.file_document = [];
                    representative.file_document.push(temp);
                }

                if (typeof representative.file_document1 !== "undefined") {
                    if (typeof representative.file_document1[0] !== "undefined" && typeof representative.file_document1[0].path !== "undefined") {
                        representative.file_document.push(representative.file_document1[0]);
                    }
                }

                if (typeof representative.file_document2 !== "undefined") {
                    if (typeof representative.file_document2[0] !== "undefined" && typeof representative.file_document2[0].path !== "undefined") {
                        representative.file_document.push(representative.file_document2[0]);
                    }
                }

                if (typeof representative.file_photo === "undefined") {
                    representative.file_photo = null;
                }

                representantes.push(representative);

                if (representative.file_photo != null) {
                    let FileDNI = representative.file_photo;
                    let path = FileDNI.path;
                    imgDNI = await getImageDNI(path);
                }
            }

            let estadoAtencion = {enAtencion: false};

            //show motivo
            let reason_disapproved = [];
            if (inbox.status === 'DESAPROBADO') {
                let motive = inbox.motivo;
                for (let i = 1; i <= Object.keys(motive).length; i++) {
                    if (motive['motivo' + i] && motive['motivo' + i].value) {
                        reason_disapproved.push(motive['motivo' + i].detalle);
                    }
                }
            }

            resultOfficials = await representativeService.findByInboxIdAndEnabledTrue(inbox._id);

            let historyContact = null;
            if (inbox.status === 'APROBADO' || inbox.create_user !== 'owner') {
                historyContact = await registerLogService.findAllContactHistory(inbox._id);
            }
            let RepresentativeHistory = null;
            if (inbox.status === 'APROBADO' || inbox.create_user !== 'owner' || inbox.status === 'DESAPROBADO' ) {
                RepresentativeHistory = await registerLogService.findAllRepresentativeHistory(inbox._id);
            }

            let Event_history = null;
            if (inbox.status === 'APROBADO' || inbox.create_user !== 'owner' || inbox.status === 'DESAPROBADO' ) {
                Event_history = await registerLogService.findEvent_history(inbox._id,1);
            }
            const dataUser = {
                doc: user.doc,
                doc_type: user.doc_type,
                type_user: tipoUser,
                name: user.name,
                lastname: user.lastname,
                second_lastname: user.second_lastname,
                organization_doc: user.organization_doc,
                organization_name: user.organization_name,
                startingNumber: user.numeroPartida,
                registrySeat: user.asientoRegistral,
                email: user.email,
                ubigeo: user.Ubigeo,
                paginaweb: user.PaginaWeb,
                cellphone: user.cellphone,
                phone: (user.phone != null ? user.phone !== "undefined" ? user.phone : '' : ''),
                addres: user.addres,
                created_at: inbox.created_at ? moment(inbox.created_at).format("DD/MM/YYYY HH:mm:ss") : '',
                evaluated_at: inbox.evaluated_at ? moment(inbox.evaluated_at).format("DD/MM/YYYY HH:mm:ss") : '',
                status: inbox.status,
                evaluator_user_names: inbox.evaluator_user_names,
                updated_password: user.updated_password,
                accreditation: inbox.acreditation_type,
                attachments: inbox.attachments,
                imageDNI: imgDNI,
                address: user.address,
                representantes: representantes,
                contact_history: historyContact,
                representative: RepresentativeHistory,
                event_history: Event_history,
                officials: resultOfficials.data,
                enAtencion: estadoAtencion,
                nroExpediente: (inbox.nroExpediente !== undefined ? inbox.nroExpediente : ''),
                dateFiling: (inbox.dateFiling !== undefined ? inbox.dateFiling : ''),
                observacion: (inbox.observacion === 'null') ? '' : inbox.observacion,
                reason_disapproved: reason_disapproved,
                email_sent_at: inbox.email_sent_at ? moment(inbox.email_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
                email_sent_status: inbox.email_sent_status,
                sms_sent_at: inbox.sms_sent_at ? moment(inbox.sms_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
                sms_sent_status: inbox.sms_sent_status,
                email_sent_at_rep: inbox.email_sent_at_rep ? moment(inbox.email_sent_at_rep).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
                email_sent_status_rep: inbox.email_sent_status_rep,
                sms_sent_at_rep: inbox.sms_sent_at_rep ? moment(inbox.sms_sent_at_rep).format("DD/MM/YYYY HH:mm:ss.SSS") : '',
                sms_sent_status_rep: inbox.sms_sent_status_rep,
                filesGenerated: inbox.filesGenerated,
                inboxId: inbox._id,
                orgPol: (inbox.orgPol !== undefined ) ? inbox.orgPol : '0'
            }

            const dataHistory = {};
            let historyEmailFirst = {};
            let historySMSFirst = {};
            if (histories.length > 0) {
                for (const history of histories) {
                    if (history.event === 'sms_sent' && history.collection === 'inbox' && history.idRepresentante === null) {
                        dataHistory.sms = {sent_to: history.sent_to, date: history.date};
                        if (history.motivo === 'aprobacion_registro_interno' || history.motivo === 'aprobacion_casilla' || history.motivo === 'desaprobacion_casilla') {
                            historySMSFirst = {sent_to: history.sent_to, date: history.date};
                        }
                    }
                    if (history.event === 'email_sent' && history.collection === 'inbox' && history.idRepresentante === null) {
                        dataHistory.email = {sent_to: history.sent_to, date: history.date};
                        if (history.motivo === 'aprobacion_registro_interno' || history.motivo === 'aprobacion_casilla' || history.motivo === 'desaprobacion_casilla') {
                            historyEmailFirst = {sent_to: history.sent_to, date: history.date};
                        }
                    }
                    if (history.event === 'sms_sent' && history.collection === 'inbox' && history.idRepresentante !== null) {
                        dataHistory.sms_rep = {sent_to: history.sent_to, date: history.date};
                    }
                    if (history.event === 'email_sent' && history.collection === 'inbox' && history.idRepresentante !== null) {
                        dataHistory.email_rep = {sent_to: history.sent_to, date: history.date};
                    }
                }

                if (!dataHistory.sms) dataHistory.sms = {sent_to: user.cellphone};
                if (!dataHistory.email) dataHistory.email = {sent_to: user.email};
                if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
                    dataHistory.sms_rep = dataHistory.sms_rep === undefined ? historySMSFirst : dataHistory.sms_rep;
                    dataHistory.email_rep = dataHistory.email_rep === undefined ? historyEmailFirst : dataHistory.email_rep;
                }
            } else {
                dataHistory.email = {sent_to: user.email};
                dataHistory.sms = {sent_to: user.cellphone};
                if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
                    dataHistory.email_rep = {sent_to: representantes[0].email};
                    dataHistory.sms_rep = {sent_to: representantes[0].cellphone};
                }
            }

            dataUser.event_history1 = dataHistory;
            return {success: true, user: dataUser};
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const procesarEnAtencion = async (inbox_id, token) => {
    let key = "INBOX_ID:" + inbox_id;
    let takenInbox = await validarEnAtencion(inbox_id);
    let session = await getSession(token);

    if (takenInbox != null) {
        if (takenInbox.takenBy.user_id === session.user_id) {
            return {taken: false, takenBy: null};
        }
        return {taken: true, takenBy: takenInbox.takenBy};
    }
    takenInbox = {takenBy: {user_id: session.user_id, name: session.name + " " + session.lastname}};
    await redisWriter.set(key, JSON.stringify(takenInbox), 'EX', takenInboxTtl);
    logger.info(takenInbox);

    return {taken: false, takenBy: null};
}

const validarEnAtencion = async (inbox_id) => {
    let key = "INBOX_ID:" + inbox_id;
    let data = await redisReader.get(key);
    return JSON.parse(data);
}

const getSession = async (token) => {
    return JSON.parse(await redisReader.get(token));
}

const obtieneDNICiudadano = async (iduser) => {
    const db = await mongodb.getDb();
    const datosCiudadano = await db.collection(mongoCollections.INBOX).findOne({
        register_user_id: iduser,
    });

    return {success: true, datosCiudadano: datosCiudadano};
}

const updateEstateInbox = async (iduser, estado, motivo = null, name, email, sessionUser) => {
    const db = await mongodb.getDb();
    let objectMotivo, officials = {};
    let resultOfficials = [];
    let ids = [];
    const dateApproved = new Date();
    let cargo;

    const pendingInbox = await db.collection(mongoCollections.INBOX).findOne({
        user_id: ObjectID(iduser),
    });
    if (!pendingInbox) {
        return {success: false, error: 'No tiene casilla'};
    }

    if (pendingInbox.status !== 'PENDIENTE') {
        return {success: false, error: 'La solicitud registro de casilla ya fue atendida'};
    }

    if (estado === 'APROBADO') {
        // 1- VALIDACION PARA NUMERO DE DOCUMENTO
        let inbox_by_doc = await db.collection(mongoCollections.INBOX).findOne({
            doc: pendingInbox.doc, doc_type: pendingInbox.doc_type, $or: [{status: 'APROBADO'}, {status: null}],
        });

        if (inbox_by_doc != null) {
            return {success: false, error: 'Ya existe una casilla electrónica aprobada con el documento ingresado'};
        }

        if (pendingInbox.doc_type === 'dni' || pendingInbox.doc_type === 'ce') {
            // 2- Validación para EMAIL
            let inbox_by_email = await db.collection(mongoCollections.INBOX).findOne({
                $and: [{email: pendingInbox.email,}, {$or: [{doc_type: 'dni'}, {doc_type: 'ce'}]}],
                $or: [{status: 'APROBADO'}, {status: null}],
            });

            if (inbox_by_email != null) {
                return {success: false, error: 'Ya existe una casilla electrónica aprobada con el correo ingresado'};
            }

            // 3- Validación para CELULAR
            let inbox_by_celular = await db.collection(mongoCollections.INBOX).findOne({
                $and: [{cellphone: pendingInbox.cellphone,}, {$or: [{doc_type: 'dni'}, {doc_type: 'ce'}]}],
                $or: [{status: 'APROBADO'}, {status: null}],
            });

            if (inbox_by_celular != null) {
                return {success: false, error: 'Ya existe una casilla electrónica aprobada con el número de celular'};
            }
        }
    }

    if (motivo != null) {
        objectMotivo = motivo;
    }

    const evaluator_names = sessionUser.name + ' ' + sessionUser.lastname + ' ' + (sessionUser.second_lastname !== undefined ? sessionUser.second_lastname : '');

    const result = await db.collection(mongoCollections.INBOX).update({_id: pendingInbox._id}, {
        $set: {
            status: estado,
            motivo: objectMotivo,
            update_date: dateApproved,
            evaluator_user_id: ObjectID(sessionUser.id),
            evaluator_user_names: evaluator_names.trim(),
            evaluated_at: dateApproved
        }
    });

    let password = '';
    let userDoc = '';
    let user = await db.collection(mongoCollections.USERS).findOne({
        _id: ObjectID(iduser),
    });
    let dataUserUpdate = {status: estado};

    if (estado === "APROBADO") {
        password = crypto.randomBytes(5).toString('hex');
        userDoc = user.doc;
        dataUserUpdate.password = utils.passwordHash(password);
    }

    let resultUser = await db.collection(mongoCollections.USERS).update({_id: user._id}, {
        $set: dataUserUpdate
    });

    //creating field in inbox to know if it is a political organization or not
    const result2 = await db.collection(mongoCollections.INBOX).update({_id: pendingInbox._id}, {
        $set: {
            orgPol: user.orgPol
        }
    });

    let names = `${user.name} ${user.lastname != null ? user.lastname : ''} ${user.second_lastname != null ? user.second_lastname : ''}`;
    if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
        names = `${user.organization_name}`;
    }

    if (result) {
        console.log("Aprobacion de la casilla para el ciudadano: " + name + " - iduser: " + ObjectID(iduser) + " - DNI: " + pendingInbox.doc);
        let messageSMS = estado === "APROBADO" ? appConstants.MESSAGE_CREATE_INBOX : appConstants.MESSAGE_INBOX_DESAPROBADO
        let motivoEnvio = estado === "APROBADO" ? "aprobacion_casilla" : "desaprobacion_casilla"
        
        //Generate new Perfiles
        if (estado === "APROBADO") {
            resultOfficials = await representativeService.findByUsersId(user._id);
            ids.push(pendingInbox.user_ids[0]);
            for (let index = 0; index < resultOfficials.data.length; index++) {
                const element = resultOfficials.data[index];
                let newUser = {
                    doc_type: user.doc_type,
                    doc: user.doc,
                    numeroPartida: user.numeroPartida,
                    profile: 'citizen',
                    name: element.names,
                    lastname: element.lastname,
                    second_lastname: element.second_lastname,
                    organization_name: user.organization_name,
                    email: element.email,
                    cellphone: element.cellphone,
                    create_user: 'owner',
                    orgPol: user.orgPol
                }
                let resultNewUser = await createUsers(newUser);
                ids.push(resultNewUser.data.insertedId);
                officials[element.position] = {active: true, id: ObjectId(element._id)};

                let name = `${element.names} ${element.lastname != null ? element.lastname : ''} ${element.second_lastname != null ? element.second_lastname : ''}`;

                let updateRepresentante = {user_id: resultNewUser.data.insertedId};
                const dataNewUser = resultNewUser.data;

                await db.collection(mongoCollections.REPRESENTATIVE).update({_id: element._id}, {
                    $set: updateRepresentante
                });
                const dataHistory = {
                    user_id: element.user_id,
                    inbox_id: pendingInbox._id,
                    representative_id: element._id,
                    doc_type: element.doc_type,
                    doc: element.doc,
                    cellphone: element.cellphone,
                    email: element.email,
                }
                await registerLogService.registerContactHistory(dataHistory, 'email', evaluator_names, dateApproved);
                await registerLogService.registerContactHistory(dataHistory, 'cellphone', evaluator_names, dateApproved);
                logger.info('success insert history contact');

                let pass = '';
                let newUserUpdate = {status: estado};
                pass = crypto.randomBytes(5).toString('hex');
                newUserUpdate.password = utils.passwordHash(pass);
                            
                await db.collection(mongoCollections.USERS).update({_id: resultNewUser.data.insertedId}, {
                    $set: newUserUpdate
                });
                
                /*Promise.all([resultSMS = smsService.sendSms(element.cellphone, messageSMS),]).then((values) => {
                    registerLogService.registerLog("sms_sent", mongoCollections.INBOX, pendingInbox._id, null, element.cellphone, values[0], motivoEnvio, resultNewUser.data.insertedId);
                });
                
                Promise.all([emailService.sendEmailEstateInbox(name, element.email, estado, pass, newUser.doc, objectMotivo),]).then((values) => {
                    registerLogService.registerLog("email_sent", mongoCollections.INBOX, pendingInbox._id, null, element.email, values[0], motivoEnvio, resultNewUser.data.insertedId);
                });*/

                //Validar si se puede usar la forma anterior de enviar los correos y SMS (con Promise)
                const resultSMS = await smsService.sendSms(element.cellphone, messageSMS)
                await registerLogService.registerLog("sms_sent", mongoCollections.INBOX, pendingInbox._id, null, element.cellphone, resultSMS, motivoEnvio, resultNewUser.data.insertedId);

                const resultSendEmailEstateInbox = await emailService.sendEmailEstateInbox(name, element.email, estado, pass, newUser.doc, objectMotivo, element.position_name);
                await registerLogService.registerLog("email_sent", mongoCollections.INBOX, pendingInbox._id, null, element.email, resultSendEmailEstateInbox, motivoEnvio, resultNewUser.data.insertedId);

                console.log("RESULTADOS", resultSMS, resultSendEmailEstateInbox)
            }

            const res = await db.collection(mongoCollections.INBOX).update({_id: pendingInbox._id}, {
                $set: {
                    user_ids: ids,
                }
            });
        }

        let updated_inbox = await db.collection(mongoCollections.INBOX).findOne({
            _id: pendingInbox._id,
        });

        //Sending messages to PJ/PN
        Promise.all([smsService.sendSms(user.cellphone, messageSMS),]).then((values) => {
            registerLogService.registerLog("sms_sent", mongoCollections.INBOX, pendingInbox._id, ObjectID(iduser), user.cellphone, values[0], motivoEnvio);
        });

        //Getting "cargo" based on if the PJ is a political organitzation or not
        cargo = updated_inbox.orgPol === "1" ? "Personero Legal Titular" : ""

        await Promise.all([emailService.sendEmailEstateInbox(names, email, estado, password, userDoc, objectMotivo, cargo)]).then(async (values) => {
            await registerLogService.registerLog("email_sent", mongoCollections.INBOX, pendingInbox._id, ObjectID(iduser), user.email, values[0], motivoEnvio, null, values[0] ? null : await utils.encrypt(password));
        });

        //Sending messages to Representative
        if (user.doc_type === 'ruc' || user.doc_type === 'pr') {
            const representative = await representativeService.findByUserId(user._id, true);
            if (representative.success) {
                name = `${representative.data.names} ${representative.data.lastname != null ? representative.data.lastname : ''} ${representative.data.second_lastname != null ? representative.data.second_lastname : ''}`;
                if (representative.data.cellphone !== user.cellphone) {
                    Promise.all([smsService.sendSms(representative.data.cellphone, messageSMS),]).then((values) => {
                        registerLogService.registerLog("sms_sent", mongoCollections.INBOX, pendingInbox._id, null, representative.data.cellphone, values[0], motivoEnvio, representative.data._id);
                    });
                }

                if (representative.data.email !== user.email) {
                    await Promise.all([emailService.sendEmailEstateInbox(name, representative.data.email, estado, password, userDoc, objectMotivo, cargo)]).then(async (values) => {
                        await registerLogService.registerLog("email_sent", mongoCollections.INBOX, pendingInbox._id, null, representative.data.email, values[0], motivoEnvio, representative.data._id, values[0] ? null : await utils.encrypt(password));
                    });
                }

                if (estado === 'APROBADO') {
                    //register history-data
                    const dataHistory = {
                        user_id: representative.data.user_id,
                        inbox_id: representative.data.inbox_id,
                        doc_type: representative.data.doc_type,
                        doc: representative.data.doc,
                        cellphone: representative.data.cellphone,
                        email: representative.data.email,
                    }
                    await registerLogService.registerContactHistory(dataHistory, 'email', evaluator_names, dateApproved);
                    await registerLogService.registerContactHistory(dataHistory, 'cellphone', evaluator_names, dateApproved);
                    logger.info('success insert history contact');
                    officials[representative.data.position] = {active: true, id: representative.data._id};
                }
            }
        }

        if (estado === "APROBADO") {
            //Notificación automática si es Candidato
            Promise.all([searchCLARIDAD(pendingInbox.doc, pendingInbox.doc_type, true)]).then((values) => {
                console.log(values);
            });

            //register history-data
            const dataHistory = {
                user_id: user._id,
                inbox_id: pendingInbox._id,
                doc_type: user.doc_type,
                doc: user.doc,
                cellphone: user.cellphone,
                email: user.email,
            }
            await registerLogService.registerContactHistory(dataHistory, 'email', evaluator_names, dateApproved);
            await registerLogService.registerContactHistory(dataHistory, 'cellphone', evaluator_names, dateApproved);
            logger.info('success insert history contact');
        }
        if (estado === "DESAPROBADO") {
            resultOfficials = await db.collection(mongoCollections.REPRESENTATIVE).find({user_id: user._id, position: {$in : ['1', '2']}}).toArray();
            resultOfficials.forEach(element => {
                officials[element.position] = {active: true, id: ObjectId(element._id)};
            });
        }
        // Guardar funcionarios al momento de la aprobacion o desaprobación
        await db.collection(mongoCollections.INBOX).update({_id: pendingInbox._id}, {
            $set: {
                officials: officials
            }
        });
    }

    return {success: true, aprobado: estado, pendingInbox: pendingInbox};
}

const resendEmailAndSms = async (data) => {
    const db = await mongodb.getDb();
    let result;

    try {
        let oInbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectID(data.userId),
        });

        let oUser = await db.collection(mongoCollections.USERS).findOne({
            _id: oInbox.user_id,
        });

        if (oInbox) {
            let full_name = '';
            let password = '';
            let password_hash = '';
            let password_decrypt = '';
            let isSame = false;

            if (oInbox.status === 'APROBADO' || oInbox.create_user !== 'owner') {
                let oHistory = await db.collection(mongoCollections.EVENT_HISTORY).findOne({
                    id: oInbox._id,
                    motivo: {$in: ['aprobacion_casilla', 'aprobacion_registro_interno']},
                    event: 'email_sent'
                });

                password = oHistory.password ? await utils.decrypt(oHistory.password) : crypto.randomBytes(5).toString('hex');
                password_hash = utils.passwordHash(password);
            }

            let objectMotive = oInbox.motivo;
            let messageSMS = (oInbox.status === 'APROBADO' || oInbox.create_user !== 'owner') ? appConstants.MESSAGE_CREATE_INBOX : appConstants.MESSAGE_INBOX_DESAPROBADO;
            let motiveSend = (oInbox.status === 'APROBADO' || oInbox.create_user !== 'owner') ? 'reenvio_aprobacion_casilla' : 'reenvio_desaprobacion_casilla';
            let collection = mongoCollections.INBOX;

            if (oInbox.doc_type === 'ruc' || oInbox.doc_type === 'pr') {
                full_name = oInbox.organization_name;

                const representative = await representativeService.findByInboxId(oInbox._id);
                if (representative.success) {
                    const rep = representative.data[0];
                    if (data.sendType === 'email' && rep.email === oInbox.email) {
                        isSame = true;
                    }

                    if (data.sendType === 'sms' && rep.cellphone === oInbox.cellphone) {
                        isSame = true;
                    }
                }
            } else {
                full_name = oInbox.full_name;
            }

            if (data.sendType === 'email' && !data.isRep) {
                if ((oInbox.status === 'APROBADO' || oInbox.create_user !== 'owner') && oUser.updated_password) {
                    return {success: false, message: 'REENVÍO NO DISPONIBLE. El usuario realizó el cambio de contraseña.'};
                }

                if ((oInbox.doc_type === 'ruc' || oInbox.doc_type === 'pr') && !isSame && !oInbox.email_sent_at_rep) {
                    await db.collection(mongoCollections.INBOX).updateOne({_id: oInbox._id}, {
                        $set: {email_sent_at_rep: oInbox.email_sent_at, email_sent_status_rep: oInbox.email_sent_status}
                    });
                }
                await Promise.all([emailService.sendEmailEstateInbox(full_name, data.email, password ? 'APROBADO' : oInbox.status, password, oInbox.doc, objectMotive, oInbox.orgPol === '1' ? 'Personero Legal Titular' : '')])
                    .then(async (values) => {
                        result = values [0];
                        await registerLogService.registerLog("email_sent", collection, oInbox._id, ObjectID(data.userId), data.email, values[0], motiveSend);

                        if (oInbox.status === 'APROBADO' || oInbox.create_user !== 'owner') {
                            await db.collection(mongoCollections.USERS).updateOne({_id: ObjectID(data.userId)}, {
                                $set: {password: password_hash, updated_password: false}
                            });
                        }
                    });
            }

            if (data.sendType === 'sms' && !data.isRep) {
                if ((oInbox.doc_type === 'ruc' || oInbox.doc_type === 'pr') && !isSame && !oInbox.sms_sent_at_rep) {
                    await db.collection(mongoCollections.INBOX).updateOne({_id: oInbox._id}, {
                        $set: {sms_sent_at_rep: oInbox.sms_sent_at, sms_sent_status_rep: oInbox.sms_sent_status}
                    });
                }
                await Promise.all([smsService.sendSms(data.cellphone, messageSMS),]).then(async (values) => {
                    result = values [0];
                    await registerLogService.registerLog("sms_sent", collection, oInbox._id, ObjectID(data.userId), data.cellphone, values[0], motiveSend);
                });
            }

            if (data.isRep) {
                const representative = await representativeService.findByInboxId(oInbox._id);
                if (representative.success) {
                    const repArray = representative.data;
                    let rep;
                    if (data.RepId) {
                        rep = repArray.find(rep => rep.user_id.toString() === data.RepId);
                    } else {
                        rep = repArray[0];
                    }
                    if (!rep) return {success: false, message: 'Funcionario actualizado, no se puede realizar el reenvío'};
                    if (data.sendType === 'sms') {
                        await Promise.all([smsService.sendSms(rep.cellphone, messageSMS),])
                            .then(async (values) => {
                                result = values [0];
                                await registerLogService.registerLog("sms_sent", collection, oInbox._id, null, rep.cellphone, values[0], motiveSend, rep.user_id);
                            });
                    }

                    if (data.sendType === 'email') {
                        full_name = `${rep.names} ${rep.lastname} ${rep.second_lastname}`;

                        const user = await db.collection(mongoCollections.USERS).findOne({_id: rep.user_id})

                        if ((oInbox.status === 'APROBADO' || oInbox.create_user !== 'owner') && user.updated_password) {
                            return {success: false, message: 'REENVÍO NO DISPONIBLE. El usuario realizó el cambio de contraseña.'};
                        }

                        await Promise.all([emailService.sendEmailEstateInbox(full_name, rep.email, password ? 'APROBADO' : oInbox.status, password, oInbox.doc, objectMotive, oInbox.orgPol === '1' ? rep.position_name : '')])
                            .then(async (values) => {
                                result = values [0];
                                await registerLogService.registerLog("email_sent", collection, oInbox._id, null, rep.email, values[0], motiveSend, rep.user_id);
                                if (oInbox.status === 'APROBADO' || oInbox.create_user !== 'owner') {
                                    await db.collection(mongoCollections.USERS).updateOne({_id: ObjectID(rep.user_id)}, {
                                        $set: {password: password_hash, updated_password: false}
                                    });
                                }
                            });
                    }
                }
            }
            return {success: result, message: ''};
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const resendEmailAndSmsNotification = async (data) => {
    const db = await mongodb.getDb();
    let result, message;

    try {
        let oNotification = await db.collection(mongoCollections.NOTIFICATIONS).findOne({
            _id: ObjectID(data.notificationId),
        });

        if (oNotification) {
            let isSame = false;
            let data2,representative,userData;
            if(data.position){
                data2 = await db.collection(mongoCollections.REPRESENTATIVE).findOne({inbox_id: oNotification.inbox_id,position:(data.position)});
                userData = await getEmailCitizen3(data2.user_id);
            }else {
                userData = await getEmailCitizen(oNotification.inbox_doc_type, oNotification.inbox_doc);
            }

            let motiveSend = 'reenvio_notificacion';
            let collection = mongoCollections.NOTIFICATIONS;
            const urlNotification = appConstants.URL_REAL_NOTIFICATION + oNotification._id;

            if (oNotification.inbox_doc_type === 'ruc' || oNotification.inbox_doc_type === 'pr') {
                if(data.position){
                    representative = data2;
                }else{
                    representative = await representativeService.findByUserId(userData.id, true);
                }

                if (representative.success) {
                    const rep = representative.data;
                    if (data.sendType === 'email' && rep.email === userData.email) {
                        isSame = true;
                    }

                    if (data.sendType === 'sms' && rep.cellphone === userData.cellphone) {
                        isSame = true;
                    }
                }
            }

            if (data.sendType === 'email' && !data.isRep) {
                if ((oNotification.inbox_doc_type === 'ruc' || oNotification.inbox_doc_type === 'pr') && !isSame && !oNotification.email_sent_at_rep) {
                    await db.collection(mongoCollections.NOTIFICATIONS).updateOne({_id: oNotification._id}, {
                        $set: {
                            email_sent_at_rep: oNotification.email_sent_at,
                            email_sent_status_rep: oNotification.email_sent_status
                        }
                    });
                }

                const resultSendEmail = await emailService.sendEmailNewNotification(oNotification, urlNotification, userData.email);
                result = resultSendEmail;
                await registerLogService.registerLog("email_sent", collection, oNotification._id, userData.id, userData.email, resultSendEmail, motiveSend);
            }

            if (data.sendType === 'sms' && !data.isRep) {
                if ((oNotification.inbox_doc_type === 'ruc' || oNotification.inbox_doc_type === 'pr') && !isSame && !oNotification.sms_sent_at_rep) {
                    await db.collection(mongoCollections.NOTIFICATIONS).updateOne({_id: oNotification._id}, {
                        $set: {
                            sms_sent_at_rep: oNotification.sms_sent_at,
                            sms_sent_status_rep: oNotification.sms_sent_status
                        }
                    });
                }

                const resultSendSMS = await smsService.sendSms(userData.cellphone, "ONPE\nDocumento: " + oNotification.expedient + "\nURL:" + urlNotification);
                result = resultSendSMS;
                await registerLogService.registerLog("sms_sent", collection, oNotification._id, userData.id, userData.cellphone, resultSendSMS, motiveSend);
            }

            if (data.isRep) {
                if(data.position){
                    data2 = await db.collection(mongoCollections.REPRESENTATIVE).findOne({inbox_id: oNotification.inbox_id,position:(data.position)});
                    representative = await representativeService.findByUserId(data2.user_id.toString(), true);
                }else {
                    representative = await representativeService.findByUserId(userData.id, true);
                }
                if (representative.success) {
                    const rep = representative.data;

                    if (data.sendType === 'sms') {
                        const resultSendSMSRepresentative = await smsService.sendSms(rep.cellphone, "ONPE\nDocumento: " + oNotification.expedient + "\nURL:" + urlNotification);
                        result = resultSendSMSRepresentative;
                        await registerLogService.registerLog("sms_sent", collection, oNotification._id, null, rep.cellphone, resultSendSMSRepresentative, motiveSend, isSame ? null : rep._id);
                    }

                    if (data.sendType === 'email') {
                        const resultSendEmailRepresentative = await emailService.sendEmailNewNotification(oNotification, urlNotification, rep.email);
                        result = resultSendEmailRepresentative;
                        await registerLogService.registerLog("email_sent", collection, oNotification._id, null, rep.email, resultSendEmailRepresentative, motiveSend, isSame ? null : rep._id);
                    }
                }else{
                    message = 'Funcionario actualizado, no se puede realizar el reenvío'
                }
            }

            return {success: result, message: message};
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const verifyRepSmsAndEmail = async (userData, representative, collection, oNotification) => {
    const db = await mongodb.getDb();

    try {
        if (userData.email !== representative.data.email) {
            let result = await db.collection(collection).findOne({
                _id: ObjectID(oNotification._id), email_sent_at_rep: {$exists: true}
            });

            if (!result) {
                await db.collection(collection).updateOne({
                    _id: oNotification._id
                }, {$set: {email_sent_at_rep: null, email_sent_status_rep: false}});
            }
        }

        if (userData.cellphone !== representative.data.cellphone) {
            let result = await db.collection(collection).findOne({
                _id: ObjectID(oNotification._id), sms_sent_at_rep: {$exists: true}
            });

            if (!result) {
                await db.collection(collection).updateOne({
                    _id: oNotification._id
                }, {$set: {sms_sent_at_rep: null, sms_sent_status_rep: false}});
            }
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

    return true;
}
const consultExistInbox = async (usersData) => {
    try {
        const db = await mongodb.getDb();
        let results = [];

        for (let doc of usersData) {
            let result = await db.collection(mongoCollections.USERS).find({doc: doc, profile: 'citizen', $or: [{status: 'APROBADO'}, {status: null}]}).toArray();
            if (result.length > 0) {
                results.push({ doc, exists: true });
            } else {
                results.push({ doc, exists: false });
            }
        }
        return results;
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const existUserRegister = async (docType, doc) => {
    try {
        const db = await mongodb.getDb();

        const exists = await db.collection(mongoCollections.USERS).findOne({
            doc_type: docType,
            doc: doc,
            $or: [
                { profile: { $ne: 'citizen' } },
                { profiles: { $exists: true }}
            ]
        });

        if (exists) {
            return {success: false, error: 'Ya existe un usuario registrado con el mismo número de documento'};
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const existUserRegisterLDAP = async (usuario) => {
    try {
        const db = await mongodb.getDb();

        const exists = await db.collection(mongoCollections.USERS).findOne({
            LDAP: usuario,
            $or: [
                { profile: { $ne: 'citizen' } },
                { profiles: { $exists: true }}
            ]
        });

        if (exists) {
            return {success: false, error: 'Ya existe un usuario registrado con LDAP ' + usuario};
        }
    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const getUserById = async (id) => {
    try {
        const db = await mongodb.getDb();

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id)
        });

        if (!user) {
            return {success: false};
        }

        return {
            success: true, user: {
                id: user._id,
                doc: user.doc,
                doc_type: user.doc_type,
                name: user.name,
                lastname: user.lastname,
                second_lastname: user.second_lastname,
                email: user.email,
                cellphone: user.cellphone,
                job_area_code: user.job_area_code,
                profiles: user.profiles,
                LDAP: user.LDAP,
            }
        };

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }

}
const profilesAvailable = async (id,profile) => {
    try {
        const db = await mongodb.getDb();
        const today = new Date();

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id),
        });

        if (!user) {
            return {success: false};
        }

        const profiles = user.profiles;
        const profileActive = profile;
        const profilesAvailable = user.profiles
            ? Object.keys(profiles)
            .filter(key => {
                const profile = profiles[key];
                const fechaIni = profile.fechaIni ? new Date(profile.fechaIni) : null;
                const fechaFin = profile.fechaFin && profile.fechaFin !== 'Indeterminado' ? new Date(profile.fechaFin) : profile.fechaFin;
                return profile.estado && (!fechaIni || fechaIni <= today) && (!fechaFin || fechaFin >= today || fechaFin === 'Indeterminado') && key !== profileActive;
            }).map(key => {
                const profile = profiles[key];
                const nameMap = {
                    'admin': 'Administrador',
                    'notifier': 'Notificador',
                    'register': 'Operador de registro',
                    'consult': 'Operador de consulta'
                };
                return {value: key, estado: profile.estado , name: nameMap[key]
                };
            }) : '';

        return {
            success: true, user: {
                doc: user.doc,
                doc_type: user.doc_type,
                name: user.name,
                lastname: user.lastname,
                second_lastname: user.second_lastname,
                profiles: profilesAvailable,
            }
        };

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}

const searchUserLDAP = async (ldapUsername) => {
    const ldapAuthenticator = new LdapAuthenticator();
    try {
        const userFound = await ldapAuthenticator.search(ldapUsername);
        return userFound; // Retorna true si el usuario es encontrado, false si no
    } catch (err) {
        // Loguea el error usando tu sistema de logging, por ejemplo, logger.error(err);
        throw new Error('Error interno del servidor');
    }
  };
const userDisable = async (id,motivo,usuarioRegistro,usuario) => {
    try {
        const db = await mongodb.getDb();
        let user_history = [];

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id)
        });
        const editor = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectId(usuario)
        });

        if (!user) {
            return {success: false};
        }
        if( user.isSuperAdmin ){
            return {success: false, error: 'No puede deshabilitar este usuario'}
        }
        if( usuario === user._id.toString() ){
            return {success: false, error: 'El usuario no puede deshabilitarse a sí mismo'}
        }

        if (editor.create_user_id?.toString() === user._id.toString()) {
            return {success: false, error: 'No puede deshabilitar el usuario que lo creó'}
        }

        Object.keys(user.profiles).forEach(key => {
            user_history.push([key, 'Se deshabilitó usuario', user.profiles[key],3]);
        })

        let event_history = {
            event: 'disable_user',
            collection: mongoCollections.USERS,
            id: user._id,
            date: new Date(),
            disabling_user_id: ObjectId(usuario),
        }

        await db.collection(mongoCollections.USERS).updateOne(user, {
            $set: {
                status: 'DESHABILITADO',
                disabled_at: new Date(),
                disabling_user: usuarioRegistro,
                disabling_user_id: ObjectId(usuario),
                disabled_reason: motivo,
            }
        });
        await registerLogService.registerUserHistory(id, user_history, usuarioRegistro, usuario)
        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

        return {success: true, message: 'Usuario deshabilitado correctamente'};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const userEnable = async (id,motivo,usuarioRegistro,usuario) => {
    try {
        const db = await mongodb.getDb();
        let user_history = [];

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id)
        });

        const editor = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectId(usuario)
        });

        if (!user) {
            return {success: false};
        }

        if( usuario === user._id.toString() ){
            return {success: false, error: 'El usuario no puede habilitarse a sí mismo'}
        }
        if (editor.create_user_id?.toString() === user._id.toString()) {
            return {success: false, error: 'No puede habilitar el usuario que lo creó'}
        }

        Object.keys(user.profiles).forEach(key => {
            user_history.push([key, 'Se habilitó usuario', user.profiles[key], 4]);
        })

        let event_history = {
            event: 'enable_user',
            collection: mongoCollections.USERS,
            id: user._id,
            date: new Date(),
            enabling_user_id: ObjectId(usuario),
            status_old: user.status
        }

        await db.collection(mongoCollections.USERS).updateOne(user,
        {
            $set: {
                status_old: user.status,
                enabled_at: new Date(),
                enabling_user: usuarioRegistro,
                enabling_user_id: ObjectId(usuario),
                enabled_reason: motivo,
            },
            $unset: {
                status: ""
            }
        })
        await registerLogService.registerUserHistory(id, user_history, usuarioRegistro, usuario)
        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

        return {success: true, message: 'Usuario habilitado correctamente'};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const DisableUsers = async (file, usuarioRegistro, usuario) => {
    try {
        let user_history = [];
        const db = await mongodb.getDb();
        const excel = XLSX.read(file, { type: 'buffer' });
        const nombresHojas = excel.SheetNames;
        const hoja = excel.Sheets[nombresHojas[0]];
        let datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });
        let datos1 = XLSX.utils.sheet_to_json(hoja, { header: 0 });
        const expectedHeaders = ["TIPO DOC", "DOCUMENTO", "USUARIO LDAP", "MOTIVO", "INFORMACIÓN"];
        const editor = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectId(usuario)
        });

        let filaExcel = 1;

        if (datos1.length < 1) {
            return { success: false, error: 'El archivo no contiene datos' };
        }

        datos[0].push('INFORMACIÓN');

        if (!Array.isArray(datos[0]) || datos[0].length !== expectedHeaders.length ||
            !datos[0].every((val, index) => val === expectedHeaders[index])) {
            return { success: false, error: 'El archivo no contiene las cabeceras correctas.' };
        }

        for (let i = 1; i < datos.length; i++) {
            user_history = []
            filaExcel++;
            const fila = datos[i];
            if (fila.length === 0) {
                continue
            }
            const docType = fila[0] ? fila[0].toLowerCase() : null;
            const doc = fila[1] ? fila[1].toString() : null;
            const ldap = fila[2] ? fila[2].toUpperCase() : null;
            const motivo = fila[3] ? fila[3].toUpperCase() : '';

            if (motivo === '') {
                datos[i].push('')
            }
            let infoMessage = '';

            if (!docType || !doc || !ldap) {
                infoMessage = 'Verifique los datos de la fila ' + filaExcel;
                datos[i][4]=infoMessage;
                console.error(infoMessage);
                continue;
            }

            let user = await db.collection(mongoCollections.USERS).findOne({
                doc_type: docType,
                doc: doc,
                LDAP: ldap,
                status: null,
                profiles: { $exists: true }
            });

            if (user) {
                if (user.isSuperAdmin) {
                    infoMessage = 'No puede deshabilitar este usuario';
                    datos[i].push(infoMessage);
                    console.error(infoMessage);
                    continue;
                }

                if (usuario === user._id.toString()) {
                    infoMessage = 'El usuario no puede deshabilitarse a sí mismo';
                    datos[i].push(infoMessage);
                    console.error(infoMessage);
                    continue;
                }

                if (editor.create_user_id?.toString() === user._id.toString()) {
                    infoMessage = 'No puede deshabilitar el usuario que lo creó';
                    datos[i].push(infoMessage);
                    console.error(infoMessage);
                    continue;
                }

                let event_history = {
                    event: 'disable_user',
                    collection: mongoCollections.USERS,
                    id: user._id,
                    date: new Date(),
                    disabling_user_id: ObjectId(usuario),
                };

                Object.keys(user.profiles).forEach(key => {
                    user_history.push([key, 'Se deshabilitó usuario', user.profiles[key], 3]);
                })
                await db.collection(mongoCollections.USERS).updateOne(user, {
                    $set: {
                        status: 'DESHABILITADO',
                        disabled_at: new Date(),
                        disabling_user: usuarioRegistro,
                        disabling_user_id: ObjectId(usuario),
                        disabled_reason: motivo,
                    }
                });

                await registerLogService.registerUserHistory(user._id, user_history, usuarioRegistro, usuario)
                await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

                infoMessage = 'Usuario deshabilitado correctamente';
                datos[i].push(infoMessage);
                console.info(infoMessage);

            } else {
                infoMessage = 'No existe usuario habilitado con los datos de la fila ' + filaExcel;
                datos[i].push(infoMessage);
                console.error(infoMessage);
            }
        }

        const buffer2 = await reportDisableUsers(datos,usuarioRegistro)

        return {
            success: true,
            message: 'Archivo cargado correctamente',
            file: buffer2
        };

    } catch (err) {
        logger.error(err);
        return { success: false, error: errors.INTERNAL_ERROR };
    }
}
const userCitizenDisable = async (official,motivo,usuarioRegistro,usuario) => {
    try {
        const db = await mongodb.getDb();
        const user_id = ObjectId(official.user_id);
        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(user_id)
        });

        if (!user) {
            return {success: false};
        }
        if( user.status === 'DESHABILITADO'){
            return {success: false, error: 'El usuario ya se encuentra deshabilitado'}
        }
        if( user.profile !== 'citizen'){
            return {success: false, error: 'El usuario no es de perfil Ciudadano'}
        }
        if( user.isSuperAdmin ){
            return {success: false, error: 'No puede deshabilitar este usuario'}
        }
        if( usuario === user._id.toString() ){
            return {success: false, error: 'El usuario no puede deshabilitarse a sí mismo'}
        }

        let event_history = {
            event: 'disable_user_citizen',
            collection: mongoCollections.USERS,
            id: user._id,
            date: new Date(),
            disabling_user_id: ObjectId(usuario),
        }

        await db.collection(mongoCollections.USERS).updateOne(user, {
            $set: {
                status: 'DESHABILITADO',
                disabled_at: new Date(),
                disabling_user: usuarioRegistro,
                disabling_user_id: ObjectId(usuario),
                disabled_reason: motivo,
            }
        });
        await db.collection(mongoCollections.REPRESENTATIVE).updateOne({_id: ObjectId(official._id)}, {
            $set: {
                status: 'DESHABILITADO',
                disabled_at: new Date(),
                disabling_user: usuarioRegistro,
                disabling_user_id: ObjectId(usuario),
                disabled_reason: motivo,
            }
        });

        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

        return {success: true, message: 'Usuario deshabilitado correctamente'};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const userCitizenEnable = async (official,motivo,usuarioRegistro,usuario) => {
    try {
        const db = await mongodb.getDb();
        const user_id = ObjectId(official.user_id);
        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(user_id)
        });

        if (!user) {
            return {success: false};
        }
        if( user.status !== 'DESHABILITADO'){
            return {success: false, error: 'El usuario ya se encuentra habilitado'}
        }
        if( user.profile !== 'citizen'){
            return {success: false, error: 'El usuario no es de perfil Ciudadano'}
        }
        if( user.isSuperAdmin ){
            return {success: false, error: 'No puede habilitar este usuario'}
        }
        if( usuario === user._id.toString() ){
            return {success: false, error: 'El usuario no puede habilitarse a sí mismo'}
        }

        let event_history = {
            event: 'enable_user_citizen',
            collection: mongoCollections.USERS,
            id: user._id,
            date: new Date(),
            disabling_user_id: ObjectId(usuario),
        }

        await db.collection(mongoCollections.USERS).updateOne(user, {
            $unset: {
                status : ''
            },
            $set: {
                enabled_at: new Date(),
                enabling_user: usuarioRegistro,
                enabling_user_id: ObjectId(usuario),
                enabled_reason: motivo,
            }
        });
        await db.collection(mongoCollections.REPRESENTATIVE).updateOne({_id: ObjectId(official._id)}, {
            $unset: {
                status : ''
            },
            $set: {
                disabled_at: new Date(),
                disabling_user: usuarioRegistro,
                disabling_user_id: ObjectId(usuario),
                disabled_reason: motivo,
            }
        });

        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

        return {success: true, message: 'Usuario habilitado correctamente'};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const inboxDisable = async (id,motivo,usuarioRegistro,usuario) => {
    try {
        const db = await mongodb.getDb();
        let userOfRepresentative;
        let idsRepresentatives = [];

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id),
            status: {$ne: 'DESHABILITADO'}
        });
        const editor = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectId(usuario)
        });

        let inbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectId(id),
            status: {$ne: 'DESHABILITADO'}
        })

        if (!editor.isSuperAdmin) {
            return {success: false, error: 'No cuenta con permisos suficientes para deshabilitar la casilla'}
        }
        if (!user || !inbox) {
            return {success: false, error: 'No existe casilla por deshabilitar'};
        }
        if (user.isSuperAdmin) {
            return {success: false, error: 'No puede deshabilitar este usuario'}
        }
        if (usuario === user._id.toString()) {
            return {success: false, error: 'El usuario no puede deshabilitarse a sí mismo'}
        }

        let event_history = {
            event: 'disable_inbox',
            collection: mongoCollections.INBOX,
            id: inbox._id,
            date: new Date(),
            disabling_user_id: ObjectId(usuario),
            motivo: motivo
        }

        user && await db.collection(mongoCollections.USERS).updateOne(user, {
            $set: {
                status_old: user.status ? user.status : '',
                status: 'DESHABILITADO',
                disabled_at: new Date(),
                disabling_user: usuarioRegistro,
                disabling_user_id: ObjectId(usuario),
                disabled_reason: motivo,
            }
        });
        inbox && await db.collection(mongoCollections.INBOX).updateOne(inbox, {
            $set: {
                status_old: inbox.status ? inbox.status : '',
                status: 'DESHABILITADO',
                disabled_at: new Date(),
                disabling_user: usuarioRegistro,
                disabling_user_id: ObjectId(usuario),
                disabled_reason: motivo,
            }
        });
        if (inbox.orgPol === '1' || user.orgPol === '1') {
            let representatives = await db.collection(mongoCollections.REPRESENTATIVE).find({
                inbox_id: inbox._id,
                enabled: true,
                status: {$ne: 'DESHABILITADO'},
                position: {$nin: ['1', '2']}
            });

            for await (const representative of representatives) {
                userOfRepresentative = await db.collection(mongoCollections.USERS).findOne({
                    _id: ObjectId(representative.user_id),
                    status: {$ne: 'DESHABILITADO'},
                });
                if (userOfRepresentative) {
                    await db.collection(mongoCollections.USERS).updateOne(userOfRepresentative, {
                        $set: {
                            status_old: userOfRepresentative.status ? userOfRepresentative.status : '',
                            status: 'DESHABILITADO',
                            disabled_at: new Date(),
                            disabling_user: usuarioRegistro,
                            disabling_user_id: ObjectId(usuario),
                            disabled_reason: motivo,
                        }
                    });
                    idsRepresentatives.push(userOfRepresentative._id)
                    logger.info('Usuario deshabilitado con id ' + userOfRepresentative._id)
                }
            }
        }
        idsRepresentatives.length !== 0 ? event_history.idsUsersOfRepresentatives = idsRepresentatives : null;
        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

        return {success: true, message: 'Casilla deshabilitada correctamente'};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const inboxEnable = async (id,motivo,usuarioRegistro,usuario) => {
    try {
        const db = await mongodb.getDb();
        let userOfRepresentative;
        let idsRepresentatives = [];
        let isPN;

        let user = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectID(id),
            status: 'DESHABILITADO'
        });
        (user.doc_type === 'dni' || user.doc_type === 'ce') ? isPN = true : isPN = false;
        const editor = await db.collection(mongoCollections.USERS).findOne({
            _id: ObjectId(usuario)
        });

        let inbox = await db.collection(mongoCollections.INBOX).findOne({
            user_id: ObjectId(id),
            status: 'DESHABILITADO'
        })
        const searchUser = await db.collection(mongoCollections.INBOX).findOne({
            doc_type: user.doc_type,
            doc: user.doc,
            status: {$in: ['APROBADO', null, 'PENDIENTE']}
        })
        const searchEmail = await db.collection(mongoCollections.INBOX).findOne({
            doc_type: {$in: ['dni', 'ce']},
            email: user.email,
            status: {$in: ['APROBADO', null, 'PENDIENTE']}
        })
        const searchCellphone = await db.collection(mongoCollections.INBOX).findOne({
            doc_type: {$in: ['dni', 'ce']},
            cellphone: user.cellphone,
            status: {$in: ['APROBADO', null, 'PENDIENTE']}
        })
        if (searchUser) {
            return {success: false, error:`No se puede habilitar esta casilla. Ya existe una casilla con el número de documento ${searchUser.doc} con estado ${!searchUser.status ? 'REGISTRO INTERNO' : searchUser.status}`};
        }
        if (searchEmail && isPN) {
            return {success: false, error:`No se puede habilitar esta casilla. Ya existe una casilla con el correo electrónico ${searchEmail.email} con estado ${!searchEmail.status ? 'REGISTRO INTERNO' : searchEmail.status}`};
        }
        if (searchCellphone && isPN) {
            return {success: false, error:`No se puede habilitar esta casilla. Ya existe una casilla con el número de celular ${searchCellphone.cellphone} con estado ${!searchCellphone.status ? 'REGISTRO INTERNO' : searchCellphone.status}`};
        }

        if (!editor.isSuperAdmin) {
            return {success: false, error: 'No cuenta con permisos suficientes para habilitar la casilla'}
        }
        if (!user || !inbox) {
            return {success: false, error: 'No existe casilla por habilitar'};
        }
        if (user.isSuperAdmin) {
            return {success: false, error: 'No puede habilitar este usuario'}
        }
        if (usuario === user._id.toString()) {
            return {success: false, error: 'El usuario no puede habilitarse a sí mismo'}
        }

        let event_history = {
            event: 'enable_inbox',
            collection: mongoCollections.INBOX,
            id: inbox._id,
            date: new Date(),
            enabling_user_id: ObjectId(usuario),
            motivo: motivo
        }
        const baseUpdate = {
            enabled_at: new Date(),
            enabling_user: usuarioRegistro,
            enabling_user_id: ObjectId(usuario),
            enabled_reason: motivo
        };

        const updateOperationUser = {
            $set: {
                ...baseUpdate,
                status_old: user?.status || ''
            }
        };

        const updateOperationInbox = {
            $set: {
                ...baseUpdate,
                status_old: inbox?.status || ''
            }
        };

        if (user?.status_old === '') {
            updateOperationUser.$unset = { status: '' };
        } else if (user) {
            updateOperationUser.$set.status = user.status_old;
        }

        if (user) {
            await db.collection(mongoCollections.USERS).updateOne(
                { _id: user._id },
                updateOperationUser
            );
        }

        if (inbox?.status_old === '') {
            updateOperationInbox.$unset = { status: '' };
        } else if (inbox) {
            updateOperationInbox.$set.status = inbox.status_old;
        }

        if (inbox) {
            await db.collection(mongoCollections.INBOX).updateOne(
                { _id: inbox._id },
                updateOperationInbox
            );
        }
        if (inbox.orgPol === '1' || user.orgPol === '1') {
            let representatives = await db.collection(mongoCollections.REPRESENTATIVE).find({
                inbox_id: inbox._id,
                enabled: true,
                position: {$nin: ['1', '2']}
            });

            for await (const representative of representatives) {
                userOfRepresentative = await db.collection(mongoCollections.USERS).findOne({
                    _id: ObjectId(representative.user_id),
                    status: 'DESHABILITADO',
                });
                const updateOperationUserRep = {
                    $set: {
                        ...baseUpdate,
                        status_old: userOfRepresentative?.status || ''
                    }
                };
                if (userOfRepresentative) {
                    if (userOfRepresentative.status_old === '') {
                        updateOperationUserRep.$unset = { status: '' };
                    } else {
                        updateOperationUserRep.$set.status = userOfRepresentative.status_old;
                    }

                    await db.collection(mongoCollections.USERS).updateOne(
                        userOfRepresentative,
                        updateOperationUserRep
                    );
                    idsRepresentatives.push(userOfRepresentative._id)
                    logger.info('Usuario habilitado con id ' + userOfRepresentative._id)
                }
            }
        }
        idsRepresentatives.length !== 0 ? event_history.idsUsersOfRepresentatives = idsRepresentatives : null;
        await db.collection(mongoCollections.EVENT_HISTORY).insertOne(event_history);

        return {success: true, message: 'Casilla habilitada correctamente'};

    } catch (err) {
        logger.error(err);
        return {success: false, error: errors.INTERNAL_ERROR};
    }
}
const getUUOO = async() => {
    const db = await mongodb.getDb();
    return (await db.collection(mongoCollections.UUOO)
        .find({status: '1'})
        .project({ _id: 0, id: 1, name: 1 })
        .sort({ name: 1 }))
        .toArray();
}
const getProcessesActive = async() => {
    const db = await mongodb.getDb();
    return (await db.collection(mongoCollections.ELECTORAL_PROCESS)
        .find({status: 1})
        .project({ _id: 0, code: 1, name: 1 })
        .sort({ election_date: 1 }))
        .toArray();
}
const getProcessName = async(id) => {
    const db = await mongodb.getDb();
    const process = await db.collection(mongoCollections.ELECTORAL_PROCESS)
        .findOne({$or:[{ _id: id }, {_id: ObjectId(id)}]}, { projection: { name: 1, _id: 0 }});
    return process ? process.name : null;
}
module.exports = {
    searchUserLDAP,
    getUsersCitizen,
    getUsersCitizenV2,
    getUsersCitizenV3,
    createUserCitizen,
    getUserCitizen,
    createUser,
    updatePassword,
    recoverPassword,
    getEmailCitizen,
    getEmailCitizen2,
    deleteUser,
    newUser,
    editUser,
    getUsers,
    getUserCitizenById,
    getLogClaridad,
    getUserCasilla,
    existCE,
    getUserCitizenDetailById,
    getUserCitizenDetailPjById,
    updateEstateInbox,
    obtieneDNICiudadano,
    searchCLARIDAD,
    getUserCitizenDetailByIdEdit,
    resendEmailAndSms,
    resendEmailAndSmsNotification,
    consultExistInbox,
    existUserRegister,
    existUserRegisterLDAP,
    getUserById,
    profilesAvailable,
    userDisable,
    userEnable,
    DisableUsers,
    userCitizenDisable,
    userCitizenEnable,
    inboxDisable,
    inboxEnable,
    getUUOO,
    getProcessesActive
};

/**
 * Created by Alexander Llacho
 */
const jwtService = require('./../services/jwtService');
const historyService = require('./../services/historyService');
const appConstants = require('./../common/appConstants');
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const errors = require('./../common/errors');
const utils = require('./../common/utils');
const mongoCollections = require('./../common/mongoCollections');
const CryptoJS = require('crypto-js');
const {redisWriter} = require('../database/redis');
const jwt = require("jsonwebtoken");
const {ObjectId} = require("mongodb");

//const login = async (docType_, doc_, password_, representative_doc_) => {
const login = async (docType_, doc_, password_, cargo) => {

    try {
        const db = await mongodb.getDb();
        // console.log(CryptoJS.AES.encrypt(docType_, appConstants.SECRET_KEY_CITIZEN).toString());

        let docType = CryptoJS.AES.decrypt(docType_, appConstants.SECRET_KEY_CITIZEN).toString(CryptoJS.enc.Utf8);
        let doc = CryptoJS.AES.decrypt(doc_, appConstants.SECRET_KEY_CITIZEN).toString(CryptoJS.enc.Utf8).toUpperCase();
        let password = CryptoJS.AES.decrypt(password_, appConstants.SECRET_KEY_CITIZEN).toString(CryptoJS.enc.Utf8);
        let updatePass = false;
        let jwtToken = '';
        let data = [];
        let representante = {};
        let _id = '';

        if(cargo === undefined){
            let user = await db.collection(mongoCollections.USERS).findOne({
                doc_type: docType,
                doc: doc,
                profile: appConstants.PROFILE_CITIZEN,
                password: utils.passwordHash(password),
                $or: [{status: appConstants.INBOX_STATUS_APROBADO}, {status: null}]
            });
            if (!user) {
                logger.error('user ' + doc + '/' + docType + ' (citizen) not exist');
                return {success: false, error: errors.LOGIN_INVALID_DATA};
            }

            if(docType === 'ruc' || docType === 'pr'){
                representante = await db.collection(mongoCollections.REPRESENTATIVE).findOne({
                    user_id: user._id
                });
                if (representante.position != '1') {
                    logger.error('user ' + doc + '/' + docType + ' (citizen) password not equals');
                    return {success: false, error: errors.LOGIN_INVALID_DATA};
                }
            }

            jwtToken = await jwtService.generateAuthToken(
                user._id,
                docType,
                user.name,
                user.lastname ? user.lastname : user.second_lastname,
                doc,
                user.profile,
                user.organization_name,
                appConstants.JWT_TYPE_AUTH,
                ''
            );
            updatePass = user.updated_password;
            _id =  user._id;
        } else {
            let cursor = await db.collection(mongoCollections.REPRESENTATIVE).aggregate([
                {
                    $match: {
                        enabled: true,
                    }
                },
                {
                    $lookup: {
                        "from": "users",
                        "localField": "user_id",
                        "foreignField": "_id",
                        "as": "user"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        doc: 1,
                        doc_type: 1,
                        position: 1,
                        position_name:1,
                        'user._id':1,
                        'user.doc_type':1,
                        'user.doc':1,
                        'user.name':1,
                        'user.lastname':1,
                        'user.second_lastname':1,
                        'user.organization_name':1,
                        'user.profile':1,
                        'user.password':1,
                        'user.status': 1,
                        'user.updated_password':1
                    }
                },
                {
                    $match: {
                        position: cargo,
                        'user.doc_type': docType,
                        'user.doc': doc,
                        'user.profile': appConstants.PROFILE_CITIZEN,
                        'user.password': utils.passwordHash(password),
                        $or: [{'user.status': appConstants.INBOX_STATUS_APROBADO}, {'user.status': null}]
                    }
                }
            ]);
    
            for await (const item of cursor) {
                data.push(item);
            }

            if (data.length === 0 || data.length > 1) {
                logger.error('user ' + doc + '/' + docType + ' (citizen) not exist');
                return {success: false, error: errors.LOGIN_INVALID_DATA};
            }
    
            jwtToken = await jwtService.generateAuthToken(
                data[0].user[0]._id,
                docType,
                data[0].user[0].name,
                data[0].user[0].lastname ? data[0].user[0].lastname : data[0].user[0].second_lastname,
                doc,
                data[0].user[0].profile,
                data[0].user[0].organization_name,
                appConstants.JWT_TYPE_AUTH,
                data[0].position_name
            );
            updatePass = data[0].user[0].updated_password;
            _id = data[0].user[0]._id;
        }

        if (updatePass) {
            await historyService.saveHistory(appConstants.EVENT_HISTORY_LOGIN, _id);
        }       
        
        return {success: true, jwtToken: jwtToken, updated_password: updatePass};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const logout = async (authHeader) => {
    const token = authHeader.split(' ')[1];
    let user = jwt.verify(token, process.env.AUTH_JWT_HMACKEY);

    await historyService.saveHistory(appConstants.EVENT_HISTORY_LOGOUT, ObjectId(user.id));
    return await redisWriter.del(token);
}

module.exports = {login, logout};

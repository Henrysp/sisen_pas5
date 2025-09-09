/**
 * Created by Alexander Llacho
   modified by jose castro
*/
const jwtService = require('./../services/jwtService');
const appConstants = require('./../common/appConstants');
const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const errors = require('./../common/errors');
const utils = require('./../common/utils');
const mongoCollections = require('./../common/mongoCollections');
const CryptoJS = require('crypto-js');
const {redisWriter} = require('./../database/redis');
const LdapAuthenticator = require('./LdapAuthenticator');

const login = async (usuario_, password_, profile_) => {
    try {
        const ldapAuthenticator = new LdapAuthenticator();

        const db = await mongodb.getDb();
        const LDAP = require('./ldap');

        // Crear una instancia de la clase LDAP
        const ldap = new LDAP();
        console.log('.....................');

        let usuario = CryptoJS.AES.decrypt(usuario_, appConstants.SECRET_KEY).toString(CryptoJS.enc.Utf8);
        let password = CryptoJS.AES.decrypt(password_, appConstants.SECRET_KEY).toString(CryptoJS.enc.Utf8);
        let profile = CryptoJS.AES.decrypt(profile_, appConstants.SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const now = new Date();

        const user = await ldapAuthenticator.authenticate(usuario, password);

        if (!user) {
            logger.error('user ' + usuario + ' invalid credentials');
            return {success: false, error: errors.LDAP_INVALID_DATA};
        }

        let userDB = await db.collection(mongoCollections.USERS).findOne(
            {
                LDAP: usuario.toUpperCase(),
                $or: [
                    {[`profiles.${profile}.estado`]: true},
                    {profile: profile}
                ],
                $and: [
                    {$or: [
                            { status: appConstants.INBOX_STATUS_APROBADO },
                            { status: null }
                        ]
                    }
                ]
            }
        );

        if (!userDB) {
            logger.error('user ' + usuario + ' not exist');
            return {success: false, error: errors.USUARIO_INVALID_DATA};
        }

        if(!userDB.isSuperAdmin) {
            if (userDB.profiles[profile].fechaIni > now || (userDB.profiles[profile].fechaFin < now && userDB.profiles[profile].fechaFin !== "Indeterminado")) {
                logger.error('user ' + '/' + usuario + ' date invalid');
                return {success: false, error: errors.LOGIN_DATE_INVALID};
            }
        }
        
        let jwtToken = await jwtService.generateAuthToken(
            userDB._id,
            userDB.doc_type,
            userDB.doc,
            userDB.name,
            userDB.lastname,
            userDB.second_lastname === null ? '' : userDB.second_lastname,
            profile,
            userDB.job_area_code,
            userDB.job_area_name,
            appConstants.JWT_TYPE_AUTH,
            usuario.toUpperCase(),
            userDB.isSuperAdmin ? userDB.isSuperAdmin : null
    );

        return  {success: true, jwtToken: jwtToken}

    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const logout = async (authHeader) => {
    const token = authHeader.split(' ')[1];
    return await redisWriter.del(token);
}

module.exports = {login, logout};

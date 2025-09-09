/**
 * Created by Angel Quispe
 */
const jwt = require('jsonwebtoken');
const {redisWriter, redisReader} = require('./../database/redis');
const appConstants = require('./../common/appConstants');
const logger = require('./../server/logger').logger;

const authTokenTtl = 60 * 60;

const generateAuthToken = async (_id, docType, name, lastname, doc, profile, organization_name, type, cargo_name) => {
    let data = {
        id: _id,
        docType: docType,
        name: name,
        lastname: lastname,
        doc: doc,
        profile: profile,
        organization_name: organization_name,
        type: type,
        exp: Math.floor(Date.now() / 1000) + authTokenTtl,
        cargo_name
    };

    let token = jwt.sign(data, process.env.AUTH_JWT_HMACKEY);
    await redisWriter.set(token, true, 'EX', authTokenTtl);
    return token;
}

const verifyToken = async (token) => {
    try {
        let exists = await redisReader.get(token);
        if (!exists) {
          return false;
        }
        const user = jwt.verify(token, process.env.AUTH_JWT_HMACKEY);

        if (user.profile === appConstants.PROFILE_CITIZEN) {
            return true;
        }

    } catch (err) {
        logger.error(err);
    }

    return false;
}

module.exports = {generateAuthToken, verifyToken}

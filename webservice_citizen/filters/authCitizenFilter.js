/**
 * Created by Angel Quispe
 */

const jwt = require('jsonwebtoken');
const appConstants = require('./../common/appConstants');
const {redisReader} = require("../database/redis");

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        try {
            let exists = await redisReader.get(token);
            if (!exists) {
                return res.sendStatus(401);
            }
            req.user = jwt.verify(token, process.env.AUTH_JWT_HMACKEY);

            if (req.user.type === appConstants.JWT_TYPE_AUTH && req.user.profile === appConstants.PROFILE_CITIZEN) {
                req.token = token;

                return next();
            }
        } catch (err) {
            console.log(err)
        }
    }

    return res.sendStatus(401);
};

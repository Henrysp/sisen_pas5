/**
 * Created by Angel Tolentino
 */

 const jwt = require('jsonwebtoken');
 const appConstants = require('./../common/appConstants');
 const validateService = require('./../services/validateService');
 
 module.exports = async (role, req, res, next) => {
     const authHeader = req.headers.authorization;
 
     let prefix = String(authHeader);
     let validate = prefix.startsWith(appConstants.TOKEN_PREFIX);
     if (validate) {
         const token = authHeader.split(' ')[1];
         try {
            req.user = jwt.verify(token, process.env.AUTH_JWT_HMACKEY);

            let system = await validateService.getUserSystem(appConstants.SISCOM);
             if (req.user.user_service === system.user && role.includes(req.user.profile)) {
                 req.token = token;
                 return next();
             }
         } catch (err) {
             console.log(err)
         }
     }
 
     return res.status(401).send({message:"No autorizado"});
 };

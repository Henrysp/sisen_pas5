const loginService = require('./../services/loginService');
const userService = require('./../services/userService');
const recaptchaService = require('../services/recaptchaService');
const utils = require('./../common/utils');
const errors = require('./../common/errors');

const login = async (req, res, next) => {
    const {usuario, password, recaptcha, profile} = req.body;

    if (utils.isEmpty(usuario) || utils.isEmpty(password) || utils.isEmpty(recaptcha) || utils.isEmpty(profile)) {
        return res.sendStatus(400);
    }

    if (process.env.DISABLED_RECAPTCHA === 'false' && !await recaptchaService.isValid(recaptcha, req.ip)) {
        return res.sendStatus(401);
    }

    const result = await loginService.login(usuario, password, profile);

    if (!result.jwtToken) {
        return res.json({success: false, error: result.error});
    }

    let response = {success: true, token: result.jwtToken, updated_password: result.updated_password};

    return res.json(response);
}

const logout = async (req, res, next) => {
    let authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.sendStatus(401);
    }
    await loginService.logout(authHeader)

    return res.json({success: true});
}

const recoverPassword = async (req, res, next) => {
    const {usuario, recaptcha} = req.body;

    if (utils.isEmpty(usuario) || utils.isEmpty(recaptcha)) {
        return res.sendStatus(400);
    }

    if (!await recaptchaService.isValid(recaptcha, req.ip)) {
        return res.sendStatus(401);
    }

    const result = await userService.recoverPassword(usuario);

    return res.json(result);
}

const newPassword = async (req, res, next) => {
    const {oldPassword, newPassword, repeatNewPassword} = req.body;

    if (utils.isEmpty(oldPassword) || utils.isEmpty(newPassword) || utils.isEmpty(repeatNewPassword)) {
        return res.sendStatus(400);
    }

    if (newPassword !== repeatNewPassword) {
        return res.sendStatus(400);
    }

    if (!utils.validNewPassword(newPassword)) {
        return res.json({success: false, error: errors.NEW_PASSWORD_REGEX});
    }

    const result = await userService.updatePassword(req.user.usuario, req.user.profile, oldPassword, newPassword);

    if (!result.success) {
        return res.json({success: false, error: result.error});
    }

    return res.json({success: true});
}

module.exports = {login, logout, recoverPassword, newPassword};

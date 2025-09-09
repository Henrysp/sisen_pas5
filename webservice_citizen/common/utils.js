/**
 * Created by Alexander Llacho
 */
const crypto = require('crypto');

const validNumeric = (value) => {
    return /^[0-9]+$/.test(value) !== false;
}

const validEmail = (email) => {
    return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email) !== false;
}

const isEmpty = (text) => {
    if (!text) {
        return true;
    }

    return text.trim() === '';
}

const validNewPassword = (newPassword) => {
    if (newPassword.length >= 8) {
        return /^(?=.*\d)(?=.*[a-záéíóúüñ]).*[A-ZÁÉÍÓÚÜÑ]/.test(newPassword) !== false;
    }

    return false;
}

const passwordHash = (password) =>{
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = {validNumeric, validEmail, isEmpty, validNewPassword, passwordHash}

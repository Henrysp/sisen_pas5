/**
 * Created by Angel Quispe
 */
const logger = require('./../server/logger').logger;
const fs = require('fs');
const moment = require("moment");
const crypto = require('crypto');
const path_upload = process.env.PATH_UPLOAD;
const path_upload_tmp = process.env.PATH_UPLOAD_TMP;
const utilLib = require('util');
const appConstants = require("./appConstants");

fs.readFileAsync = utilLib.promisify(fs.readFile).bind(fs);
const typeFiles = ["application/pdf", "image/jpg", "image/jpeg", "image/png", "image/bmp", "image/x-ms-bmp"];

const algorithm = 'aes-256-ctr'
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'

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

const passwordHash = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const stringHash = (text) => {
    return crypto.createHash('sha256').update(text).digest('hex');
}

const getPath = (prePath) => {
    let _date = new Date(Date.now());
    return prePath + _date.getFullYear() + '/' + (_date.getMonth() + 1) + '/' + _date.getDate() + '/';
}

const copyFile = async (oldPathFile, newPath, filename, doc, timestamp, isTmp, isBlocked) => {
    //try {
    let rawData = await fs.readFileAsync(oldPathFile);

    let pathAttachment = getPath(newPath);

    let stringHashNameFile = stringHash(crypto.randomBytes(5).toString('hex') + '_' + doc + '_' + timestamp + '_' + filename);

    let newPathFile = (isTmp ? path_upload_tmp : path_upload) + "/" + pathAttachment + stringHashNameFile;

    fs.mkdirSync((isTmp ? path_upload_tmp : path_upload) + "/" + pathAttachment, {recursive: true});

    fs.writeFileSync(newPathFile, rawData);

    return {path: pathAttachment + stringHashNameFile, name: filename, blocked: isBlocked};

    /*} catch (err) {
        logger.error(err);

        return false;
    }*/

}
const existFile = async (pathFile, nameFile) => {
    let respuesta = true;
    //pathRelativo=pathFile + '/' + nameFile;
    let pathAbsoluto = pathFile + '/' + nameFile;
    //fs.readFile('./../../' + pathRelativo, 'utf8', function(err, data) {
    fs.readFileSync(pathAbsoluto, 'utf8', function (err, data) {
        if (err) {
            console.log('name: ' + nameFile + ' No es candidato');
            respuesta = false;
            return false;
            //return console.log(err);
        } else {
            console.log('name: ' + nameFile + ' Es candidato');
            respuesta = true;
            return true;
        }
    });
    return respuesta;
}

const getDate = () => {
    const dateString = moment(new Date()).local().format("YYYY-MM-DD HH:mi:ss");
    if (!dateString) {
        return null
    }
    const splitDate = dateString.substr(0, 10).split("-");
    const splitHours = dateString.substr(11, 8).split(":");
    const receivedDate = new Date(Date.UTC(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2]), parseInt(splitHours[0]),
        parseInt(splitHours[1]), parseInt(splitHours[2])));
    return receivedDate;
}

/**
 * Validate yyyy-mm-dd date
 * @param dateString
 * @returns {boolean}
 */
function isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false;  // Invalid format
    const d = new Date(dateString);
    const dNum = d.getTime();
    if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
    return d.toISOString().slice(0, 10) === dateString;
}

function validateByteFile(typeFile, signedFile) {
    switch (typeFile) {
        case "application/pdf":
            return (Buffer.isBuffer(signedFile) && signedFile.lastIndexOf("%PDF-") === 0 && signedFile.lastIndexOf("%%EOF") > -1);
        case "image/jpg":
        case "image/jpeg":
            return (/^(ffd8ffe([0-9]|[a-f]){1}$)/g).test(signedFile.toString('hex').substring(0, 8));
        case "image/png":
            return signedFile.toString('hex').startsWith("89504e47");
        case "image/bmp":
        case "image/x-ms-bmp":
            return signedFile.toString('hex').startsWith("424d");
        case "video/mp4":
        case "video/quicktime":
        case "video/x-ms-wmv":
        case "video/avi":
        case "video/x-avchd":
        case "application/octet-stream":
        case "audio/mpeg":
        case "application/x-shockwave-flash":
        case "application/x-zip-compressed":
            return true;
        default:
            return false;
    }
}

const validateFiles = async (files, filesIndex, nameFile) => {
    let isValid = true;
    let message = "";

    for await (let file of filesIndex) {
        let fileObject = nameFile + file.index;
        if (files[fileObject].size === 0 || files[fileObject].size > appConstants.TAM_MAX_FILE) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${files[fileObject].name} tiene tamaño no válido`;
            break;
        }
        if (!typeFiles.includes(files[fileObject].type)) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${files[fileObject].name} debe ser formato PDF, JPEG, JPG, PNG o BMP`;
            break;
        }
        const signedFile = fs.readFileSync(files[fileObject].path);
        if (!validateByteFile(files[fileObject].type, signedFile)) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${files[fileObject].name} está dañado o no es válido`;
            break
        }
    }

    return {isValid: isValid, message: message};
}

const validateNotiFiles = async (files, filesIndex, nameFile) => {
    let isValid = true;
    let message = "";

    for await (let file of filesIndex) {
        let fileObject = nameFile + file.index;
        if (files[fileObject].size === 0 || files[fileObject].size > appConstants.TAM_MAX_NOTI_FILE) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${files[fileObject].name} con tamaño no válido`;
            break;
        }
        const signedFile = fs.readFileSync(files[fileObject].path);
        if (!validateByteFile(files[fileObject].type, signedFile)) {
            isValid = false;
            message += ((message.length > 0) ? ", " : "") + `El archivo ${files[fileObject].name} está dañado o no es válido`;
            break
        }
    }

    return {isValid: isValid, message: message};
}

function diacriticSensitiveRegex(string = '') {
    return string.replace(/a/g, '[a,á,à,ä]')
        .replace(/e/g, '[e,é,ë]')
        .replace(/i/g, '[i,í,ï]')
        .replace(/o/g, '[o,ó,ö,ò]')
        .replace(/u/g, '[u,ü,ú,ù]');
}

const encrypt = async (text) => {
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv)

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    }
}

const decrypt = async (hash) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'))

    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()])

    return decrpyted.toString()
}


module.exports = {
    validNumeric,
    validEmail,
    isEmpty,
    validNewPassword,
    passwordHash,
    getPath,
    copyFile,
    stringHash,
    existFile,
    getDate,
    isValidDate,
    validateByteFile,
    validateFiles,
    validateNotiFiles,
    diacriticSensitiveRegex,
    encrypt,
    decrypt
};

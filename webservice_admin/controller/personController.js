const {util} = require('chai');
const {utils} = require('mocha');
const personService = require('./../services/personService')

const save = async (req, res) => {
    let person = req.fields;
    let userLoggedName = req.user.name + ' ' + req.user.lastname + ' ' + req.user.second_lastname;

    let response = await personService.save(person, userLoggedName.trim());
    return res.status(200).json(response);
}

const findExiste = async (req, res, next) => {
    const {dni} = req.query;
    let persona = await personService.findByDni(dni);
    if (!persona) {
        return res.status(200).json({success: false});
    } else {
        return res.status(200).json({success: true});
    }
}

const findByDni = async (req, res, next) => {
    const {dni} = req.query;
    let persona = await personService.findByDni(dni);
    if (!persona) {
        return res.status(200).json({"success": false});
    } else {
        return res.status(200).json({"success": true, data: persona});
    }
}

module.exports = {save, findExiste, findByDni};

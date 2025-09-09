const mongodb = require('./../database/mongodb');
const mongoCollections = require('../common/mongoCollections');
const {logger} = require("../server/logger");

const findByDni = async (dni) => {
    try {
        const db = await mongodb.getDb();
        let result = await db.collection(mongoCollections.PERSON).findOne({
            dni: dni
        })
        if (result === false) {
            return {success: false}
        } else {
            return result;
        }
    } catch (error) {
        return {success: false};
    }
}

const save = async (reqPerson, userName) => {
    let oPerson = await findByDni(reqPerson.dni);

    try {
        const db = await mongodb.getDb();

        if (!oPerson) {
            const newPerson = {
                dni: reqPerson.dni,
                digverifica: reqPerson.digverifica,
                fenac: reqPerson.fenac,
                paterno: reqPerson.paterno,
                materno: reqPerson.materno,
                nombre: reqPerson.nombre,
                regmanual: true,
                created_at: new Date(),
                created_user: userName
            }

            let result = await db.collection(mongoCollections.PERSON).insertOne(newPerson);
            return {success: true, message: "El ciudadano se a registrado correctamente"};
        } else {
            return ({success: false, message: "El ciudadano ya existe en la base de datos"});
        }
    } catch (error) {
        logger.error(error);
        return {success: false};
    }
}

module.exports = {findByDni, save};


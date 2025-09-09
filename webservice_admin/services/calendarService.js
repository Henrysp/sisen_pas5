/**
 * @author Alexander Llacho
 */

const mongodb = require('./../database/mongodb');
const logger = require('./../server/logger').logger;
const mongoCollections = require('./../common/mongoCollections');
const utils = require('./../common/utils');
const {ObjectId} = require("mongodb");
const errors = require('./../common/errors');


const fetchAll = async (page, size, filters) => {
    try {
        const db = await mongodb.getDb();

        filters = JSON.parse(filters);
        let queryFilter = {
            enabled: true
        };
        let dateBegin;
        let dateEnd;
        let valueEditable;

        for (const data of filters) {
            if (data.field === 'editable' && !utils.isEmpty(data.value)) {
                switch (data.value) {
                    case 'yes':
                        valueEditable = true;
                        break;
                    case 'not':
                        valueEditable = false;
                        break;
                    case 'all':
                        valueEditable = {$in: [true, false]};
                        break;
                }
            }

            if (!utils.isEmpty(data.value)) {
                switch (data.field) {
                    case 'id':
                        queryFilter._id = {$ne: ObjectId(data.value)};
                        break;
                    case 'title':
                        // queryFilter.title =  new RegExp(utils.diacriticSensitiveRegex(data.value), 'i');
                        queryFilter.$or = [
                            {title: new RegExp(utils.diacriticSensitiveRegex(data.value), 'i')},
                            {description: new RegExp(utils.diacriticSensitiveRegex(data.value), 'i')}
                        ]
                        break;
                    case 'editable':
                        queryFilter.editable = valueEditable;
                        break;
                    case 'dateBegin':
                        dateBegin = new Date(data.value);
                        dateBegin = dateBegin.setDate(dateBegin.getDate());
                        queryFilter.date_begin = {$gte: new Date(dateBegin)};

                        if (filters[3].value === '') {
                            dateEnd = new Date(data.value);
                            dateEnd = dateEnd.setDate(dateEnd.getDate())
                            queryFilter.date_end = {$gte: new Date(dateEnd)};
                        }
                        break;
                    case 'dateEnd':
                        if (filters[2].value === '') {
                            dateBegin = new Date(data.value);
                            dateBegin = dateBegin.setDate(dateBegin.getDate());
                            queryFilter.date_begin = {$lte: new Date(dateBegin)};
                        }

                        dateEnd = new Date(data.value);
                        dateEnd = dateEnd.setDate(dateEnd.getDate())
                        queryFilter.date_end = {$lte: new Date(dateEnd)};
                        break;
                }
            }
        }

        const cursorCalendar = await db.collection(mongoCollections.CALENDAR)
            .find(queryFilter)
            .skip(page > 0 ? ((page - 1) * size) : 0)
            .limit(size)
            .sort({$natural: -1})
            .project({
                _id: 1,
                title: 1,
                description: 1,
                range: 1,
                date_begin: 1,
                date_end: 1,
                editable: 1,
            });
        let total = await cursorCalendar.count();

        let data = [];
        for await (const item of cursorCalendar) {
            data.push(item);
        }

        const pageCount = Math.ceil(total / size);

        return {page: page, size: size, pages: pageCount, total: total, data: data};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const findById = async (id) => {
    const db = await mongodb.getDb();

    try {
        const result = await db.collection(mongoCollections.CALENDAR).findOne({_id: ObjectId(id)}, {
            projection: {
                _id: 1,
                title: 1,
                description: 1,
                range: 1,
                date_begin: 1,
                date_end: 1,
                file_document: 1
            }
        });

        if (result != null) {
            return {success: true, data: result};
        }else{
            return {success:false, error: errors.INTERNAL_ERROR}
        }
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const findByRangeDate = async (id, dIni, dFin) => {
    const db = await mongodb.getDb();
    let queryFilter = {};
    try {
        if (id !== '') {
            queryFilter._id = {$ne: ObjectId(id)};
        }
        queryFilter.$or = [
            {date_begin: {$gte: new Date(dIni), $lt: new Date(dFin)}},
            {date_end: {$gte: new Date(dIni), $lt: new Date(dFin)}}
        ]
        const result = await db.collection(mongoCollections.CALENDAR)
            .find(queryFilter)
            .project({
                _id: 1,
                rangeDate: 1,
                date_begin: 1,
                date_end: 1,
            });

        let data = "";
        for await (const item of result) {
            data += item.rangeDate + ",";
        }

        return {success: true, data: data};
    } catch (err) {
        logger.error(err);
        return {success: false};
    }
}

const save = async (data, listFile, rangeDate) => {

    try {
        const db = await mongodb.getDb();
        let newDate = utils.isEmpty(data.dateEnd) ? null : new Date(data.dateEnd);
        // let newDate = new Date(data.dateEnd);
        // newDate = new Date(newDate.setDate(newDate.getDate() + 1));

        const newData = {
            title: data.title,
            description: data.description,
            date_begin: new Date(data.dateBegin),
            date_end: newDate,
            range: data.range,
            rangeDate: rangeDate,
            file_document: listFile,
            editable: true,
            enabled: true,
            created_at: new Date()
        };

        let result = await db.collection(mongoCollections.CALENDAR).insertOne(newData);

        return {success: true};
    } catch (err) {
        logger.error(err);
    }

    return {success: false};
}

const update = async (data, listFile, rangeDate) => {
    const db = await mongodb.getDb();

    try {
        const oCalendar = await db.collection(mongoCollections.CALENDAR).findOne({
            _id: ObjectId(data.id)
        });

        if (!oCalendar) {
            return {success: false};
        }

        let newDate = utils.isEmpty(data.dateEnd) ? null : new Date(data.dateEnd);
        // let newDate = new Date(data.dateEnd);
        // newDate = new Date(newDate.setDate(newDate.getDate() + 1));

        if (data.filesDisabled === "0") {
            listFile = [];
        }
        const result = await db.collection(mongoCollections.CALENDAR).updateOne({_id: ObjectId(data.id)}, {
            $set: {
                title: data.title,
                description: data.description,
                range: data.range,
                rangeDate: rangeDate,
                date_begin: new Date(data.dateBegin),
                date_end: newDate,
                file_document: listFile,
                updated_at: new Date(),
            }
        });

        if (result.modifiedCount === 1) {
            return {success: true};
        }
    } catch (err) {
        logger.error(err);
    }

    return {success: false};
}

const updateEstate = async () => {
    const db = await mongodb.getDb();

    let queryFilter = {};

    var hoy = new Date();
    hoy.setDate(hoy.getDate() - 1);

    queryFilter.date_begin = {$lte: hoy}
    queryFilter.date_end = {$lte: hoy}
    queryFilter.editable = true;

    const cursorCalendar = await db.collection(mongoCollections.CALENDAR)
        .find(queryFilter)
        .project({
            _id: 1,
            editable: 1,
        });

    for await (const item of cursorCalendar) {
        await db.collection(mongoCollections.CALENDAR).updateOne({_id: ObjectId(item._id)}, {
            $set: {
                editable: false
            }
        });
    }
}

async function rangoFechas(fi, fF) {
    var fechaInicio = new Date(fi);
    var fechaFin = new Date(fF);
    var fechas = [];
    while (fechaFin.getTime() >= fechaInicio.getTime()) {
        fechas.push(fechaInicio.getFullYear() + '-' + (fechaInicio.getMonth() + 1).toString().padStart(2, '0') + '-' + fechaInicio.getDate().toString().padStart(2, '0'));
        fechaInicio.setDate(fechaInicio.getDate() + 1);
    }
    return fechas;
};

module.exports = {
    fetchAll,
    findById,
    findByRangeDate,
    save,
    update,
    updateEstate,
    rangoFechas
};

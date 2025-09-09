ExcelJS = require('exceljs');
recursos = require('../common/recursosConstants');
const mongodb = require('./../database/mongodb');
const appConstants = require('./../common/appConstants');
const mongoCollections = require('./../common/mongoCollections');
const logger = require('./../server/logger').logger;
const utils = require('./../common/utils');
const calendarService = require('./../services/calendarService');
const moment = require('moment');
const FILL_HEADER = {
    type: "pattern",
    pattern: "solid",
    bgColor: {argb: "1d357200"},
};
const ALIGMENT_CENTER = {vertical: "middle", horizontal: "center"};
const ALIGMENT_LEFT = {vertical: "middle", horizontal: "left"};
const ALIGMENT_JUNP_TEXT = {wrapText: true, vertical: 'middle', horizontal: 'center'};
const ALIGMENT_MIDDLE = {vertical: "middle"};
const ALIGMENT_JUNP_HEADER = {wrapText: true, vertical: 'middle', horizontal: 'center'};
const ALIGMENT_JUNP_CELL = {wrapText: true};

const FONT_SHEET_HEADER = {
    name: 'Calibri',
    size: 18,
    bold: true,
    color: {argb: '00000000'},
};
const FONT_ROWS = {
    name: 'Calibri',
    size: 12,
    color: {argb: '00000000'},
};
const FONT_COLUMN_HEADER = {
    name: 'Calibri',
    size: 12,
    bold: true,
    color: {argb: '00FFFFFF'},
};
const FONT_COLUMN_BOLD = {
    name: 'Calibri',
    size: 12,
    bold: true,
};
const BORDER_THIN = {
    top: {style: 'thin'},
    left: {style: 'thin'},
    bottom: {style: 'thin'},
    right: {style: 'thin'}
};

let daysHoliday = [];

const reporteCasillas = async (usuario, fechaInicio, fechaFin, documentType, documentNumber) => {
    let hoy = utils.getDate();
    let hoyFormat = moment(hoy).add(5, 'hours').format("YYYY-MM-DD HH:mm:ss");
    //hoyFormat = hoyFormat1.tz('America/Lima').format("YYYY-MM-DD HH:mm:ss");

    const workbook = new ExcelJS.Workbook();
    workbook.lastModifiedBy = 'ONPE';
    workbook.created = hoy;
    workbook.modified = hoy;
    workbook.lastPrinted = hoy;
    const worksheet = workbook.addWorksheet('Hoja1');

    worksheet.mergeCells('C1:X3');
    worksheet.getCell('C1').value = 'Reporte de Casillas Electrónicas';
    worksheet.getCell('C1').font = FONT_SHEET_HEADER;
    worksheet.getCell('C1').alignment = ALIGMENT_CENTER;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 25;
    worksheet.getColumn(6).width = 25;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 23;
    worksheet.getColumn(10).width = 23;
    worksheet.getColumn(11).width = 25;
    worksheet.getColumn(12).width = 20;
    worksheet.getColumn(13).width = 30;
    worksheet.getColumn(14).width = 30;
    worksheet.getColumn(15).width = 15;
    worksheet.getColumn(16).width = 17;
    worksheet.getColumn(17).width = 22;
    worksheet.getColumn(18).width = 20;
    worksheet.getColumn(19).width = 18;
    worksheet.getColumn(20).width = 50;
    worksheet.getColumn(21).width = 50;
    worksheet.getColumn(22).width = 50;
    worksheet.getColumn(23).width = 50;
    worksheet.getColumn(24).width = 50;
    worksheet.getColumn(25).width = 120;
    worksheet.getColumn(26).width = 40;
    worksheet.getColumn(27).width = 40;

    const HEADER = ['C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8', 'N8', 'O8', 'P8', 'Q8', 'R8', 'S8', 'T8', 'U8', 'V8', 'W8', 'X8', 'Y8', 'Z8', 'AA8'];
    for (let item of HEADER) {
        worksheet.getCell(item).fill = FILL_HEADER;
        worksheet.getCell(item).font = FONT_COLUMN_HEADER;
        worksheet.getCell(item).alignment = ALIGMENT_CENTER;
        worksheet.getCell(item).border = BORDER_THIN;
    }
    const logo = workbook.addImage({
        base64: recursos.LOGO_BASE64,
        extension: 'png',
    });
    worksheet.addImage(logo, 'A1:B3');

    worksheet.getCell('C5').value = 'Usuario: ';
    worksheet.getCell('D5').value = usuario;
    worksheet.getCell('D5').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C6').value = 'Fecha: ';
    worksheet.getCell('D6').value = hoyFormat;//moment(hoy).format("DD/MM/YYYY");

    worksheet.getCell('D6').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C5').font = FONT_COLUMN_BOLD;
    worksheet.getCell('C6').font = FONT_COLUMN_BOLD;

    worksheet.getCell('C8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('D8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('E8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('F8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('G8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('H8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('I8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('J8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('K8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('L8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('M8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('N8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('O8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('P8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('Q8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('R8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('S8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('T8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('U8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('V8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('W8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('X8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('Y8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('Z8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('AA8').alignment = ALIGMENT_JUNP_HEADER;

    worksheet.getCell('C8').value = 'ÍTEM';
    worksheet.getCell('D8').value = 'FECHA DE SOLICITUD'; //'Fecha de Creación de la Casilla';
    worksheet.getCell('E8').value = 'NÚMERO DE EXPEDIENTE';// 'Titular de la Casilla';
    worksheet.getCell('F8').value = 'CANAL DE PRESENTACIÓN'; //'Institución / Organización Política';
    worksheet.getCell('G8').value = 'TIPO DE DOCUMENTO'; //'Usuario';
    worksheet.getCell('H8').value = 'NÚMERO DE DOCUMENTO'; //Fecha Presentacion';
    worksheet.getCell('I8').value = 'NOMBRES'; //'Num Expediente';
    worksheet.getCell('J8').value = 'APELLIDO PATERNO'; //'Num Expediente';
    worksheet.getCell('K8').value = 'APELLIDO MATERNO'; //'Num Expediente';
    worksheet.getCell('L8').value = 'RAZÓN SOCIAL';
    worksheet.getCell('M8').value = 'DIRECCIÓN FÍSICA';
    worksheet.getCell('N8').value = 'DEPARTAMENTO';
    worksheet.getCell('O8').value = 'PROVINCIA';
    worksheet.getCell('P8').value = 'DISTRITO';
    worksheet.getCell('Q8').value = 'CORREO ELECTRÓNICO';
    worksheet.getCell('R8').value = 'TELÉFONO FIJO';
    worksheet.getCell('S8').value = 'CELULAR';
    worksheet.getCell('T8').value = 'CONTRASEÑA ACTUALIZADA';
    worksheet.getCell('U8').value = 'ESTADO';
    worksheet.getCell('V8').value = 'FECHA DE CREACIÓN / EVALUACIÓN';
    worksheet.getCell('W8').value = 'PENDIENTE A LA FECHA';
    worksheet.getCell('X8').value = 'USUARIO CREADOR';
    worksheet.getCell('Y8').value = 'MOTIVO OBSERVACIÓN';
    worksheet.getCell('Z8').value = 'FECHA Y HORA DE COMUNICACIÓN DE LA PN/PJ';
    worksheet.getCell('AA8').value = 'FECHA Y HORA DE COMUNICACIÓN AL PERSONERO LEGAL TITULAR/REPRESENTANTE LEGAL';

    let i = 1;
    let j = 9;
    let filter = {
        //con let cursos original // profile: appConstants.PROFILE_CITIZEN,
    }

    switch (documentType) {
        case 'todo':
            
            if (documentType !== 'todo' && documentType !== null && documentType !== undefined && documentType !== 'undefined') {
                filter.doc_type = documentType;
                filter.doc = documentNumber;
            }
            break;
        case 'dni': 
        case 'ce': 
        case 'ruc':
        case 'pr':
            if (documentNumber === null || documentNumber === 'null') {
                console.log('Aplicando filtro de documentType')
                filter.doc_type = documentType;
            } else {
                filter.doc_type = documentType;
                filter.doc = documentNumber;
            }
            break;
        default:
            break;
    }

    if (fechaInicio && fechaFin) {
        fechaFin = new Date(fechaFin + "T04:59:59.000Z");
        fechaFin.setDate(fechaFin.getDate() + 1)
        let rango = {$gte: new Date(fechaInicio + "T04:59:59.000Z"), $lte: fechaFin};

        filter = {
            ...filter, $or: [{$and: [{create_user: "owner"}, {$or: [{evaluated_at: rango}]}]}, //,  {update_date: rango}
                {$and: [{create_user: {$ne: "owner"}}, {created_at: rango}]}, {"status": "PENDIENTE"}]
        }        

    } else if (fechaInicio) {
        let rango = {$gte: new Date(fechaInicio + "T04:59:59.000Z")};

        filter = {
            ...filter, $or: [{$and: [{create_user: "owner"}, {$or: [{evaluated_at: rango}]}]}, //,  {update_date: rango}
                {$and: [{create_user: {$ne: "owner"}}, {created_at: rango}]}, {"status": "PENDIENTE"}]
        }

    } else if (fechaFin) {
        fechaFin = new Date(fechaFin);
        fechaFin.setDate(fechaFin.getDate() + 1)
        let rango = {$lte: new Date(fechaFin + "T04:59:59.000Z")};

        filter = {
            ...filter, $or: [{$and: [{create_user: "owner"}, {$or: [{evaluated_at: rango}]}]}, //,  {update_date: rango}
                {$and: [{create_user: {$ne: "owner"}}, {created_at: rango}]}, {"status": "PENDIENTE"}]
        }
    }

    const db = await mongodb.getDb();
    //let cursor = await db.collection(mongoCollections.USERS).find(filter).collation({ locale: "en", strength: 1 }).sort({ created_at: -1 });
    //ver2 let cursor = await db.collection(mongoCollections.INBOX).aggregate([{$match:filter}, {$lookup:{from:'users',localField:'doc',foreignField:'doc',as:'user'}}, {$sort:{created_at: -1}}],{$collation:{locale:"en", strength:1}});

    console.log('date init: ' + new Date());

    let cursor = await db.collection(mongoCollections.INBOX).aggregate([
        {$match: filter},
        {
                $addFields: {
                    ordenStatus: {
                        $cond: { if: { $eq: ["$status", "PENDIENTE"] }, then: 0, else: 1 }
                    }
                }
            },
            // {$sort: {ordenStatus: 1,create_user: -1, update_date: 1}},
            {$sort: {ordenStatus: 1, evaluated_at: -1, update_date: -1}},
            {
                $lookup: {
                    "from": "users",
                    "foreignField": "_id",
                    "localField": "user_id",
                    "as": "user"
                }
            },
            {
                $project: {
                    _id: 1,
                    created_at: 1,
                    nroExpediente: 1,
                    create_user: 1,
                    doc_type: 1,
                    doc: 1,
                    address: 1,
                    email: 1,
                    cellphone: 1,
                    phone: 1,
                    status: 1,
                    motivo: 1,
                    update_date: 1,
                    evaluator_user_names: 1,
                    dateFiling: 1,
                    email_sent_at: 1,
                    email_sent_status: 1,
                    sms_sent_at: 1,
                    sms_sent_status: 1,
                    email_sent_at_rep: 1,
                    email_sent_status_rep: 1,
                    sms_sent_at_rep: 1,
                    sms_sent_status_rep: 1,
                    'user.Ubigeo': 1,
                    'user.name': 1,
                    'user.lastname': 1,
                    'user.second_lastname': 1,
                    'user.updated_password': 1,
                    'user.organization_name': 1,
                }
            },
        ],
        {
            allowDiskUse: true
        });
    console.log('date fin: ' + new Date());
   
    
    let resultArray = await cursor.toArray();
    console.log('resultArray.length :', resultArray.length);

     if (resultArray.length < 1) {
        return { 
            status: 404, 
            message: 'No se encontraron registros para los parámetros solicitados',
            ok: false,
            length: 0
        };
    } 

    for await (const item of resultArray) {
       if (i===1) {
        
        console.log('item : ', item);

       }
        
        let motivos = "";
        if (item.motivo !== undefined) {
            if (item.motivo.motivo1 !== undefined && item.motivo.motivo1.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo1.detalle;
            }

            if (item.motivo.motivo2 !== undefined && item.motivo.motivo2.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo2.detalle;
            }

            if (item.motivo.motivo3 !== undefined && item.motivo.motivo3.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo3.detalle;
            }

            if (item.motivo.motivo4 !== undefined && item.motivo.motivo4.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo4.detalle;
            }

            if (item.motivo.motivo5 !== undefined && item.motivo.motivo5.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo5.detalle;
            }

            if (item.motivo.motivo6 !== undefined && item.motivo.motivo6.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo6.detalle;
            }

            if (item.motivo.motivo7 !== undefined && item.motivo.motivo7.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo7.detalle;
            }

            if (item.motivo.motivo8 !== undefined && item.motivo.motivo8.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo8.detalle;
            }

            if (item.motivo.motivo9 !== undefined && item.motivo.motivo9.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo9.detalle;
            }

            if (item.motivo.motivo10 !== undefined && item.motivo.motivo10.value) {
                motivos = motivos + `${motivos.length > 0 ? "\n" : ""}` + item.motivo.motivo10.detalle;
            }
        }

        let tmpDep = "", tmpPro = "", tmpDis = "";
        if (item.user.length > 0) {
            if (item.user[0].Ubigeo !== undefined && item.user[0].Ubigeo !== null) {
                const separado = item.user[0].Ubigeo.split("/");
                tmpDep = separado[0];
                tmpPro = separado[1];
                tmpDis = separado[2];
            }
        }
        let tmpFechaCreatedAt = "";
        if (item.create_user !== undefined && item.create_user === "owner") {
            tmpFechaCreatedAt = moment(item.created_at).format("YYYY-MM-DD HH:mm:ss");
        } else {
            tmpFechaCreatedAt = item.dateFiling !== undefined ? moment(item.dateFiling).format("YYYY-MM-DD") : "";
        }

        //DATA OF COMMUNICATION
        if (item._id.toString() === '65382fb33992c3eb919b2507') {
            console.log('chulls');
        }
        let communication = "";
        let communication_rep = "";
        item.email_sent_at = item.email_sent_at ? moment(item.email_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '';
        item.sms_sent_at = item.sms_sent_at ? moment(item.sms_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '';
        item.email_sent_at_rep = item.email_sent_at_rep ? moment(item.email_sent_at_rep).format("DD/MM/YYYY HH:mm:ss.SSS") : '';
        item.sms_sent_at_rep = item.sms_sent_at_rep ? moment(item.sms_sent_at_rep).format("DD/MM/YYYY HH:mm:ss.SSS") : '';

        if (item.email_sent_at) {
            communication = `EMAIL: ${item.email_sent_status ? item.email_sent_at : 'ERROR DE ENVÍO'}\n`;
        }

        if (item.sms_sent_at) {
            communication = communication + `CELULAR: ${item.sms_sent_status ? item.sms_sent_at : 'ERROR DE ENVÍO'}`;
        }

        if (item.doc_type === 'ruc' || item.doc_type === 'pr') {
            if (item.email_sent_at_rep) {
                communication_rep = `EMAIL: ${item.email_sent_status_rep ? item.email_sent_at_rep : 'ERROR DE ENVÍO'}\n`;
            } else if (communication) {
                communication_rep = `EMAIL: ${item.email_sent_status ? item.email_sent_at : 'ERROR DE ENVÍO'}\n`;
            }

            if (item.sms_sent_at_rep) {
                communication_rep = communication_rep + `CELULAR: ${item.sms_sent_status_rep ? item.sms_sent_at_rep : 'ERROR DE ENVÍO'}`;
            } else if (communication) {
                communication_rep = communication_rep + `CELULAR: ${item.sms_sent_status ? item.sms_sent_at : 'ERROR DE ENVÍO'}`;
            }

            if (communication && !communication_rep) {
                communication_rep = communication
            }
        }

        worksheet.getCell(`C${j}`).value = i;
        worksheet.getCell(`D${j}`).value = tmpFechaCreatedAt; //`${item.created_at != undefined ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;
        worksheet.getCell(`E${j}`).value = item.nroExpediente; //`${item.user[0].name} ${item.user[0].lastname} ${item.user[0].second_lastname != undefined ? item.user[0].second_lastname : ''}`;
        worksheet.getCell(`F${j}`).value = `${item.create_user === 'owner' ? 'SISEN' : 'MP'}`; //item.user[0].organization_name;
        //console.log('i : ', i);
        //console.log('item.doc_type : ', item.doc_type);
        worksheet.getCell(`G${j}`).value = item.doc_type.toUpperCase(); //item.doc;
        worksheet.getCell(`H${j}`).value = item.doc; //item.dateFiling;
        worksheet.getCell(`I${j}`).value = `${item.user.length > 0 ? item.user[0].name : ''}`; //item.nroExpediente;
        worksheet.getCell(`J${j}`).value = `${item.user.length > 0 ? item.user[0].lastname : ''}`; //item.nroExpediente;
        worksheet.getCell(`K${j}`).value = `${item.user.length > 0 && item.user[0].second_lastname !== undefined ? item.user[0].second_lastname : ''}`; //item.nroExpediente;
        worksheet.getCell(`L${j}`).value = `${item.user[0].organization_name !== undefined ? item.user[0].organization_name !== '' ? item.user[0].organization_name : '' : ''}`;
        worksheet.getCell(`M${j}`).value = item.address;
        worksheet.getCell(`N${j}`).value = tmpDep.includes('undefined') ? '' : tmpDep;//DEPARTAMENTO
        worksheet.getCell(`O${j}`).value = tmpPro.includes('undefined') ? '' : tmpPro;//PROVINCIA
        worksheet.getCell(`P${j}`).value = tmpDis.includes('undefined') ? '' : tmpDis;//DISTRITO
        worksheet.getCell(`Q${j}`).value = item.email;
        worksheet.getCell(`R${j}`).value = `${item.phone !== "undefined" ? item.phone !== null ? item.phone !== 'null' ? item.phone : '' : '' : ''}`;//TELEFONO FIJO
        worksheet.getCell(`S${j}`).value = item.cellphone;
        worksheet.getCell(`T${j}`).value = `${item.user.length > 0 ? item.user[0].updated_password === true ? "VERDADERO" : "FALSO" : ''}`;
        worksheet.getCell(`U${j}`).value = `${item.status !== undefined ? item.status : "REGISTRO INTERNO"}`;
        worksheet.getCell(`V${j}`).value = `${item.create_user !== 'owner' ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : (item.evaluated_at !== undefined ? moment(item.evaluated_at).format("YYYY-MM-DD HH:mm:ss") : (item.status === "PENDIENTE" ? "" : moment(item.update_date).format("YYYY-MM-DD HH:mm:ss")))}`;
        worksheet.getCell(`W${j}`).value = `${item.status !== undefined ? item.status === "PENDIENTE" ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : "" : ''}`; //hoyFormat
        worksheet.getCell(`X${j}`).value = `${item.create_user !== 'owner' && item.create_user ? item.create_user : (item.evaluator_user_names !== undefined ? item.evaluator_user_names : '')}`; //`${item.user_register.length > 0 ? item.user_register[0].name+" "+item.user_register[0].lastname+" "+item.user_register[0].second_lastname : ''}` ;
        worksheet.getCell(`Y${j}`).value = motivos; //item.motivo;
        worksheet.getCell(`Z${j}`).value = communication;
        worksheet.getCell(`AA${j}`).value = communication_rep;

        worksheet.getCell(`C${j}`).border = BORDER_THIN;
        worksheet.getCell(`D${j}`).border = BORDER_THIN;
        worksheet.getCell(`E${j}`).border = BORDER_THIN;
        worksheet.getCell(`F${j}`).border = BORDER_THIN;
        worksheet.getCell(`G${j}`).border = BORDER_THIN;
        worksheet.getCell(`H${j}`).border = BORDER_THIN;
        worksheet.getCell(`I${j}`).border = BORDER_THIN;
        worksheet.getCell(`J${j}`).border = BORDER_THIN;
        worksheet.getCell(`K${j}`).border = BORDER_THIN;
        worksheet.getCell(`L${j}`).border = BORDER_THIN;
        worksheet.getCell(`M${j}`).border = BORDER_THIN;
        worksheet.getCell(`N${j}`).border = BORDER_THIN;
        worksheet.getCell(`O${j}`).border = BORDER_THIN;
        worksheet.getCell(`P${j}`).border = BORDER_THIN;
        worksheet.getCell(`Q${j}`).border = BORDER_THIN;
        worksheet.getCell(`R${j}`).border = BORDER_THIN;
        worksheet.getCell(`S${j}`).border = BORDER_THIN;
        worksheet.getCell(`T${j}`).border = BORDER_THIN;
        worksheet.getCell(`U${j}`).border = BORDER_THIN;
        worksheet.getCell(`V${j}`).border = BORDER_THIN;
        worksheet.getCell(`W${j}`).border = BORDER_THIN;
        worksheet.getCell(`X${j}`).border = BORDER_THIN;
        worksheet.getCell(`Y${j}`).border = BORDER_THIN;
        worksheet.getCell(`Z${j}`).border = BORDER_THIN;
        worksheet.getCell(`AA${j}`).border = BORDER_THIN;

        worksheet.getCell(`C${j}`).font = FONT_ROWS;
        worksheet.getCell(`D${j}`).font = FONT_ROWS;
        worksheet.getCell(`E${j}`).font = FONT_ROWS;
        worksheet.getCell(`F${j}`).font = FONT_ROWS;
        worksheet.getCell(`G${j}`).font = FONT_ROWS;
        worksheet.getCell(`H${j}`).font = FONT_ROWS;
        worksheet.getCell(`I${j}`).font = FONT_ROWS;
        worksheet.getCell(`J${j}`).font = FONT_ROWS;
        worksheet.getCell(`K${j}`).font = FONT_ROWS;
        worksheet.getCell(`L${j}`).font = FONT_ROWS;
        worksheet.getCell(`M${j}`).font = FONT_ROWS;
        worksheet.getCell(`N${j}`).font = FONT_ROWS;
        worksheet.getCell(`O${j}`).font = FONT_ROWS;
        worksheet.getCell(`P${j}`).font = FONT_ROWS;
        worksheet.getCell(`Q${j}`).font = FONT_ROWS;
        worksheet.getCell(`R${j}`).font = FONT_ROWS;
        worksheet.getCell(`S${j}`).font = FONT_ROWS;
        worksheet.getCell(`T${j}`).font = FONT_ROWS;
        worksheet.getCell(`U${j}`).font = FONT_ROWS;
        worksheet.getCell(`V${j}`).font = FONT_ROWS;
        worksheet.getCell(`W${j}`).font = FONT_ROWS;
        worksheet.getCell(`X${j}`).font = FONT_ROWS;
        worksheet.getCell(`Y${j}`).font = FONT_ROWS;
        worksheet.getCell(`Z${j}`).font = FONT_ROWS;
        worksheet.getCell(`AA${j}`).font = FONT_ROWS;

        worksheet.getCell(`C${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`D${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`E${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`F${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`G${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`H${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`I${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`J${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`K${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`L${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`M${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`N${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`O${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`P${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`Q${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`R${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`S${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`T${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`U${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`V${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`W${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`X${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`Y${j}`).alignment = ALIGMENT_JUNP_CELL;
        worksheet.getCell(`Z${j}`).alignment = ALIGMENT_JUNP_CELL;
        worksheet.getCell(`AA${j}`).alignment = ALIGMENT_JUNP_CELL;

        j++;
        i++;       
    }

    return await workbook.xlsx.writeBuffer();
}
const reporteNotificaciones = async (usuario, fechaInicio, fechaFin, documentType, documentNumber) => {
    let today = utils.getDate();

    const workbook = new ExcelJS.Workbook();
    workbook.lastModifiedBy = 'ONPE';
    workbook.created = today;
    workbook.modified = today;
    workbook.lastPrinted = today;
    const worksheet = workbook.addWorksheet('Hoja1');

    worksheet.mergeCells('C1:Q3');
    worksheet.getCell('C1').value = 'Reporte de Notificaciones';
    worksheet.getCell('C1').font = FONT_SHEET_HEADER;
    worksheet.getCell('C1').alignment = ALIGMENT_CENTER;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 22;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 30;
    worksheet.getColumn(8).width = 70;
    worksheet.getColumn(9).width = 40;
    worksheet.getColumn(10).width = 25;
    worksheet.getColumn(11).width = 70;
    worksheet.getColumn(12).width = 70;
    worksheet.getColumn(13).width = 22;
    worksheet.getColumn(14).width = 22;
    worksheet.getColumn(15).width = 15;
    worksheet.getColumn(16).width = 22;
    worksheet.getColumn(17).width = 22;
    worksheet.getColumn(18).width = 50;
    worksheet.getColumn(19).width = 40;
    worksheet.getColumn(20).width = 40;
    worksheet.getColumn(21).width = 40;


    const HEADER = ['C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8', 'N8', 'O8', 'P8', 'Q8', 'R8', 'S8','T8'];
    for (let item of HEADER) {
        worksheet.getCell(item).fill = FILL_HEADER;
        worksheet.getCell(item).font = FONT_COLUMN_HEADER;
        worksheet.getCell(item).alignment = ALIGMENT_CENTER;
        worksheet.getCell(item).border = BORDER_THIN;
    }
    const logo = workbook.addImage({
        base64: recursos.LOGO_BASE64,
        extension: 'png',
    });
    worksheet.addImage(logo, 'A1:B3');
    worksheet.getCell('C5').value = 'Usuario: ';
    worksheet.getCell('D5').value = usuario;
    worksheet.getCell('D5').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C6').value = 'Fecha: ';
    worksheet.getCell('D6').value = moment(today).add(5, 'hours').format("YYYY-MM-DD HH:mm:ss");
    worksheet.getCell('D6').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C5').font = FONT_COLUMN_BOLD;
    worksheet.getCell('C6').font = FONT_COLUMN_BOLD;

    worksheet.getCell('C8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('D8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('E8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('F8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('G8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('H8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('I8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('J8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('K8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('L8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('M8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('N8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('O8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('P8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('Q8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('R8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('S8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('T8').alignment = ALIGMENT_JUNP_TEXT;


    worksheet.getCell('C8').value = 'ÍTEM';
    worksheet.getCell('D8').value = 'ID DE NOTIFICACIÓN';
    worksheet.getCell('E8').value = 'FECHA DE CREACIÓN DE LA NOTIFICACIÓN'; // 'FECHA DE CARGA AL SISEN'; //Nombre del Notificador';
    worksheet.getCell('F8').value = 'TIPO DE DOCUMENTO';//'DOCUMENTO N° (CON TODA SU NOMENCLATURA)'; //'Fecha de Notificación';
    worksheet.getCell('G8').value = 'NÚMERO DE DOCUMENTO'; //'NOMBRES Y APELLIDOS'; //'UU.OO Emisora';
    worksheet.getCell('H8').value = 'NOMBRES Y APELLIDOS'; // 'ASUNTO'; //'Documento';
    worksheet.getCell('I8').value = 'RAZÓN SOCIAL'; //'FECHA DE DEPÓSITO EN CASILLA ELECTRÓNICA (NOTIFICACIÓN)'; // 'Destinatario';
    worksheet.getCell('J8').value = 'NÚMERO DE EXPEDIENTE'; //'FECHA DE DEPÓSITO EN CASILLA ELECTRÓNICA (NOTIFICACIÓN)'; // 'Destinatario';
    worksheet.getCell('K8').value = 'NOMENCLATURA DEL DOCUMENTO';
    worksheet.getCell('L8').value = 'ASUNTO'; //'FECHA DE RECEPCIÓN';
    worksheet.getCell('M8').value = 'FECHA DE ENVÍO DE LA NOTIFICACIÓN';// 'ESTADO (LEÍDO / NO LEÍDO)';// 'Institución / Organización Política';
    worksheet.getCell('N8').value = 'FECHA DE DEPÓSITO';// 'FECHA DE LECTURA'; //'Fecha de lectura';
    worksheet.getCell('O8').value = 'ESTADO DE LA NOTIFICACIÓN';// 'PROCESO';
    worksheet.getCell('P8').value = 'FECHA DE LECTURA DE LA NOTIFICACIÓN'; // 'RESPONSABLE DE LA NOTIFICACIÓN';
    worksheet.getCell('Q8').value = 'PROCEDIMIENTO/PROCESO';// 'RESPONSABLE DE LA NOTIFICACIÓN';
    worksheet.getCell('R8').value = 'PERSONAL NOTIFICADOR';
    worksheet.getCell('S8').value = 'FECHA Y HORA DE COMUNICACIÓN DE LA PN/PJ';
    worksheet.getCell('T8').value = 'FECHA Y HORA DE COMUNICACIÓN AL PERSONERO LEGAL TITULAR/REPRESENTANTE LEGAL';

    let i = 1;
    let j = 9;
    let filter = {} 

    switch (documentType) {
        case 'todo':
            if (documentType !== 'todo' && documentType !== null && documentType !== undefined && documentType !== 'undefined') {
                    filter.inbox_doc_type = documentType;
                filter.inbox_doc = documentNumber;
            }
            break;
        case 'dni': 
        case 'ce': 
        case 'ruc':
        case 'pr':
            if (documentNumber === null || documentNumber === 'null') {
                console.log('Aplicando filtro de documentType')
                filter.inbox_doc_type = documentType;
            } else {
                filter.inbox_doc_type = documentType;
                filter.inbox_doc = documentNumber;
            }
            break;
        default:
            break;
    }

    //console.log('fechaInicio :', fechaInicio);
    //console.log('fechaFin :', fechaFin);
    if (fechaInicio && fechaFin) {
        fechaFin = new Date(fechaFin + "T04:59:59.000Z");
        fechaFin.setDate(fechaFin.getDate() + 1)
        filter = {...filter, received_at: {$gte: new Date(fechaInicio + "T04:59:59.000Z"), $lte: new Date(fechaFin)}, }

    } else if (fechaInicio) {
        filter = {...filter, received_at: {$gte: new Date(fechaInicio + "T04:59:59.000Z")}}
       
    } else if (fechaFin) {
        fechaFin = new Date(fechaFin);
        fechaFin.setDate(fechaFin.getDate() + 1)
        filter = {...filter, received_at: {$lte: new Date(fechaFin + "T04:59:59.000Z")}}

    }
    //console.log('filter:', filter);
    const db = await mongodb.getDb();
    //let cursor = await db.collection(mongoCollections.NOTIFICATIONS).find(filter).collation({ locale: "en", strength: 1 }).sort({ received_at: -1 });
    /*let cursor = await db.collection(mongoCollections.NOTIFICATIONS)
        .find(filter, {_id: 0,
            created_at: 1,
            expedient: 1,
            inbox_doc:1,
            inbox_doc_type:1,
            inbox_name: 1,
            message: 1,
            sent_at: 1,
            received_at: 1,
            read_at: 1,
            procedure:1,
            'acuse_data.notifier_name': 1
        })
        .sort({ received_at: -1 });*/

    console.log('date init: '+ new Date());
    let cursor = await db.collection(mongoCollections.NOTIFICATIONS).aggregate([
            {$match: filter},
            {$sort: {received_at: -1}},
            {
                $project: {
                    _id: 1,
                    created_at: 1,
                    expedient: 1,
                    n_expedient: 1,
                    inbox_doc: 1,
                    inbox_doc_type: 1,
                    inbox_name: 1,
                    organization_name: 1,
                    message: 1,
                    sent_at: 1,
                    received_at: 1,
                    read_at: 1,
                    procedure: 1,
                    email_sent_at: 1,
                    email_sent_status: 1,
                    sms_sent_at: 1,
                    sms_sent_status: 1,
                    email_sent_at_rep: 1,
                    email_sent_status_rep: 1,
                    sms_sent_at_rep: 1,
                    sms_sent_status_rep: 1,
                    'acuse_data.notifier_name': 1
                }
            },
        ],
        {
            allowDiskUse: true
        });
        
        
      
    daysHoliday = await getDayHoliday();
    console.log(daysHoliday)
    
    //console.log('cursor: ', cursor);
   // console.log('cursor._readableState: ', cursor._readableState);
   // console.log('cursor._readableState.length: ', cursor._readableState.length);
    //console.log('cursor.length: ', cursor.length);
    //let resultCount = await cursor.itcount();
    let resultArray = await cursor.toArray();
    //console.log('resultArray.length : ',  resultArray.length );
    //console.log('cursor typeof : ',  typeof cursor );
     if (resultArray.length < 1) {
        return { 
            status: 404, 
            message: 'No se encontraron registros para los parámetros solicitados',
            ok: false,
            length: 0
        };
    } 
    //let resultCount = await cursor.count(); 
    //console.log('Cantidad de registros:', resultCount);
    
    for await (const item of resultArray) {
        //DATA OF COMMUNICATION
        let communication = "";
        let communication_rep = "";
        item.email_sent_at = item.email_sent_at ? moment(item.email_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '';
        item.sms_sent_at = item.sms_sent_at ? moment(item.sms_sent_at).format("DD/MM/YYYY HH:mm:ss.SSS") : '';
        item.email_sent_at_rep = item.email_sent_at_rep ? moment(item.email_sent_at_rep).format("DD/MM/YYYY HH:mm:ss.SSS") : '';
        item.sms_sent_at_rep = item.sms_sent_at_rep ? moment(item.sms_sent_at_rep).format("DD/MM/YYYY HH:mm:ss.SSS") : '';

        if (item.email_sent_at) {
            communication = `EMAIL: ${item.email_sent_status ? item.email_sent_at : 'ERROR DE ENVÍO'}\n`;
        }

        if (item.sms_sent_at) {
            communication = communication + `CELULAR: ${item.sms_sent_status ? item.sms_sent_at : 'ERROR DE ENVÍO'}`;
        }

        if (item.inbox_doc_type === 'ruc' || item.inbox_doc_type === 'pr') {
            if (item.email_sent_at_rep) {
                communication_rep = `EMAIL: ${item.email_sent_status_rep ? item.email_sent_at_rep : 'ERROR DE ENVÍO'}\n`;
            } else if (communication) {
                communication_rep = `EMAIL: ${item.email_sent_status ? item.email_sent_at : 'ERROR DE ENVÍO'}\n`;
            }

            if (item.sms_sent_at_rep) {
                communication_rep = communication_rep + `CELULAR: ${item.sms_sent_status_rep ? item.sms_sent_at_rep : 'ERROR DE ENVÍO'}`;
            } else if (communication) {
                communication_rep = communication_rep + `CELULAR: ${item.sms_sent_status ? item.sms_sent_at : 'ERROR DE ENVÍO'}`;
            }

            if (communication && !communication_rep) {
                communication_rep = communication
            }
        }

        worksheet.getCell(`C${j}`).value = i;
        worksheet.getCell(`D${j}`).value = item._id.toString();
        worksheet.getCell(`E${j}`).value = `${item.created_at !== undefined ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;
        worksheet.getCell(`F${j}`).value = item.inbox_doc_type.toUpperCase(); //item.inbox_name; //item.uuooName;
        worksheet.getCell(`G${j}`).value = item.inbox_doc;//item.message; //item.inbox_doc;
        worksheet.getCell(`H${j}`).value = (item.inbox_doc_type !== 'ruc' || item.inbox_doc_type !== 'pr') ? item.inbox_name : '';//`${item.sent_at != undefined ? moment(item.sent_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;
        worksheet.getCell(`I${j}`).value = (item.inbox_doc_type === 'ruc' || item.inbox_doc_type === 'pr') ? item.organization_name : '';
        worksheet.getCell(`J${j}`).value = item.n_expedient; //item.received_at;
        worksheet.getCell(`K${j}`).value = item.expedient;
        worksheet.getCell(`L${j}`).value = item.message; //`${item.received_at != undefined ? moment(item.received_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;
        worksheet.getCell(`M${j}`).value = `${item.sent_at !== undefined ? moment(item.sent_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;//`${item.read_at != undefined ? "LEÍDO" : "NO LEÍDO"}`; //item.organization_name;
        worksheet.getCell(`N${j}`).value = `${item.received_at !== undefined ? moment(item.received_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;//`${item.read_at != undefined ? moment(item.read_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;
        // worksheet.getCell(`M${j}`).value = `${item.read_at !== undefined ? "LEÍDO" : "NO LEÍDO"}`; //item.organization_name;//"Proceso Electoral";
        worksheet.getCell(`O${j}`).value = await validateStatus(item.received_at, item.read_at); //
        worksheet.getCell(`P${j}`).value = `${item.read_at !== undefined ? moment(item.read_at).format("YYYY-MM-DD HH:mm:ss") : ""}`;//`${item.acuse_data != undefined ? item.acuse_data.notifier_name : ''}`;
        worksheet.getCell(`Q${j}`).value = item.procedure;
        worksheet.getCell(`R${j}`).value = `${item.acuse_data !== undefined ? item.acuse_data.notifier_name : ''}`;
        worksheet.getCell(`S${j}`).value = communication;
        worksheet.getCell(`T${j}`).value = communication_rep;

        worksheet.getCell(`C${j}`).border = BORDER_THIN;
        worksheet.getCell(`D${j}`).border = BORDER_THIN;
        worksheet.getCell(`E${j}`).border = BORDER_THIN;
        worksheet.getCell(`F${j}`).border = BORDER_THIN;
        worksheet.getCell(`G${j}`).border = BORDER_THIN;
        worksheet.getCell(`H${j}`).border = BORDER_THIN;
        worksheet.getCell(`I${j}`).border = BORDER_THIN;
        worksheet.getCell(`J${j}`).border = BORDER_THIN;
        worksheet.getCell(`K${j}`).border = BORDER_THIN;
        worksheet.getCell(`L${j}`).border = BORDER_THIN;
        worksheet.getCell(`M${j}`).border = BORDER_THIN;
        worksheet.getCell(`N${j}`).border = BORDER_THIN;
        worksheet.getCell(`O${j}`).border = BORDER_THIN;
        worksheet.getCell(`P${j}`).border = BORDER_THIN;
        worksheet.getCell(`Q${j}`).border = BORDER_THIN;
        worksheet.getCell(`R${j}`).border = BORDER_THIN;
        worksheet.getCell(`S${j}`).border = BORDER_THIN;
        worksheet.getCell(`T${j}`).border = BORDER_THIN;

        worksheet.getCell(`C${j}`).font = FONT_ROWS;
        worksheet.getCell(`D${j}`).font = FONT_ROWS;
        worksheet.getCell(`E${j}`).font = FONT_ROWS;
        worksheet.getCell(`F${j}`).font = FONT_ROWS;
        worksheet.getCell(`G${j}`).font = FONT_ROWS;
        worksheet.getCell(`H${j}`).font = FONT_ROWS;
        worksheet.getCell(`I${j}`).font = FONT_ROWS;
        worksheet.getCell(`J${j}`).font = FONT_ROWS;
        worksheet.getCell(`K${j}`).font = FONT_ROWS;
        worksheet.getCell(`L${j}`).font = FONT_ROWS;
        worksheet.getCell(`M${j}`).font = FONT_ROWS;
        worksheet.getCell(`N${j}`).font = FONT_ROWS;
        worksheet.getCell(`O${j}`).font = FONT_ROWS;
        worksheet.getCell(`P${j}`).font = FONT_ROWS;
        worksheet.getCell(`Q${j}`).font = FONT_ROWS;
        worksheet.getCell(`R${j}`).font = FONT_ROWS;
        worksheet.getCell(`S${j}`).font = FONT_ROWS;
        worksheet.getCell(`T${j}`).font = FONT_ROWS;

        worksheet.getCell(`R${j}`).alignment = ALIGMENT_JUNP_CELL;
        worksheet.getCell(`S${j}`).alignment = ALIGMENT_JUNP_CELL;
        worksheet.getCell(`T${j}`).alignment = ALIGMENT_JUNP_CELL;

        j++;
        i++;

       
    }

    return await workbook.xlsx.writeBuffer();
}

const reporteUsuarios = async (usuario, fechaInicio, fechaFin, documentType, documentNumber) => {
    let today = utils.getDate();

    const workbook = new ExcelJS.Workbook();
    workbook.lastModifiedBy = 'ONPE';
    workbook.created = today;
    workbook.modified = today;
    workbook.lastPrinted = today;
    const worksheet = workbook.addWorksheet('Hoja1');

    worksheet.mergeCells('C1:Q3');
    worksheet.getCell('C1').value = 'Reporte de Usuarios';
    worksheet.getCell('C1').font = FONT_SHEET_HEADER;
    worksheet.getCell('C1').alignment = ALIGMENT_CENTER;

    const columnWidths = [10, 15, 22, 25, 35, 35, 40, 27, 25, 25, 25, 45, 45, 22, 45, 25, 40, 40, 40];
    columnWidths.forEach((width, index) => worksheet.getColumn(index + 3).width = width);

    const HEADER = ['C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8', 'N8', 'O8', 'P8', 'Q8', 'R8', 'S8'];
    for (let item of HEADER) {
        worksheet.getCell(item).fill = FILL_HEADER;
        worksheet.getCell(item).font = FONT_COLUMN_HEADER;
        worksheet.getCell(item).alignment = ALIGMENT_CENTER;
        worksheet.getCell(item).border = BORDER_THIN;
    }

    const logo = workbook.addImage({
        base64: recursos.LOGO_BASE64,
        extension: 'png',
    });
    worksheet.addImage(logo, 'A1:B3');
    worksheet.getCell('C5').value = 'Usuario: ';
    worksheet.getCell('D5').value = usuario;
    worksheet.getCell('D5').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C6').value = 'Fecha: ';
    worksheet.getCell('D6').value = moment(today).add(5, 'hours').format("YYYY-MM-DD HH:mm:ss");
    worksheet.getCell('D6').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C5').font = FONT_COLUMN_BOLD;
    worksheet.getCell('C6').font = FONT_COLUMN_BOLD;

    const alignments = ['C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8', 'N8', 'O8', 'P8', 'Q8', 'R8', 'S8', 'T8'];
    alignments.forEach(cell => worksheet.getCell(cell).alignment = ALIGMENT_JUNP_TEXT);

    const headers = [
        'ÍTEM', 'TIPO DE DOCUMENTO', 'NÚMERO DE DOCUMENTO', 'USUARIO LDAP', 'APELLIDOS', 'NOMBRES', 'CORREO ELECTRÓNICO', 'PERFIL',
        'FECHA INICIO DE VIGENCIA', 'FECHA FIN DE VIGENCIA', 'FECHA DE CREACIÓN / ACTUALIZACIÓN', 'USUARIO CREADOR / ACTUALIZADOR', 'ÁREA DE TRABAJO',
        'ESTADO', 'USUARIO QUE DESHABILITO', 'FECHA DESHABILITACIÓN', 'MOTIVO'];
    headers.forEach((header, index) => worksheet.getCell(`${String.fromCharCode(67 + index)}8`).value = header);

    let i = 1;
    let j = 9;
    let filter = {
        profiles : {$exists: true},
        disabled_list: {$ne: true}
    };

    switch (documentType) {
        case 'todo':
            if (documentType !== 'todo' && documentType !== null && documentType !== undefined && documentType !== 'undefined') {
                filter.doc_type = documentType;
                filter.doc = documentNumber;
            }
            break;
        case 'dni':
        case 'ce':
        case 'ruc':
        case 'pr':
            if (documentNumber === null || documentNumber === 'null') {
                filter.doc_type = documentType;
            } else {
                filter.doc_type = documentType;
                filter.doc = documentNumber;
            }
            break;
        default:
            break;
    }

    if (fechaInicio && fechaFin) {
        fechaFin = new Date(fechaFin + "T04:59:59.000Z");
        fechaFin.setDate(fechaFin.getDate() + 1);
        filter = { ...filter, created_at: { $gte: new Date(fechaInicio + "T04:59:59.000Z"), $lte: new Date(fechaFin) } };
    } else if (fechaInicio) {
        filter = { ...filter, created_at: { $gte: new Date(fechaInicio + "T04:59:59.000Z") } };
    } else if (fechaFin) {
        fechaFin = new Date(fechaFin);
        fechaFin.setDate(fechaFin.getDate() + 1);
        filter = { ...filter, created_at: { $lte: new Date(fechaFin + "T04:59:59.000Z") } };
    }

    const db = await mongodb.getDb();
    console.log('date init: ' + new Date());
    let cursor = await db.collection(mongoCollections.USERS).aggregate([
        { $match: filter },
        { $sort: { created_at: -1 } },
        {
            $project: {
                doc_type: 1,
                doc: 1,
                LDAP: 1,
                lastname: 1,
                second_lastname: 1,
                name: 1,
                email: 1,
                profiles: {
                    $objectToArray: "$profiles"
                },
                created_at: 1,
                create_user: 1,
                job_area_name: 1,
                status: {
                    $ifNull: ["$status", "habilitado"]
                },
                disabling_user: {
                    $cond: { if: { $eq: ["$status", "DESHABILITADO"] }, then: "$disabling_user", else: null }
                },
                disabled_at: {
                    $cond: { if: { $eq: ["$status", "DESHABILITADO"] }, then: "$disabled_at", else: null }
                },
                disabled_reason: {
                    $cond: { if: { $eq: ["$status", "DESHABILITADO"] }, then: "$disabled_reason", else: null }
                }
            }
        },
        {
            $addFields: {
                profiles: {
                    $filter: {
                        input: "$profiles",
                        as: "profile",
                        cond: { $eq: ["$$profile.v.estado", true] }
                    }
                }
            }
        }
    ], {
        allowDiskUse: true
    });

    let resultArray = await cursor.toArray();

    if (resultArray.length < 1) {
        return {
            status: 404,
            message: 'No se encontraron registros para los parámetros solicitados',
            ok: false,
            length: 0
        };
    }

    const profileNames = {
        admin: 'ADMINISTRADOR',
        notifier: 'NOTIFICADOR',
        register: 'OPERADOR DE REGISTRO',
        consult: 'OPERADOR DE CONSULTA'
    };

    for await (const item of resultArray) {
        let profiles = item.profiles ?? [];
        for (const profile of profiles) {
            worksheet.getCell(`C${j}`).value = i;
            worksheet.getCell(`D${j}`).value = item.doc_type.toUpperCase();
            worksheet.getCell(`E${j}`).value = item.doc;
            worksheet.getCell(`F${j}`).value = item.LDAP;
            worksheet.getCell(`G${j}`).value = item.lastname.toUpperCase() + (item.second_lastname? ' ' +item.second_lastname.toUpperCase() : '' ) ; // Convertir apellidos a mayúsculas
            worksheet.getCell(`H${j}`).value = item.name.toUpperCase();
            worksheet.getCell(`I${j}`).value = item.email;
            worksheet.getCell(`J${j}`).value = profileNames[profile.k] || profile.k; // Cambiar nombre del perfil
            worksheet.getCell(`K${j}`).value = profile.v.fechaIni ? moment(profile.v.fechaIni).format("YYYY-MM-DD") : '';
            worksheet.getCell(`L${j}`).value = profile.v.fechaFin === 'Indeterminado' ? profile.v.fechaFin : moment(profile.v.fechaFin).format("YYYY-MM-DD");
            worksheet.getCell(`M${j}`).value = profile.v.updated_at ? moment(profile.v.updated_at).format("YYYY-MM-DD HH:mm:ss") : '';
            worksheet.getCell(`N${j}`).value = profile.v.updated_user ? profile.v.updated_user : '';
            worksheet.getCell(`O${j}`).value = item.job_area_name;

            // Determinar el estado
            let estado = item.status.toUpperCase();
            if (estado !== 'DESHABILITADO' && profile.v.estado) {
                const fechaIni = new Date(profile.v.fechaIni);
                const fechaFin = new Date(profile.v.fechaFin);
                if (fechaIni > today || fechaFin < today) {
                    estado = 'FUERA DE VIGENCIA';
                }
            }
            worksheet.getCell(`P${j}`).value = estado;

            // Mostrar información de deshabilitación si el estado es "DESHABILITADO"
            if (estado === 'DESHABILITADO') {
                worksheet.getCell(`Q${j}`).value = item.disabling_user;
                worksheet.getCell(`R${j}`).value = item.disabled_at ? moment(item.disabled_at).format("YYYY-MM-DD HH:mm:ss") : '';
                worksheet.getCell(`S${j}`).value = item.disabled_reason;
            } else {
                worksheet.getCell(`Q${j}`).value = '';
                worksheet.getCell(`R${j}`).value = '';
                worksheet.getCell(`S${j}`).value = '';
            }

            const cells = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
            cells.forEach(cell => {
                worksheet.getCell(`${cell}${j}`).border = BORDER_THIN;
                worksheet.getCell(`${cell}${j}`).font = FONT_ROWS;
            });

            worksheet.getCell(`R${j}`).alignment = ALIGMENT_JUNP_CELL;
            worksheet.getCell(`S${j}`).alignment = ALIGMENT_JUNP_CELL;
            worksheet.getCell(`T${j}`).alignment = ALIGMENT_JUNP_CELL;

            j++;
            i++;
        }
    }

    return await workbook.xlsx.writeBuffer();
}
const reporteUsuariosHistorico = async (usuario, fechaInicio, fechaFin, documentType, documentNumber) => {
    let today = utils.getDate();

    const workbook = new ExcelJS.Workbook();
    workbook.lastModifiedBy = 'ONPE';
    workbook.created = today;
    workbook.modified = today;
    workbook.lastPrinted = today;
    const worksheet = workbook.addWorksheet('Hoja1');

    worksheet.mergeCells('C1:L3');
    worksheet.getCell('C1').value = 'Reporte de Usuarios Histórico';
    worksheet.getCell('C1').font = FONT_SHEET_HEADER;
    worksheet.getCell('C1').alignment = ALIGMENT_CENTER;

    const columnWidths = [10, 15, 22, 15, 30, 50, 40, 25, 30, 30, 28, 40, 40, 22, 22, 50, 40, 40, 40];
    columnWidths.forEach((width, index) => worksheet.getColumn(index + 3).width = width);

    const HEADER = ['C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8'];
    for (let item of HEADER) {
        worksheet.getCell(item).fill = FILL_HEADER;
        worksheet.getCell(item).font = FONT_COLUMN_HEADER;
        worksheet.getCell(item).alignment = ALIGMENT_CENTER;
        worksheet.getCell(item).border = BORDER_THIN;
    }

    const logo = workbook.addImage({
        base64: recursos.LOGO_BASE64,
        extension: 'png',
    });
    worksheet.addImage(logo, 'A1:B3');
    worksheet.getCell('C5').value = 'Usuario: ';
    worksheet.getCell('D5').value = usuario;
    worksheet.getCell('D5').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C6').value = 'Fecha: ';
    worksheet.getCell('D6').value = moment(today).add(5, 'hours').format("YYYY-MM-DD HH:mm:ss");
    worksheet.getCell('D6').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C5').font = FONT_COLUMN_BOLD;
    worksheet.getCell('C6').font = FONT_COLUMN_BOLD;

    const alignments = ['C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8'];
    alignments.forEach(cell => worksheet.getCell(cell).alignment = ALIGMENT_JUNP_TEXT);

    const headers = [
        'ÍTEM', 'TIPO DE DOCUMENTO', 'NÚMERO DE DOCUMENTO', 'USUARIO LDAP', 'APELLIDOS', 'NOMBRES', 'PERFIL',
        'FECHA', 'DESCRIPCIÓN', 'DATOS REGISTRADOS', 'USUARIO EDITOR'];
    headers.forEach((header, index) => worksheet.getCell(`${String.fromCharCode(67 + index)}8`).value = header);

    let i = 1;
    let j = 9;
    let filter = { profiles: {$exists: true}, LDAP: {$exists: true}, doc_type: {$in: ['dni', 'ce']}};

    switch (documentType) {
        case 'todo':
            if (documentType !== 'todo' && documentType !== null && documentType !== undefined && documentType !== 'undefined') {
                filter.doc_type = documentType;
                filter.doc = documentNumber;
            }
            break;
        case 'dni':
        case 'ce':
        case 'ruc':
        case 'pr':
            if (documentNumber === null || documentNumber === 'null') {
                filter.doc_type = documentType;
            } else {
                filter.doc_type = documentType;
                filter.doc = documentNumber;
            }
            break;
        default:
            break;
    }

    if (fechaInicio && fechaFin) {
        fechaFin = new Date(fechaFin + "T04:59:59.000Z");
        fechaFin.setDate(fechaFin.getDate() + 1);
        filter = { ...filter, created_at: { $gte: new Date(fechaInicio + "T04:59:59.000Z"), $lte: new Date(fechaFin) } };
    } else if (fechaInicio) {
        filter = { ...filter, created_at: { $gte: new Date(fechaInicio + "T04:59:59.000Z") } };
    } else if (fechaFin) {
        fechaFin = new Date(fechaFin);
        fechaFin.setDate(fechaFin.getDate() + 1);
        filter = { ...filter, created_at: { $lte: new Date(fechaFin + "T04:59:59.000Z") } };
    }

    const db = await mongodb.getDb();
    console.log('date init: ' + new Date());
    let cursor = await db.collection(mongoCollections.USERS).aggregate([
        { $match: filter },
        { $sort: { created_at: -1 } },
        {
            $project: {
                doc_type: 1,
                doc: 1,
                LDAP: 1,
                lastname: 1,
                second_lastname: 1, // Añadir second_lastname al proyecto
                name: 1,
                profiles: {
                    $objectToArray: "$profiles"
                },
                created_at: 1
            }
        }
    ], {
        allowDiskUse: true
    });

    let resultArray = await cursor.toArray();

    if (resultArray.length < 1) {
        return {
            status: 404,
            message: 'No se encontraron registros para los parámetros solicitados',
            ok: false,
            length: 0
        };
    }

    const profileNames = {
        admin: 'ADMINISTRADOR',
        notifier: 'NOTIFICADOR',
        register: 'OPERADOR DE REGISTRO',
        consult: 'OPERADOR DE CONSULTA'
    };

    for await (const item of resultArray) {
        let profiles = item.profiles ?? [];
        for (const profile of profiles) {
            worksheet.getCell(`C${j}`).value = i;
            worksheet.getCell(`D${j}`).value = item.doc_type.toUpperCase();
            worksheet.getCell(`E${j}`).value = item.doc;
            worksheet.getCell(`F${j}`).value = item.LDAP;
            worksheet.getCell(`G${j}`).value = item.second_lastname ? `${item.lastname.toUpperCase()} ${item.second_lastname.toUpperCase()}` : item.lastname.toUpperCase(); // Combinar lastname y second_lastname
            worksheet.getCell(`H${j}`).value = item.name.toUpperCase();
            worksheet.getCell(`I${j}`).value = profileNames[profile.k] || profile.k; // Cambiar nombre del perfil
            worksheet.getCell(`J${j}`).value = item.created_at ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : '';

            // Buscar el evento create_user para DATOS DE CREACIÓN
            let createUserHistory = await db.collection('user_history').findOne({
                user_id: item._id,
                profile: profile.k,
                event: 'create_user'
            });
            if (createUserHistory) {
                worksheet.getCell(`K${j}`).value = createUserHistory.changes.join(', ');
                worksheet.getCell(`L${j}`).value = createUserHistory.value.estado ? `Fecha de Inicio: ${moment(createUserHistory.value.fechaIni).format("YYYY-MM-DD")}\nFecha Fin: ${createUserHistory.value.fechaFin === 'Indeterminado' ? createUserHistory.value.fechaFin : moment(createUserHistory.value.fechaFin).format("YYYY-MM-DD")}` : 'PERFIL NO HABILITADO';
                worksheet.getCell(`M${j}`).value = createUserHistory.value.updated_user || createUserHistory.updated_user;
            } else {
                worksheet.getCell(`L${j}`).value = 'PERFIL NO HABILITADO';
            }

            // Buscar cambios en el historial, excluyendo el evento 'create_user'
            let historyCursor = await db.collection('user_history').find({
                user_id: item._id,
                profile: profile.k,
                event: {$ne: 'create_user'}
            }).sort({date: 1}).toArray();
            // let changeIndex = 1;

            const cells = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

            cells.forEach(cell => {
                worksheet.getCell(`${cell}${j}`).border = BORDER_THIN;
                worksheet.getCell(`${cell}${j}`).font = FONT_ROWS;
            });

            worksheet.getCell(`R${j}`).alignment = ALIGMENT_JUNP_CELL;
            worksheet.getCell(`S${j}`).alignment = ALIGMENT_JUNP_CELL;
            worksheet.getCell(`T${j}`).alignment = ALIGMENT_JUNP_CELL;

            const desde = j;
            let hasta = j
            j++;
            for (const history of historyCursor) {
                worksheet.getCell(`J${j}`).value = history.date ? moment(history.date).format("YYYY-MM-DD HH:mm:ss") : '';
                worksheet.getCell(`K${j}`).value = history.changes.join(', ') || history.value ;
                worksheet.getCell(`L${j}`).value = history.value.estado ? `Fecha de Inicio: ${moment(history.value.fechaIni).format("YYYY-MM-DD")}\nFecha Fin: ${history.value.fechaFin === 'Indeterminado' ? history.value.fechaFin : moment(history.value.fechaFin).format("YYYY-MM-DD")}` : 'PERFIL NO HABILITADO';
                worksheet.getCell(`M${j}`).value = history.updated_user;
                const cells = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
                cells.forEach(cell => {
                    worksheet.getCell(`${cell}${j}`).border = BORDER_THIN;
                    worksheet.getCell(`${cell}${j}`).font = FONT_ROWS;
                });

                worksheet.getCell(`R${j}`).alignment = ALIGMENT_JUNP_CELL;
                worksheet.getCell(`S${j}`).alignment = ALIGMENT_JUNP_CELL;
                worksheet.getCell(`T${j}`).alignment = ALIGMENT_JUNP_CELL;

                hasta = j
                j++;
            }

            worksheet.mergeCells(`C${desde}:C${hasta}`);
            worksheet.mergeCells(`D${desde}:D${hasta}`);
            worksheet.mergeCells(`E${desde}:E${hasta}`);
            worksheet.mergeCells(`F${desde}:F${hasta}`);
            worksheet.mergeCells(`G${desde}:G${hasta}`);
            worksheet.mergeCells(`H${desde}:H${hasta}`);
            worksheet.mergeCells(`I${desde}:I${hasta}`);

            i++;
        }
    }
    workbook.eachSheet((worksheet) => {
        const startRow = 8;
        const startCol = 'C'.charCodeAt(0);
        const endCol = 'M'.charCodeAt(0);

        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex >= startRow) {
                for (let col = startCol; col <= endCol; col++) {
                    const cellAddress = `${String.fromCharCode(col)}${rowIndex}`;
                    const cell = worksheet.getCell(cellAddress);
                    cell.alignment = ALIGMENT_JUNP_TEXT;
                }
            }
        });
    });

    return await workbook.xlsx.writeBuffer();
}
const validateStatus = async (receivedAt, readAt) => {
    let status = 'POR RECIBIR';

    if (readAt) {
        let resultCalc = await calcDate(readAt, receivedAt);

        if (resultCalc >= 5) {
            status = 'VENCIDO';
        } else {
            status = 'RECIBIDO';
        }
    } else {
        let resultCalc2 = await calcDate(new Date(), receivedAt);

        if (resultCalc2 >= 5) {
            status = 'VENCIDO';
        }
    }

    return status;
}

const calcDate = async (date1, date2) => {
    let countDayHoliday = 0;

    const diff = Math.floor(date1.getTime() - date2.getTime());
    const day = 1000 * 60 * 60 * 24;

    const days = Math.floor(diff / day);
    const months = Math.floor(days / 31);
    const years = Math.floor(months / 12);

    let dateCal = date2;
    for (let i = 0; i < days; i++) {
        dateCal.setDate(dateCal.getDate() + 1);

        if (dateCal.getDay() === 0 || dateCal.getDay() === 6) {
            countDayHoliday++;
        }

        if (daysHoliday[dateCal.getMonth()].includes(dateCal.getDate())) {
            countDayHoliday++;
        }
    }

    return days - countDayHoliday;
}

const getDayHoliday = async () => {
    //data calendar
    let dataHoliday = [[], [], [], [], [], [], [], [], [], [], [], []];
    const dataFilter = [
        {"field": "title", "value": ""},
        {"field": "editable", "value": "all"},
        {"field": "dateBegin", "value": ""},
        {"field": "dateEnd", "value": ""}];
    const resultCalendar = await calendarService.fetchAll(1, 100, JSON.stringify(dataFilter));

    for (let data of resultCalendar.data) {
        if (data.date_end) {
            // Crear una copia de la fecha de inicio
            let currentDate = new Date(data.date_begin);
            // Obtener solo la fecha (sin hora)
            currentDate.setHours(0, 0, 0, 0);

            // Crear una copia de la fecha de fin
            let endDate = new Date(data.date_end);
            // Obtener solo la fecha (sin hora)
            endDate.setHours(0, 0, 0, 0);

            // Procesar el rango de días
            while (currentDate <= endDate) {
                // Agregar el día actual como feriado
                let month = currentDate.getMonth();
                let day = currentDate.getDate();

                if (dataHoliday[month].indexOf(day) === -1) {
                    dataHoliday[month].push(day);
                }

                // Avanzar al siguiente día
                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
            // Caso de un solo día
            let day = new Date(data.date_begin);
            day.setHours(0, 0, 0, 0);

            let month = day.getMonth();
            let dayOfMonth = day.getDate();

            if (dataHoliday[month].indexOf(dayOfMonth) === -1) {
                dataHoliday[month].push(dayOfMonth);
            }
        }
    }

    return dataHoliday;
}


const reporteCasillasConsult = async (usuario, fechaInicio, fechaFin, documentType, documentNumber ) => {
    hoy = utils.getDate();
    hoyFormat = moment(hoy).add(5, 'hours').format("YYYY-MM-DD HH:mm:ss");

    const workbook = new ExcelJS.Workbook();
    workbook.lastModifiedBy = 'ONPE';
    workbook.created = hoy;
    workbook.modified = hoy;
    workbook.lastPrinted = hoy;
    const worksheet = workbook.addWorksheet('Hoja1');

    worksheet.mergeCells('C1:K3');
    worksheet.getCell('C1').value = 'Reporte de Casillas Electrónicas';
    worksheet.getCell('C1').font = FONT_SHEET_HEADER;
    worksheet.getCell('C1').alignment = ALIGMENT_CENTER;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 25;
    worksheet.getColumn(6).width = 25;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 23;
    worksheet.getColumn(10).width = 23;
    worksheet.getColumn(11).width = 25;

    const HEADER = ['C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8'];
    for (let item of HEADER) {
        worksheet.getCell(item).fill = FILL_HEADER;
        worksheet.getCell(item).font = FONT_COLUMN_HEADER;
        worksheet.getCell(item).alignment = ALIGMENT_CENTER;
        worksheet.getCell(item).border = BORDER_THIN;
    }
    const logo = workbook.addImage({
        base64: recursos.LOGO_BASE64,
        extension: 'png',
    });
    worksheet.addImage(logo, 'A1:B3');

    worksheet.getCell('C5').value = 'Usuario: ';
    worksheet.getCell('C5').font = FONT_COLUMN_BOLD;
    worksheet.getCell('D5').value = usuario;
    worksheet.getCell('D5').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C6').value = 'Fecha: ';
    worksheet.getCell('C6').font = FONT_COLUMN_BOLD;
    worksheet.getCell('D6').value = hoyFormat;
    worksheet.getCell('D6').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('D8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('E8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('F8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('G8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('H8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('I8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('J8').alignment = ALIGMENT_JUNP_HEADER;
    worksheet.getCell('K8').alignment = ALIGMENT_JUNP_HEADER;

    worksheet.getCell('C8').value = 'ÍTEM';
    worksheet.getCell('D8').value = 'TIPO DE DOCUMENTO';
    worksheet.getCell('E8').value = 'NÚMERO DE DOCUMENTO';
    worksheet.getCell('F8').value = 'NOMBRES';
    worksheet.getCell('G8').value = 'APELLIDO PATERNO';
    worksheet.getCell('H8').value = 'APELLIDO MATERNO';
    worksheet.getCell('I8').value = 'RAZÓN SOCIAL';
    worksheet.getCell('J8').value = 'ESTADO';
    worksheet.getCell('K8').value = 'FECHA CREACIÓN / EVALUACIÓN';

    let i = 1;
    let j = 9;
    let filter = {
        //con let cursos original // profile: appConstants.PROFILE_CITIZEN,
    }

    switch (documentType) {
        case 'todo':
            
            if (documentType !== 'todo' && documentType !== null && documentType !== undefined && documentType !== 'undefined') {
                filter.doc_type = documentType;
                filter.doc = documentNumber;
            }
            break;
        case 'dni': 
        case 'ce': 
        case 'ruc':
        case 'pr':
            if (documentNumber === null || documentNumber === 'null') {
                console.log('Aplicando filtro de documentType')
                filter.doc_type = documentType;
            } else {
                filter.doc_type = documentType;
                filter.doc = documentNumber;
            }
            break;
        default:
            break;
    }

    if (fechaInicio && fechaFin) {
        fechaFin = new Date(fechaFin + "T04:59:59.000Z");
        fechaFin.setDate(fechaFin.getDate() + 1)
        let rango = {$gte: new Date(fechaInicio + "T04:59:59.000Z"), $lte: fechaFin};
        filter = {
            ...filter, $or: [{$and: [{create_user: "owner"}, {$or: [{evaluated_at: rango}]}]}, //,  {update_date: rango}
                {$and: [{create_user: {$ne: "owner"}}, {created_at: rango}]}, {"status": "PENDIENTE"}]
        }

    } else if (fechaInicio) {
        let rango = {$gte: new Date(fechaInicio + "T04:59:59.000Z")};
        filter = {
            ...filter, $or: [{$and: [{create_user: "owner"}, {$or: [{evaluated_at: rango}]}]}, //,  {update_date: rango}
                {$and: [{create_user: {$ne: "owner"}}, {created_at: rango}]}, {"status": "PENDIENTE"}]
        }
        
    } else if (fechaFin) {
        fechaFin = new Date(fechaFin);
        fechaFin.setDate(fechaFin.getDate() + 1)
        let rango = {$lte: new Date(fechaFin + "T04:59:59.000Z")};
        filter = {
            ...filter, $or: [{$and: [{create_user: "owner"}, {$or: [{evaluated_at: rango}]}]}, //,  {update_date: rango}
                {$and: [{create_user: {$ne: "owner"}}, {created_at: rango}]}, {"status": "PENDIENTE"}]
        }

    }

    const db = await mongodb.getDb();

    let cursor = await db.collection(mongoCollections.INBOX).aggregate([
            {
                $addFields: {
                    ordenStatus: {
                        $cond: { if: { $eq: ["$status", "PENDIENTE"] }, then: 0, else: 1 }
                    }
                }
            },
            {$match: filter},
            {$sort: {ordenStatus: 1, evaluated_at: -1, update_date: -1}},
            {
                $lookup: {
                    "from": "users",
                    "foreignField": "_id",
                    "localField": "user_id",
                    "as": "user"
                }
            },
            {
                $project: {
                    _id: 0,
                    created_at: 1,
                    doc_type: 1,
                    doc: 1,
                    status: 1,
                    update_date: 1,
                    dateFiling: 1,
                    'user.name': 1,
                    'user.lastname': 1,
                    'user.second_lastname': 1,
                    'user.updated_password': 1,
                    'user.organization_name': 1,
                }
            },
        ],
        {
            allowDiskUse: true
        });

    let resultArray = await cursor.toArray();
    if (resultArray.length < 1) {
        return { 
            status: 404, 
            message: 'No se encontraron registros para los parámetros solicitados',
            ok: false,
            length: 0
        };
    } 

    for await (const item of resultArray) {
        var tmpFechaCreatedAt = "";
        if (item.create_user !== undefined && item.create_user === "owner") {
            tmpFechaCreatedAt = moment(item.created_at).format("YYYY-MM-DD HH:mm:ss");
        } else {
            tmpFechaCreatedAt = item.dateFiling !== undefined ? moment(item.dateFiling).format("YYYY-MM-DD") : "";
        }
        worksheet.getCell(`C${j}`).value = i;
        worksheet.getCell(`D${j}`).value = item.doc_type.toUpperCase();
        worksheet.getCell(`E${j}`).value = item.doc;
        worksheet.getCell(`F${j}`).value = `${item.user.length > 0 ? item.user[0].name : ''}`;
        worksheet.getCell(`G${j}`).value = `${item.user.length > 0 ? item.user[0].lastname : ''}`;
        worksheet.getCell(`H${j}`).value = `${item.user.length > 0 && item.user[0].second_lastname !== undefined ? item.user[0].second_lastname : ''}`;
        worksheet.getCell(`I${j}`).value = `${item.user[0].organization_name !== undefined || item.user[0].organization_name !== '' ? item.user[0].organization_name : ''}`;
        worksheet.getCell(`J${j}`).value = `${item.status !== undefined ? item.status : "REGISTRO INTERNO"}`;
        worksheet.getCell(`K${j}`).value = `${item.create_user !== 'owner' ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : (item.evaluated_at !== undefined ? moment(item.evaluated_at).format("YYYY-MM-DD HH:mm:ss") : (item.status === "PENDIENTE" ? "" : moment(item.created_at).format("YYYY-MM-DD HH:mm:ss")))}`;
        worksheet.getCell(`K${j}`).value = `${item.status === 'PENDIENTE' || undefined ? moment(item.created_at).format("YYYY-MM-DD HH:mm:ss") : moment(item.evaluated_at).format("YYYY-MM-DD HH:mm:ss")}`;


        worksheet.getCell(`C${j}`).border = BORDER_THIN;
        worksheet.getCell(`D${j}`).border = BORDER_THIN;
        worksheet.getCell(`E${j}`).border = BORDER_THIN;
        worksheet.getCell(`F${j}`).border = BORDER_THIN;
        worksheet.getCell(`G${j}`).border = BORDER_THIN;
        worksheet.getCell(`H${j}`).border = BORDER_THIN;
        worksheet.getCell(`I${j}`).border = BORDER_THIN;
        worksheet.getCell(`J${j}`).border = BORDER_THIN;
        worksheet.getCell(`K${j}`).border = BORDER_THIN;

        worksheet.getCell(`C${j}`).font = FONT_ROWS;
        worksheet.getCell(`D${j}`).font = FONT_ROWS;
        worksheet.getCell(`E${j}`).font = FONT_ROWS;
        worksheet.getCell(`F${j}`).font = FONT_ROWS;
        worksheet.getCell(`G${j}`).font = FONT_ROWS;
        worksheet.getCell(`H${j}`).font = FONT_ROWS;
        worksheet.getCell(`I${j}`).font = FONT_ROWS;
        worksheet.getCell(`J${j}`).font = FONT_ROWS;
        worksheet.getCell(`K${j}`).font = FONT_ROWS;

        worksheet.getCell(`C${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`D${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`E${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`F${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`G${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`H${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`I${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`J${j}`).alignment = ALIGMENT_MIDDLE;
        worksheet.getCell(`K${j}`).alignment = ALIGMENT_MIDDLE;

        j++;
        i++;
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

const getdatos = async (usuario, fechaInicio, fechaFin) => {
    const db = await mongodb.getDb();
    let cursor = await db.collection(mongoCollections.INBOX).find({_id: Object('6060dbfba67e0508ac9791da')});
    cursor.forEach(
        function (doc) {
            console.log(doc);
        },
        /*function(err) {
            client.close();
        }*/
    );
    //db.collection(mongoCollections.INBOX).update({})


    /*await db.collection(mongoCollections.CATALOG).update(filter, {
        $set: {
            value,
            update_user: usuarioRegistro,
            update_date: utils.getDate(),
        }
    });*/
}
const reportDisableUsers = async (result, usuario) => {
    let today = utils.getDate();
    const db = await mongodb.getDb();
    const workbook = new ExcelJS.Workbook();
    workbook.lastModifiedBy = 'ONPE';
    workbook.created = today;
    workbook.modified = today;
    workbook.lastPrinted = today;
    const worksheet = workbook.addWorksheet('Hoja1',{header:1});

    worksheet.mergeCells('C1:H3');
    worksheet.getCell('C1').value = 'Reporte de Deshabilitación';
    worksheet.getCell('C1').font = FONT_SHEET_HEADER;
    worksheet.getCell('C1').alignment = ALIGMENT_CENTER;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 30;
    worksheet.getColumn(7).width = 50;
    worksheet.getColumn(8).width = 70;

    const HEADER = ['C8', 'D8', 'E8', 'F8', 'G8','H8'];
    for (let item of HEADER) {
        worksheet.getCell(item).fill = FILL_HEADER;
        worksheet.getCell(item).font = FONT_COLUMN_HEADER;
        worksheet.getCell(item).alignment = ALIGMENT_CENTER;
        worksheet.getCell(item).border = BORDER_THIN;
    }
    const logo = workbook.addImage({
        base64: recursos.LOGO_BASE64,
        extension: 'png',
    });
    worksheet.addImage(logo, 'A1:B3');
    worksheet.getCell('C5').value = 'Usuario: ';
    worksheet.getCell('D5').value = usuario;
    worksheet.getCell('D5').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C6').value = 'Fecha: ';
    worksheet.getCell('D6').value = moment(today).add(5, 'hours').format("YYYY-MM-DD HH:mm:ss");
    worksheet.getCell('D6').alignment = ALIGMENT_LEFT;

    worksheet.getCell('C5').font = FONT_COLUMN_BOLD;
    worksheet.getCell('C6').font = FONT_COLUMN_BOLD;

    worksheet.getCell('C8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('D8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('E8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('F8').alignment = ALIGMENT_JUNP_TEXT;
    worksheet.getCell('G8').alignment = ALIGMENT_JUNP_TEXT;

    worksheet.getCell('C8').value = 'ÍTEM';
    worksheet.getCell('D8').value = 'TIPO DE DOCUMENTO';
    worksheet.getCell('E8').value = 'NÚMERO DE DOCUMENTO';
    worksheet.getCell('F8').value = 'USUARIO LDAP';
    worksheet.getCell('G8').value = 'MOTIVO';
    worksheet.getCell('H8').value = 'INFORMACIÓN';

    let i = 0;
    let j = 9;
    let k = 0;

    const withoutHeader = result.slice(1)

    for await (const item of withoutHeader) {
        if (item.length === 0 ) continue;
        worksheet.getCell(`C${j}`).value = i+1;
        worksheet.getCell(`D${j}`).value = item[k] ? item[k].toUpperCase() : '';
        worksheet.getCell(`E${j}`).value = item[k+1];
        worksheet.getCell(`F${j}`).value = item[k+2] ? item[k+2].toUpperCase() : '';
        worksheet.getCell(`G${j}`).value = item[k+3];
        worksheet.getCell(`H${j}`).value = item[k+4];

        worksheet.getCell(`C${j}`).border = BORDER_THIN;
        worksheet.getCell(`D${j}`).border = BORDER_THIN;
        worksheet.getCell(`E${j}`).border = BORDER_THIN;
        worksheet.getCell(`F${j}`).border = BORDER_THIN;
        worksheet.getCell(`G${j}`).border = BORDER_THIN;
        worksheet.getCell(`H${j}`).border = BORDER_THIN;

        worksheet.getCell(`C${j}`).font = FONT_ROWS;
        worksheet.getCell(`D${j}`).font = FONT_ROWS;
        worksheet.getCell(`E${j}`).font = FONT_ROWS;
        worksheet.getCell(`F${j}`).font = FONT_ROWS;
        worksheet.getCell(`G${j}`).font = FONT_ROWS;
        worksheet.getCell(`H${j}`).font = FONT_ROWS;

        worksheet.getCell(`R${j}`).alignment = ALIGMENT_JUNP_CELL;
        worksheet.getCell(`S${j}`).alignment = ALIGMENT_JUNP_CELL;
        worksheet.getCell(`T${j}`).alignment = ALIGMENT_JUNP_CELL;

        j++;
        i++;

    }

    return await workbook.xlsx.writeBuffer();
}
module.exports = {reporteCasillas, reporteNotificaciones, reporteUsuarios, reporteUsuariosHistorico, reporteCasillasConsult, getdatos, reportDisableUsers};

const mongodb = require('./../database/mongodb');
const appConstants = require("../common/appConstants");
const dotenv = require('dotenv');
dotenv.config({path: appConstants.PATH_ENV});

async function crearColeccionUUOO() {
  try {
    const db = await mongodb.getDb();
	console.log('Conexion establecida')
    
    const uuooData = [
      {
        "id": "1",
        "name": "GERENCIA DE INFORMÁTICA Y TECNOLOGÍA ELECTORAL",
        "status": "1"
      },
      {
        "id": "2",
        "name": "SECRETARIA GENERAL",
        "status": "1"
      },
      {
        "id": "3",
        "name": "GERENCIA DE ASESORÍA JURÍDICA",
        "status": "1"
      },
      {
        "id": "4",
        "name": "JEFATURA NACIONAL",
        "status": "1"
      },
      {
        "id": "5",
        "name": "GERENCIA DE ADMINISTRACIÓN",
        "status": "1"
      },
      {
        "id": "6",
        "name": "GERENCIA DE INFORMACIÓN Y EDUCACIÓN ELECTORAL",
        "status": "1"
      },
      {
        "id": "7",
        "name": "GERENCIA DE ORGANIZACIÓN ELECTORAL Y COORDINACIÓN REGIONAL",
        "status": "1"
      },
      {
        "id": "8",
        "name": "GERENCIA DE GESTIÓN ELECTORAL",
        "status": "1"
      },
      {
        "id": "9",
        "name": "GERENCIA DE PLANEAMIENTO Y PRESUPUESTO",
        "status": "1"
      },
      {
        "id": "10",
        "name": "GERENCIA DE RECURSOS HUMANOS",
        "status": "1"
      },
      {
        "id": "11",
        "name": "PROCURADURÍA PUBLICA",
        "status": "1"
      },
      {
        "id": "12",
        "name": "GERENCIA DE SUPERVISIÓN DE FONDOS PARTIDARIOS",
        "status": "1"
      },
      {
        "id": "13",
        "name": "GERENCIA GENERAL",
        "status": "1"
      }
    ];

    const resultado = await db.collection('UUOO').insertMany(uuooData);
    console.log(`Documentos insertados en la colección UUOO: ${resultado.insertedCount}`);

    const count = await db.collection('UUOO').countDocuments();
    console.log(`Total de documentos en la colección UUOO: ${count}`);

  } catch (error) {
    console.error('Error al ejecutar el script:', error);
  }
}

crearColeccionUUOO();
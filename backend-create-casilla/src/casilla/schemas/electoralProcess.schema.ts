import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { DuplicatedRecordException } from '../exceptions/duplicated-record.exception';

export type ElectoralProcessDocument = ElectoralProcess & Document;
/*export interface ElectoralProcessDocument extends Document {
  
};*/

@Schema({ collection: 'electoralProcess', versionKey: false })
export class ElectoralProcess extends Document {
  @Prop({
    required: true,
    unique: true,
    /* validate: {
      validator: async function (name) {
        console.log('name : ', name);
        console.log('this');
        console.log(this);
        const existingProcess = await this.model('electoralProcess').findOne({ name: name });

        // Accede al valor de la propiedad directamente desde el parámetro de la función.
        console.log(' proceso', existingProcess);
        if (existingProcess) {
          console.log('existe proceso', existingProcess);
          this.invalidate('name', `${name} está en uso, elige otro`);
        }

        return !existingProcess;
         
      },
      message: (props) => `${props.value} is already used by another electoralProcess`,
      //message: `stá en uso por otro registro, use otro`,
      //errorMsg: ` está en uso por otro registro, use otro`,
      //errorMessage: `${this.name} ya se encuetra registrado, use otra opción`,
    }, */
    /*validate: function (value, validateProperties) {
      console.log('value : ', value);
      console.log('validateProperties : ', validateProperties);
      return this.model('electoralProcess')
        .findOne({ name: value })
        .then((electoralProcess) => !electoralProcess);
    },*/
    //message: (props) => `${this.properties.value} está en uso por otro registro, use otro`,
    validate: [
      {
        validator: async function (value) {
          return await isNameUnique(this, 'name', value);
        },
        /* message: (props) => {
          //console.log('props:', props);
          return `El campo '${props.path}' con valor '${props.value}' existe en los registros, intente con otro`;
        }, */
      },
    ],
  })
  name: string;

  @Prop({
    default: 1,
  })
  status: number; // 0 => inactive; 1 => active

  @Prop({
    required: true,
    unique: true,
    validate: [
      {
        validator: async function (value) {
          return await isNameUnique(this, 'shortName', value);
        },
      },
    ],
  })
  shortName: string;

  @Prop()
  description: string;

  @Prop({ min: 1900, max: 2100 }) // año al que corresponde el proceso electoral
  year: string;
}

export const ElectoralProcessSchema = SchemaFactory.createForClass(ElectoralProcess);

async function isNameUnique(context, fieldName: string, value: string) {
  console.log('this : ', this);
  console.log('valor a validar : ', value);
  //const existingProcess = await this.model('electoralProcess').findOne({ name: value });
  const existingProcess = await context.model('ElectoralProcess').findOne({ [fieldName]: value });
  console.log('existingProcess : ', existingProcess);
  /* if (existingProcess) {
    const error = new Error(`${value} está en uso por otro registro, use otro`);
    // Puedes personalizar aún más el objeto de error si es necesario.
    error.name = 'ValidatorError';
    //error.path = 'name';
    throw error;
  } */
  if (existingProcess) {
    console.log('existe proceso', existingProcess);
    //this.invalidate('name', `${value} está en uso, elige otro`);
    const message = `El campo '${fieldName}' con valor '${value}' existe en los registros, intente con otro`;
    context.invalidate(fieldName, message);
    console.log('Lanzando excepci+on');
    throw new DuplicatedRecordException(message);
  }
  /* if (existingProcess) {
  } */
  return !existingProcess;
}

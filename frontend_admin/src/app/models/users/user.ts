export class User {
  name: string;
  organization: string;
  doc: string;
  doc_type?: string;
  estate_inbox?:string;
  enAtencion ?: boolean;
  enAtencionPor: boolean;
  pending_migration ?: boolean;
  profile ?: string;
  profiles?: [];
  status?: string;
}

export class Box {
  docType?: string;
  doc?: string;
  email?: string;
  cellphone?: string;
  address?: string;
  acreditation_type?: string;
  pdf_resolution: File;
  pdf_creation_solicitude: File;
  pdf_agree_tos: File;
  pdf_terminos: File;
}

export class TypeAccreditation {
  code: string;
  value: string;
}


export class UserDetail {
  inbox_id : string;
  email : string;
  cellphone : string;
  ubigeo : string;
  address : string;
  user : _User = new _User();
}

export class UserDetailUpdate {
  userId: string
  email: string
  cellphone: string
  phone: string
  address: string
  ubigeo: string
  webSite: string
  rep: IRepresentative
  personType: string
  officials: []
}
export class UserDetailUpdatePn {
  userId: string
  email: string
  cellphone: string
  phone: string
  address: string
  ubigeo: string
  personType: string
}

export interface IRepresentative{
  id: string
  email: string
  cellphone: string
  phone: string
  ubigeo: string
  address: string
  position: string
  positionName: string
}

export interface IResendEmailAndSms {
  userId?: string;
  notificationId?: string;
  sendType: string;
  email?: string;
  cellphone?: string;
  isRep?: boolean;
  mode?: string;
  RepId?: any;
  doc_type?: string;
  doc?: string;
  position?: any;
}

export class _User{
  name : string = "";
    lastname : string = "";
}

//metod TypeCatalog feature/Stmp
export class TypeCatalog {
  code: string;
  value: string;
}
export class Profiles {
  value: string;
  name: string;
  estado: boolean;
  fechaIni: any;
  fechaFin: any;
  indeterminate: boolean;
}

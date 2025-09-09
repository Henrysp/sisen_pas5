export class responseSunat{

    success ?: boolean;
    data ?: any;


}



export class requesGetData{
    ruc ?: string;
    recaptcha ?: string;
}


export class requestValidateRepresentative {
    docType?: string;
    doc?: string;
    asientoRegistralRep?: string;
    names?: string;
    lastname?: string;
    second_lastname?: string;
    email?: string;
    cellphone?: string;
    ubigeo?: string;
    address?: string;
    position?: string;
    positionName?: string;
    documentTypeAttachment?: string;
    documentNameAttachment?: any;
    recaptcha?: string;
    birthday?: string;
    verifyCode?: string;
    ruc?: string;
}


export class responseValidateRepresentative{

    success ?: boolean;

    message ? : string;
}

export class RequestValidatePJ{
    docType?: string;
    doc?: string;
    organizationName?: string;
    numeroPartida?: string;
    asientoRegistral?: string;
    email?: string;
    cellphone?: string;
    telephone?: string;
    ubigeo?: string;
    address?: string;
    webSite?: string;
    recaptcha?: string;
    files?: File[];
}

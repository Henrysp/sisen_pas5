export class Notification {
    id                ?:string;
    expedient         ?:string;
    inbox_doc         ?:string;
    inbox_name        ?:string;
    organization_name ?:string;
    received_at       ?:string;
    read_at           ?:string;
}

export class SendNotification {
    docType  ?: string;
    doc      ?: string;
    uuoo      ?: string;
    uuooName      ?: string;
    name     ?: string;
    expedient?: string;
    message  ?: string;
    file1    ?: File[];
    // file2    ?: string;
    // file3    ?: string;
}
export class TypeDocument {
	id   : string;
	value: string;
}
export class Filters {
    id   : string;
	value: string;
}

export class Procedure {
    code : string;
    value: string;
}


export class ModeloResponse{
    success: boolean;
    message: string;
}

export class attachment{
    name:string
    url: string;
    blocked: boolean;
}


export class notificationRequest{
    id: string;
}
export class notification{
    id: string;
    expedient: string;
    notifier_area: string;
    received_at: string;
    read_at: string;
    message: string;
    attachments: attachment[];
    automatic: boolean;
    created_at: string;
    inbox_name: string;
    organization_name: string;
    inbox_doc: string;
    expired_in: string;
    expired: boolean;
    n_expedient: string;
    procedure: string;
    email_sent_at: string;
    email_sent_status: boolean;
    sms_sent_at: string;
    sms_sent_status: boolean;
    email_sent_at_rep: string;
    email_sent_status_rep: boolean;
    sms_sent_at_rep: string;
    sms_sent_status_rep: boolean;
    inbox_email: string;
    inbox_cellphone: string;
    type_doc: string;
    inbox_doc_type: string;
    event_history: any;
    event_history_notifications: any;
    orgPol: any;
    officials: any;
}

export class searchNotifications {
    textSearch: string;
    pageIndex: number;
    pageSize: number;
}

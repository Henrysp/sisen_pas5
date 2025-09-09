export class notification{

    expedient       : string;
    notifier_area   : string;
    received_at     : string;
    read_at         : string;
    message         : string;
    attachments     : attachment[];
    acuse           :acuse;
}

export class attachment{

    name :string;
    url : string;
}


export class notificationRequest{
    id: string;
    doc: string;
}

export class acuse{
    name :string;
    url : string;
}

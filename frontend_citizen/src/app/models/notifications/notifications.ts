export class notifications{
    id              : string;
    expedient       : string;
    notifier_area   : string;
    received_at     : string;
    read_at         : string;
    read_position_status         : boolean;
}

export class notificationsRespone{
    success     : boolean;
    page        : number;
    count       : number;
    recordsTotal: number;
    Items        : notifications[];
}

export class searchNotifications {
    textSearch: string;
    pageIndex: number;
    pageSize: number;
}

import { SendNotification } from "./notification";

export class NotificationRequest {
    search: string;
    filter: string;
    page  : number;
    count : number;
}

export class SendNotificationRequest {
    notification: SendNotification = new SendNotification();
}

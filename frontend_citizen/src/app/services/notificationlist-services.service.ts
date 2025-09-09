import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { notificationRequest } from '../models/notification/notification';
import { searchNotifications } from '../models/notifications/notifications';
import { notificationsRequest } from '../models/notifications/notifications-request';

const API_URL = environment.URL_SERVICES;
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class NotificationlistServicesService {

  private fields = new BehaviorSubject<searchNotifications>(null);
  fieldsSearch = this.fields.asObservable();
  private notificationsLoadedSource = new BehaviorSubject<boolean>(false);
  notificationsLoaded$ = this.notificationsLoadedSource.asObservable();

  searchNotifications(value : searchNotifications) {
    this.fields.next(value);
  }

  constructor(private http: HttpClient) { }

  getNotificationList<T>(notificationRequest: notificationsRequest): Observable<T> {
    return this.http.post<any>(API_URL + "/notifications", notificationRequest, httpOptions).pipe(map(res => res));
  }

  getUnreadNotifications() {
    return this.http.post<any>(`${API_URL}/notifications-unread`, null, httpOptions);
  }

  getNotificationDetail<T>(notirequest: notificationRequest): Observable<T> {
    return this.http.post<any>(API_URL + "/notification", notirequest, httpOptions).pipe(map(res => res));
  }

  getAttachment(url: string) {
    return this.http.get(url, {
      responseType: 'blob'
    });
  }
  markNotificationsAsLoaded() {
    this.notificationsLoadedSource.next(true);
  }
}

import { User } from './user';

export class UserData {
    success     : boolean;
	recordsTotal: number;
	page        : number;
	count       : number;
	Items       : User[];
}

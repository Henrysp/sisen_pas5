/**
 * Created by Alexander Llacho
 */

export interface IGenericResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  description?: string;
  error?: object;
}

export class IError {
  code?: string;
  message?: string;
}

export const TOKEN_NAME : string = 'token';
export enum ResultSignature {
  TypeEvenReniec = 'W',
}
//export const KeycodeCaptcha = '6LeFgcMZAAAAACDRx5DWqeuvRVAnYqvXNazcSDNf';

export const VERSION_SISEN : string = 'SISEN v2.0.0';
export const ERROR_SERVER : string = 'El servicio no esta disponible, inténtelo de nuevo o más tarde';
export const MAXINTENT : number = 3;
export const MAXFILES : number  = 10;
export const MAX_MB_FILES : number = 10;
export const MAX_TAM_FILES : number = 1048576 * 3;
export const MAX_TAM_FILES_10 : number = 1048576 * MAX_MB_FILES;
export const MIN_TAM_FILES : number = 1;
export const MAX_LENGTH_NAME_FILES : number = 100;
export const LBL_ADD_FILES : string = 'Agregar archivos o dar clic aquí.';
export const LBL_FEATURES_FILE_1: string = `Adjuntar archivo* (PDF, JPG, JPEG, PNG o BMP con peso máximo de ${MAX_MB_FILES}MB). El nombre del archivo no debe superar los ${MAX_LENGTH_NAME_FILES} caracteres.`;
export const LBL_FEATURES_FILE_1_NOT_REQUIRED: string = `Adjuntar archivo (PDF, JPG, JPEG, PNG o BMP con peso máximo de ${MAX_MB_FILES}MB). El nombre del archivo no debe superar los ${MAX_LENGTH_NAME_FILES} caracteres.`;
export const LBL_FEATURES_FILE: string = `Adjuntar archivos* (hasta ${MAXFILES} PDF, JPG, JPEG, PNG o BMP con peso máximo de ${MAX_MB_FILES}MB por cada archivo). El nombre del archivo no debe superar los ${MAX_LENGTH_NAME_FILES} caracteres.`;
export const LBL_FEATURES_FILES: string = `Adjuntar archivos* (hasta ${MAXFILES} PDF, JPG, JPEG, PNG, BMP, MP4, MOV, WMV, AVI, AVCHD, FLV, F4V, SWF, MP3, ZIP, RAR o 7Z con peso máximo de 1 GB por cada archivo). El nombre del archivo no debe superar los ${MAX_LENGTH_NAME_FILES} caracteres.`;
export const LBL_ERROR_ONLY_FILE: string = `Sólo se acepta formato PDF, JPG, JPEG, PNG o BMP`;
export const LBL_ERROR_MAX_LENGTH_NAME: string = `El nombre de los archivos debe tener un máximo de ${MAX_LENGTH_NAME_FILES} caracteres`;
export const LBL_ERROR_MAX_SIZE_FILE : string = `El tamaño del archivo máximo es ${MAX_MB_FILES}MB`;
export const LBL_ERROR_MAX_FILES : string = `Máximo diez (${MAXFILES}) documentos`;
export const LBL_FEATURES_FILE_DISABLE: string = `Adjuntar archivo* (XLSX con peso máximo de ${MAX_MB_FILES}MB). El nombre del archivo no debe superar los ${MAX_LENGTH_NAME_FILES} caracteres.`;


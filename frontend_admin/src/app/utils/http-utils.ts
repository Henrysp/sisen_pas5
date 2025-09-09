import * as moment from 'moment';

export const convertObjectToGetParams = (obj, keyParent = null) => {
  let resp = {};
  Object.keys(obj).forEach((k) => {
    const value = obj[k];
    const key = keyParent ? `${keyParent}.${k}` : k;

    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        resp[key] = arrayToString(value);
      } else if (isValidObject(value)) {
        const children = convertObjectToGetParams(value, key);
        resp = { ...resp, ...children };
      } else if (moment.isMoment(value)) {
        resp[key] = value.format('YYYY-MM-DD');
      } else {
        resp[key] = String(obj[k]);
      }
    }
  });
  return resp;
};

export const isValidObject = (obj) => {
  return (
    typeof obj === 'object' &&
    obj &&
    !Array.isArray(obj) &&
    !moment.isMoment(obj) &&
    isConstructor(obj.constructor)
  );
};

export const isConstructor = (f) => {
  try {
    Reflect.construct(String, [], f);
  } catch (e) {
    return false;
  }
  return true;
};

export const arrayToString = (arr): string => {
  let str = '';
  if (arr != null) {
    arr.forEach((i, index) => {
      str += i;
      if (index != arr.length - 1) {
        str += ',';
      }
    });
  }
  return str;
};

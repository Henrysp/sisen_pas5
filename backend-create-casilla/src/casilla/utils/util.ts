import { Inject } from '@nestjs/common';
import * as cryptoJS from 'crypto-js';
import * as fs from 'fs';

export class Utils {
  path_upload = process.env.PATH_UPLOAD;
  path_upload_tmp = process.env.PATH_UPLOAD_TMP;

  private window: Window;
  constructor() {}

  public isEmpty(text) {
    if (!text) {
      return true;
    }
    return text.trim() === '';
  }

  validNumeric(value) {
    return /^[0-9]+$/.test(value) !== false;
  }

  stringHash(text) {
    return cryptoJS.createHash('sha256').update(text).digest('hex');
  }

  getPath(prePath) {
    const _date = new Date(Date.now());
    return prePath + _date.getFullYear() + '/' + (_date.getMonth() + 1) + '/' + _date.getDate() + '/';
  }

  async copyFile(oldPathFile, newPath, filename, doc, timestamp, isTmp, isBlocked) {
    try {
      const rawData = fs.readFileSync(oldPathFile);

      const pathAttachment = this.getPath(newPath);

      const stringHashNameFile = this.stringHash(
        cryptoJS.randomBytes(5).toString('hex') + '_' + doc + '_' + timestamp + '_' + filename,
      );

      const newPathFile = (isTmp ? this.path_upload_tmp : this.path_upload) + '/' + pathAttachment + stringHashNameFile;

      fs.mkdirSync((isTmp ? this.path_upload_tmp : this.path_upload) + '/' + pathAttachment, { recursive: true });

      fs.writeFileSync(newPathFile, rawData);

      return { path: pathAttachment + stringHashNameFile, name: filename, blocked: isBlocked };
    } catch (err) {
      console.error(err);

      return false;
    }
  }
}

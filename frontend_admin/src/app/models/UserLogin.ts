export class UserLogin{
  docType   :  string;
  doc       :  string;
  password  :  string;
  profile   :  string;
  recaptcha :  string;
  usuario: string;
}


export class recoverypass{

  docType: string;
    doc:  string;
    recaptcha : string;

}


export class userChangePass{

  oldPassword : string;
  newPassword : string;
  repeatNewPassword  :string;

}

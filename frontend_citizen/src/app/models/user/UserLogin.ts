export class UserLogin{
  docType   :  string;
  doc       :  string;
  cargo     :  string;
  password  :  string;
  recaptcha :  string;
}

export class userChangePass{

  oldPassword : string;
  newPassword : string;
  repeatNewPassword  :string;

}

export class recoverypass{
  docType: string;
  doc: string ;
  recaptcha: string;
  cargo: string;
}

const ldap = require('ldap-authentication');
require('dotenv').config(); // Asegúrate de llamar a dotenv.config() al inicio

// Usar variables de entorno
const LDAP_IP = process.env.LDAP_IP;
const LDAP_PORT = process.env.LDAP_PORT;
const LDAP_USER = process.env.LDAP_USER;
const LDAP_USER_PASSWORD = process.env.LDAP_USER_PASSWORD;
const ldapDomain = 'onpe.gob.pe';
const ENV = process.env.NODE_ENV;

class LdapAuthenticator {
  constructor() {
    this.url = `ldap://${LDAP_IP}:${LDAP_PORT}`;
    this.baseDn = "ou=cuentas de usuarios,dc=onpelima,dc=onpe,dc=gob,dc=pe";
  }

  async authenticate(username, password) {
    let userDn;

    if (ENV === "dev") {
      //userDn = `${username}@retec.local`;
      return true; // Siempre devuelve true en ambiente dev
    } else if (ENV === "production") {
      userDn = `${username}@onpe.gob.pe`;
    } else if (ENV === "local") {
      console.log("Ambiente local, autenticación siempre exitosa.");
      return true; // Siempre devuelve true en ambiente local
    } else {
      throw new Error("Invalid environment"); // Lanza un error si el entorno no es válido
    }

    const options = {
      ldapOpts: {
        url: this.url
      },
      userDn: userDn,
      userPassword: password
    };

    console.log(`Intentando autenticar al usuario: ${userDn}`);

    try {
      const user = await ldap.authenticate(options);
      console.log('Usuario autenticado:', user);
      return true; // Devuelve true si el usuario y contraseña son correctos
    } catch (error) {
      console.error('Error en la autenticación:', error);
      return false; // Devuelve false si hay un error (usuario o contraseña incorrectos)
    }
  }

  async handleReferral(error, username, password) {
    if (!error.referrals || error.referrals.length === 0) {
      throw new Error('No se proporcionó una URL de referencia.');
    }

    const referralUrl = error.referrals[0]; // Tomar la primera URL de referencia
    const options = {
      ldapOpts: {
        url: referralUrl
      },
      userDn: `${username}@${ldapDomain}`,
      userPassword: password,
      userSearchBase: this.baseDn,
      usernameAttribute: 'userPrincipalName',
      username: `${username}@${ldapDomain}`
    };

    try {
      const user = await ldap.authenticate(options);
      console.log('Usuario autenticado en el servidor de referencia:', user);
      return user;
    } catch (referralError) {
      console.error('Error en la autenticación en el servidor de referencia:', referralError);
      throw referralError;
    }
  }

  async search(username) {
    const options = {
      ldapOpts: {
        url: this.url
      },
      adminDn: `${LDAP_USER}@${ldapDomain}`,
      adminPassword: LDAP_USER_PASSWORD,
      userSearchBase: this.baseDn,
      userSearchFilter: `(&(cn=${username}))`, // Ajuste el filtro de búsqueda para coincidir con el CN
      usernameAttribute: 'userPrincipalName',
      username: `${username}@${ldapDomain}`,
      verifyUserExists: true,
      attributes: ['dn', 'sn', 'cn', 'mail'] // Atributos que quieres recuperar
    };

    try {
      const user = await ldap.authenticate(options);
      console.log('Usuario encontrado:', user);
      return true; // Retorna true si el usuario es encontrado
    } catch (error) {
      if (error.name === 'ReferralError') {
        console.log('Referencia encontrada, intentando autenticar en el servidor de referencia...');
        return this.handleReferral(error, username, LDAP_USER_PASSWORD);
      } else {
        console.error('Error en la búsqueda:', error);
        return false; // Retorna false si hay un error en la búsqueda
      }
    }
  }
}

module.exports = LdapAuthenticator;

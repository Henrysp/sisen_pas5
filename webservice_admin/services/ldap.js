/**
 * Created by josecastroochante@gmail.com
*/

const ldap = require('ldapjs');
//const { LDAP_IP, LDAP_PORT, ENV, LDAP_USER, LDAP_USER_PASSWORD } = require('./src/config');
require('dotenv').config(); // Asegúrate de llamar a dotenv.config() al inicio

// Usar variables de entorno
const LDAP_IP = process.env.LDAP_IP;
const LDAP_PORT = process.env.LDAP_PORT;
const ENV = process.env.NODE_ENV;
const LDAP_USER = process.env.LDAP_USER;
const LDAP_USER_PASSWORD = process.env.LDAP_USER_PASSWORD;



class LDAP {
  constructor() {
    this.client = ldap.createClient({
      url: `ldap://${LDAP_IP}:${LDAP_PORT}`
    });
  }


    /*validateUser(username, password) {
        return new Promise((resolve, reject) => {
        const userDN = ENV === "prod" ? `${username}@onpe.gob.pe` : `${username}@retec.local`;
        this.client.bind(userDN, password, (err) => {
            if (err) {
            console.error(err);
            return reject(false);
            }
            if (ENV === "local" || ENV === 'dev') {
            return resolve(true);
            }
            return resolve(true);
        });
        });
    }*/
    
    validateUser(username, password) {
        return new Promise((resolve, reject) => {
            let userDN;
            if (ENV === "dev") {
                //resolve(true); //
                userDN = `${username}@retec.local`;
            } else if (ENV === "production") {
                userDN = `${username}@onpe.gob.pe`;
            } else if (ENV === "local") {
                resolve(true); // Siempre devuelve true en ambiente local
                return;
            } else {
                reject(new Error("Invalid environment")); // Rechaza la promesa si el entorno no es válido
                return;
            }

            this.client.bind(userDN, password, (err) => {
                if (err) {
                    console.error(err);
                    resolve(false); // Devuelve false si hay un error (usuario o contraseña incorrectos)
                } else {
                    resolve(true); // Devuelve true si el usuario y contraseña son correctos
                }
            });
        });
    }
  
    /*
        searchUserLDAP(targetUsername) {
            return new Promise((resolve, reject) => {
              this.client.bind(`${LDAP_USER}@retec.local`, LDAP_USER_PASSWORD, (err) => {
                if (err) {
                  console.error(err);
                  return reject(null);
                }
        
                const base = ENV === "dev" ? "OU=Cuentas de Usuarios,DC=retec,DC=local" : "OU=Cuentas de Usuarios,DC=onpe,DC=gob.pe";
                const options = {
                  scope: 'sub',
                  filter: `(sAMAccountName=${targetUsername})`
                };
        
                this.client.search(base, options, (err, res) => {
                  if (err) {
                    console.error(err);
                    return reject(null);
                  }
        
                  let entries = [];
                  res.on('searchEntry', (entry) => {
                    entries.push(entry.object);
                  });
                  res.on('error', (err) => {
                    console.error('search error: ' + err.message);
                    reject(null);
                  });
                  res.on('end', (result) => {
                    console.log('search status: ' + result.status);
                    if (entries.length > 0) {
                      const user = entries[0];
                      resolve({
                        name: user.name,
                        userPrincipalName: user.userPrincipalName,
                        displayName: user.displayName
                      });
                    } else {
                      resolve(null);
                    }
                  });
                });
              });
            });
          }
        */


    
        searchUserLDAP(targetUsername) {
            return new Promise((resolve, reject) => {
              const ldapUser = process.env.LDAP_USER;
              const ldapPassword = process.env.LDAP_USER_PASSWORD;
              const ldapDomain = 'onpe.gob.pe';
          
              const ldapUserPrincipalName = `${ldapUser}@${ldapDomain}`;
              const ldapDistinguishedName = `CN=${ldapUser},DC=onpe,DC=gob,DC=pe`;
          
              //const client = ldap.createClient({
              //  url: `ldap://${LDAP_IP}:${LDAP_PORT}` // Reemplaza con la URL de tu servidor LDAP
              //});
          
              this.client.bind(ldapUserPrincipalName, ldapPassword, (err) => {
                if (err) {
                  console.log("No se validó el usuario con UPN");
                  console.log("Error de autenticación:", err);
                  console.log("Usuario:", ldapUserPrincipalName);
          
                  client.bind(ldapDistinguishedName, ldapPassword, (err) => {
                    if (err) {
                      console.log("No se validó el usuario con DN");
                      console.log("Error de autenticación:", err);
                      console.log("Usuario:", ldapDistinguishedName);
                      return reject(err);
                    }
                    console.log("Autenticación exitosa con DN");
                    this.performSearch(this.client, targetUsername, resolve, reject);
                  });
                } else {
                  console.log("Autenticación exitosa con UPN");
                  this.performSearch(this.client, targetUsername, resolve, reject);
                }
              });
            });
          }
          
          performSearch(client, upn, resolve, reject) {
            let searchBase = '';
        
            if (ENV === "dev") {
              console.log('search dev', upn);
              searchBase = "OU=Cuentas de Usuarios,DC=retec,DC=local";
            } else if (ENV === "production") {
              console.log('search prod', upn);
              searchBase = "OU=Cuentas de Usuarios,DC=onpe,DC=gob.pe";
            } else {
              console.log('Environment not set correctly');
              return reject(new Error('Environment not set correctly'));
            }
        
            const searchOptions = {
              filter: `(&(sAMAccountName=${upn}))`,
              //filter: `(&(userPrincipalName=${upn}))`, // Filtro de búsqueda por UPN
              scope: 'sub'//, // Puede ser 'base', 'one', o 'sub'
              //attributes: ['dn', 'sn', 'cn', 'mail'] // Atributos que quieres recuperar
            };
        
            client.search(searchBase, searchOptions, (err, res) => {
              if (err) {
                console.log('Error en la búsqueda LDAP');
                console.log(err);
                return reject(err);
              }
        
              let data = [];
              res.on('searchEntry', (entry) => {
                data.push(entry.object);
              });
        
              res.on('searchReference', (referral) => {
                console.log('Referencia encontrada:', referral.uris.join());
                // Manejar la referencia reenviando la solicitud al servidor indicado
                referral.uris.forEach(uri => {
                  const referralClient = ldap.createClient({ url: uri });
                  referralClient.bind(client.bindDN, client.credentials, (err) => {
                    if (err) {
                      console.error('Error al enlazar con el servidor de referencia:', err);
                      return reject(err);
                    }
                    referralClient.search(searchBase, searchOptions, (err, res) => {
                      if (err) {
                        console.error('Error en la búsqueda LDAP en el servidor de referencia:', err);
                        return reject(err);
                      }
                      res.on('searchEntry', (entry) => {
                        data.push(entry.object);
                      });
                      res.on('end', (result) => {
                        referralClient.unbind();
                        if (data.length > 0) {
                          const user = data[0];
                          console.log('Usuario encontrado en el servidor de referencia:', user);
                          resolve(user);
                        } else {
                          console.log('No se encontró el usuario en el servidor de referencia');
                          resolve(null);
                        }
                      });
                    });
                  });
                });
              });
        
              res.on('error', (err) => {
                console.error('Error en la búsqueda:', err.message);
                reject(err);
              });
        
              res.on('end', (result) => {
                console.log('Estado de la búsqueda:', result.status);
                client.unbind((err) => {
                  if (err) {
                    console.log('Error al cerrar la conexión LDAP:', err);
                  } else {
                    console.log('Conexión LDAP cerrada correctamente');
                  }
                });
        
                if (data.length > 0) {
                  const user = data[0];
                  console.log('Usuario encontrado:', user);
                  resolve(user);
                } else {
                  console.log('No se encontró el usuario');
                  resolve(null);
                }
              });
            });
          }
    
    
    searchUserLDAP3(targetUsername) {
          const ldapUser = process.env.LDAP_USER;
          const ldapPassword = process.env.LDAP_USER_PASSWORD;
          const ldapDomain = 'onpe.gob.pe';//'retec.local';
          
          // Prueba con diferentes formatos de nombre de usuario
          const ldapUserPrincipalName = `${ldapUser}@${ldapDomain}`;
          const ldapDistinguishedName = `CN=${ldapUser},DC=retec,DC=local`;
          
          this.client.bind(ldapUserPrincipalName, ldapPassword, (err) => {
            if (err) {
              console.log("No se validó el usuario con UPN");
              console.log("Error de autenticación:", err);
              console.log("Usuario:", ldapUserPrincipalName);
          
              // Intentar con Distinguished Name (DN)
              this.client.bind(ldapDistinguishedName, ldapPassword, (err) => {
                if (err) {
                  console.log("No se validó el usuario con DN");
                  console.log("Error de autenticación:", err);
                  console.log("Usuario:", ldapDistinguishedName);
                  return null;
                }
                console.log("es valido");
                // Aquí iría el código para manejar el caso en que la autenticación sea exitosa con DN
              });
              return null;
            }
            console.log("es valido2");
            let searchBase = '';
          if (ENV === "dev") {
            console.log('search dev', targetUsername);
            searchBase = "OU=Cuentas de Usuarios,DC=retec,DC=local";
          } else if (ENV === "production") {
            console.log('error en search0');
            searchBase = "OU=Cuentas de Usuarios,DC=onpe,DC=gob.pe";
          } else {
            console.log('Environment not set correctly');
            return null;
          }
    
          const options = {
            scope: 'sub',
            filter: `(&(sAMAccountName=${targetUsername}))`
          };
          const searchOptions = {
            filter: `(&(sAMAccountName=${targetUsername}))`, // Filtro de búsqueda por correo electrónico
            scope: 'sub', // Puede ser 'base', 'one', o 'sub'
            attributes: ['dn', 'sn', 'cn', 'mail'] // Atributos que quieres recuperar
          };
          console.log('error en 1');
          this.client.search('OU=Cuentas de Usuarios,DC=onpe,DC=gob.pe', searchOptions, (err, res) => {
            if (err) {
                console.log('error en search2');
              console.log(err);
              return null;
            }
            console.log('error en search3');
            let data = [];
            res.on('searchEntry', (entry) => {
              data.push(entry.object);
            });
            console.log('error en search4');
            console.log(data)
            res.on('end', () => {
              if (data.length > 0) {
                console.log('error en search5');
                const user = data[0];
                console.log(user);
                resolve(true); //return {
                    resolve(true);
                    //name: user.name,
                  //userPrincipalName: user.userPrincipalName,
                  //displayName: user.displayName
                //};
              } else {
                console.log('error en search6');
                console.log("Referencia:", err.lde_message);
                return null;
              }
            });
          });
            // Aquí iría el código para manejar el caso en que la autenticación sea exitosa con UPN
          });}
         
    searchUserLDAP2(targetUsername) {
        console.log('search_user_ldap');
        console.log(process.env.LDAP_USER, process.env.LDAP_USER_PASSWORD);
        // this.validateUser(process.env.LDAP_USER, process.env.LDAP_USER_PASSWORD); // Implementar según sea necesario
        this.client.bind(`${process.env.LDAP_USER}@retec.local`, process.env.LDAP_USER_PASSWORD, (err) => {
          if (err) {
            console.log(err);
            return null;
          }
    
          let searchBase = '';
          if (process.env.ENV === "dev") {
            console.log('search dev', targetUsername);
            searchBase = "OU=Cuentas de Usuarios,DC=retec,DC=local";
          } else if (process.env.ENV === "production") {
            searchBase = "OU=Cuentas de Usuarios,DC=onpe,DC=gob.pe";
          } else {
            console.log('Environment not set correctly');
            return null;
          }
    
          const options = {
            scope: 'sub',
            filter: `(&(sAMAccountName=${targetUsername}))`
          };
    
          this.client.search(searchBase, options, (err, res) => {
            if (err) {
              console.log(err);
              return null;
            }
    
            let data = [];
            res.on('searchEntry', (entry) => {
              data.push(entry.object);
            });
    
            res.on('end', () => {
              if (data.length > 0) {
                const user = data[0];
                console.log(user);
                return {
                  name: user.name,
                  userPrincipalName: user.userPrincipalName,
                  displayName: user.displayName
                };
              } else {
                return null;
              }
            });
          });
        });
      }
        

  
  listFirstTenUsers() {
    return new Promise((resolve, reject) => {
      this.validateUser(LDAP_USER, LDAP_USER_PASSWORD).then(() => {
        let base;
        if (ENV === "dev") {
          base = "OU=Cuentas de Usuarios,DC=retec,DC=local";
        } else if (ENV === "production") {
          base = "OU=Cuentas de Usuarios,DC=onpe,DC=gob.pe";
        } else {
          return reject(new Error("Invalid environment or local environment not supported for search"));
        }
  
        const options = {
          scope: 'sub',
          filter: '(objectClass=user)', // Busca todos los objetos de clase 'user'
          sizeLimit: 10 // Limita los resultados a 10 entradas
        };
  
        this.client.search(base, options, (err, res) => {
          if (err) {
            console.error(err);
            return reject(err);
          }
  
          const entries = [];
          res.on('searchEntry', (entry) => {
            entries.push(entry.object);
          });
  
          res.on('end', () => {
            resolve(entries); // Devuelve los usuarios encontrados, hasta un máximo de 10
          });
        });
      }).catch((err) => {
        console.error(err);
        reject(err);
      });
    });
  };
  


}

module.exports = LDAP;

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// export const environment = {
//   production: false,
//   //Segment Developing-
//   URL_SERVICES: 'http://localhost:3031',
//   URL_API_LOGIN: 'http://localhost:3030',
//   KeycodeCaptcha: '6Ld8Z2oeAAAAAKR8fzQCyiSt-sItVnEi2D-xJBie',
//   SECRET_KEY: '5iseN-$2022',
// };

export const environment = {
  production: false,
  //Segment Developing-
  //URL_SERVICES: 'http://localhost:3031',
  URL_SERVICES: 'http://localhost:3033',
  URL_API_LOGIN: 'http://localhost:3030',
  // KeycodeCaptcha: '6LexgQQhAAAAALqVGgiC_ozwEPojwyXCv5rm_lmv',
  // ANGEL
  KeycodeCaptcha: '6LfdFYQqAAAAAJ6H5G9Np-t3QMXEagvunzVqlcfR',
  SECRET_KEY: '5iseN-$2022',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

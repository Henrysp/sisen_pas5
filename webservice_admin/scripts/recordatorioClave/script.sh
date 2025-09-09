#!/bin/bash
cd /var/www/webservice_admin
/home/admsgpel/.nvm/versions/node/v16.14.0/bin/node /var/www/webservice_admin/scripts/recordatorioClave/notifyUsersService.js > /home/admsgpel/logs/logs_recordatorio_clave_$(date +\%Y\%m\%d_\%H\%M\%S).txt 2>&1
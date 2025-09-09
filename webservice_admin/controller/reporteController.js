const appConstants = require('../common/appConstants');
const reporteService = require('../services/reportService');
const logger = require('../server/logger').logger;

const reporteCasillas = async (req, res, next) => {
    try {
        let usuarioRegistro = `${req.user.name} ${req.user.lastname ? req.user.lastname + ' ' : ''}${req.user.second_lastname || ''}`.trim();

        if (appConstants.PROFILE_REGISTER_QUERY === req.user.profile) {
            const result = await reporteService.reporteCasillasConsult(usuarioRegistro, req.query.fechaInicio || null, req.query.fechaFin || null,  req.query.documentType || null, req.query.documentNumber || null);
            
        
            if (result?.length  === 0) {
                res.send(result);
                return res;
            }
                
            if (result) {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=reporteCasillas.xlsx');
                res.send(result);
                return res;
            }
            return res.sendStatus(400);
        } else {
            const result = await reporteService.reporteCasillas(usuarioRegistro, req.query.fechaInicio || null, req.query.fechaFin || null,  req.query.documentType || null, req.query.documentNumber || null);

            if (result?.length  === 0) {
                res.send(result);
                return res;
            }

            if (result) {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=reporteCasillas.xlsx');
                res.send(result);
                return res;
            }
            return res.sendStatus(400);
        }

    } catch (e) {
        logger.error(e);
        return res.sendStatus(400);
    }

}
const reporteNotificaciones = async (req, res, next) => {

    try {
        let usuarioRegistro = `${req.user.name} ${req.user.lastname ? req.user.lastname + ' ' : ''}${req.user.second_lastname || ''}`.trim();
        const result = await reporteService.reporteNotificaciones(usuarioRegistro, req.query.fechaInicio || null, req.query.fechaFin || null, req.query.documentType || null, req.query.documentNumber || null);
        
        
        if (result?.length  === 0) {
            res.send(result);
            return res;
        }

        if (result) {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=reporteCasillas.xlsx');
            res.send(result);
            return res;
        }
        return res.sendStatus(400);
    } catch (e) {
        logger.error(e);
        return res.sendStatus(400);
    }

}
const reporteUsuarios = async (req, res, next) => {

    try {
        let usuarioRegistro = `${req.user.name} ${req.user.lastname ? req.user.lastname + ' ' : ''}${req.user.second_lastname || ''}`.trim();
        const result = await reporteService.reporteUsuarios(usuarioRegistro, req.query.fechaInicio || null, req.query.fechaFin || null, req.query.documentType || null, req.query.documentNumber || null);
        
        
        if (result?.length  === 0) {
            res.send(result);
            return res;
        }

        if (result) {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=reporteUsuarios.xlsx');
            res.send(result);
            return res;
        }
        return res.sendStatus(400);
    } catch (e) {
        logger.error(e);
        return res.sendStatus(400);
    }

}
const reporteUsuariosHistorico = async (req, res, next) => {

    try {
        let usuarioRegistro = `${req.user.name} ${req.user.lastname ? req.user.lastname + ' ' : ''}${req.user.second_lastname || ''}`.trim();
        const result = await reporteService.reporteUsuariosHistorico(usuarioRegistro, req.query.fechaInicio || null, req.query.fechaFin || null, req.query.documentType || null, req.query.documentNumber || null);
        
        
        if (result?.length  === 0) {
            res.send(result);
            return res;
        }

        if (result) {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=reporteUsuariosHistorico.xlsx');
            res.send(result);
            return res;
        }
        return res.sendStatus(400);
    } catch (e) {
        logger.error(e);
        return res.sendStatus(400);
    }

}
module.exports = {reporteCasillas, reporteNotificaciones, reporteUsuarios, reporteUsuariosHistorico};

import { Controller, Logger, Res, Get, Header, Param } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { EventHistory, EventHistoryDocument } from '../schemas/eventHistory.schema';
import { Model } from 'mongoose';
import { PdfManagerService } from '../services/pdfManager.service';

@Controller()
export class PdfManagerController {
  private readonly logger = new Logger(PdfManagerController.name);

  constructor(
    @InjectModel(EventHistory.name)
    private eventHistoryModel: Model<EventHistoryDocument>,
    private pdfManagerService: PdfManagerService,
  ) {}

  @Get('generate-pdf/:type/:id')
  @Header('Content-Type', 'application/pdf')
  async generatePdf(@Param() params: any, @Res() res): Promise<void> {
    //console.log(params);
    //console.log(params.id);
    // console.log('En cotroller ...');
    const buffer = await this.pdfManagerService.generatePdf(params.type, params.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attached; filename=' + this.pdfManagerService.fileName,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('download-pdf/:type/:inboxId')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(@Param() params: any, @Res() res): Promise<void> {
    //console.log(params);
    //console.log(params.id);
    const buffer = await this.pdfManagerService.getPdfGenerated(params.inboxId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attached; filename=' + this.pdfManagerService.fileName,
      //'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('solicitud-de-casilla/download-pdf/:inboxId')
  @Header('Content-Type', 'application/pdf')
  async downloadPdfByName(@Param() params: any, @Res() res): Promise<any> {
    //console.log(params);

    const buffer = await this.pdfManagerService.getPdfGenerated(params.inboxId);
    //console.log('buffer?.length :', buffer?.length);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attached; filename=' + this.pdfManagerService?.fileName,
      'Content-Length': buffer?.length,
    });
    res.end(buffer);
  }

  @Get('show-pdf/:inboxId')
  @Header('Content-Type', 'application/pdf')
  async showPdf(@Param() params: any, @Res() res): Promise<void> {
    const buffer = await this.pdfManagerService.getPdfGeneratedById(params.inboxId);
    res.set({
      'Content-Type': 'application/pdf',
      //'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  registerLog(event, collection, idCollection, idUsuario, sent_to, status, motivo, idRepresentante = null) {
    const event_history = {
      event: event,
      collection: collection,
      id: idCollection,
      idUsuario: idUsuario !== null ? idUsuario : null,
      idRepresentante: idRepresentante,
      sent_to: sent_to,
      status: status,
      motivo: motivo,
      date: new Date(),
    };

    //console.log('registering log', event_history);
    this.eventHistoryModel.insertMany(event_history);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ElectoralProcessService } from '../services/electoral-process.service';
import { ElectoralProcessDocument } from '../schemas/electoralProcess.schema';
import { CreateElectoralProcessRequestDto } from '../dto/create-electoral-process.request.dto';
import { UpdateElectoralProcessRequestDto } from '../dto/update-electoral-process.request.dto';

@Controller('/electoral-process')
export class ElectoralProcessController {
  constructor(private readonly electoralProcessService: ElectoralProcessService) {}

  @Get()
  async getAllProcesses(@Query() queryParams: Record<string, any>): Promise<ElectoralProcessDocument[]> {
    return this.electoralProcessService.getAllProcesses(queryParams);
  }
  /* @Get()
  async getWhereProcesses(@Query() queryParams: Record<string, any>): Promise<ElectoralProcessDocument[]> {
    return this.electoralProcessService.getWhereProcesses(queryParams);
  } */

  @Get(':id')
  async getProcessById(@Param('id') id: string): Promise<ElectoralProcessDocument | null> {
    return this.electoralProcessService.getProcessById(id);
  }

  @Post()
  async createProcess(@Body() createProcessDto: CreateElectoralProcessRequestDto): Promise<ElectoralProcessDocument> {
    console.log('Se está creando un proceso');
    return this.electoralProcessService.createProcess(createProcessDto);
  }

  @Put(':id')
  async updateProcess(
    @Param('id') id: string,
    @Body() updateProcessDto: UpdateElectoralProcessRequestDto,
  ): Promise<ElectoralProcessDocument | null> {
    return this.electoralProcessService.updateProcess(id, updateProcessDto);
  }

  @Delete(':id')
  async deleteProcess(@Param('id') id: string): Promise<ElectoralProcessDocument | null> {
    return this.electoralProcessService.deleteProcess(id);
  }
}

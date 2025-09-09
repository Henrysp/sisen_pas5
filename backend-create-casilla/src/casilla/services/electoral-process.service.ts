import { InjectModel } from '@nestjs/mongoose';
import { ElectoralProcess, ElectoralProcessDocument } from '../schemas/electoralProcess.schema';
import { Model } from 'mongoose';
import { UpdateElectoralProcessRequestDto } from '../dto/update-electoral-process.request.dto';
import { CreateElectoralProcessRequestDto } from '../dto/create-electoral-process.request.dto';
import { DuplicatedRecordException } from '../exceptions/duplicated-record.exception';
import { BadRequestException } from '@nestjs/common';

export class ElectoralProcessService {
  constructor(
    @InjectModel(ElectoralProcess.name)
    private electoralProcessModel: Model<ElectoralProcessDocument>,
  ) {}

  async getAllProcesses(filter?: Record<string, any>): Promise<ElectoralProcessDocument[]> {
    //console.log('getAllProcesses:');
    console.log('filter:', filter);

    if (filter?.status === 'active') {
      console.log('filter.status:', filter.status);
      filter.status = 1;
      return await this.electoralProcessModel.find(filter).exec();
    } else {
      return await this.electoralProcessModel.find().exec();
      //throw new BadRequestException(`El valor del campo 'status' es inválido`);
    }
  }
  async getWhereProcesses(filter?: Record<string, any>): Promise<ElectoralProcessDocument[]> {
    console.log('filter:', filter);
    if (filter.state === 'active') {
      filter.state = 1;
    }
    return await this.electoralProcessModel.find(filter).exec();
  }

  async getProcessById(id: string): Promise<ElectoralProcessDocument | null> {
    return await this.electoralProcessModel.findById(id).exec();
  }

  async createProcess(createProcessDto: CreateElectoralProcessRequestDto): Promise<ElectoralProcessDocument> {
    try {
      const createdProcess = new this.electoralProcessModel(createProcessDto);
      return await createdProcess.save();
    } catch (error) {
      console.log('error.:', error);
      console.log('error.errors:', error.errors);
      if (error.errors.name) {
        throw new DuplicatedRecordException(error.errors.name.properties.message);
      } else if (error.errors.shortName) {
        throw new DuplicatedRecordException(error.errors.shortName.properties.message);
      }
      //console.log(error.op);
      // return { ...error, errmsg: error.errmsg, op: error.errmsg };
      return error;
    }
  }

  async updateProcess(
    id: string,
    updateProcessDto: UpdateElectoralProcessRequestDto,
  ): Promise<ElectoralProcessDocument | null> {
    return await this.electoralProcessModel.findByIdAndUpdate(id, updateProcessDto, { new: true }).exec();
  }

  async deleteProcess(id: string): Promise<ElectoralProcessDocument | null> {
    return await this.electoralProcessModel.findByIdAndRemove(id).exec();
  }
}

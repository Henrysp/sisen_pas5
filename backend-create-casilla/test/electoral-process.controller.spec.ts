import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ElectoralProcessController } from '../src/casilla/controllers/electoralProcess.controller';
import { ElectoralProcessService } from '../src/casilla/services/electoral-process.service';

describe('ElectoralProcessController', () => {
  let controller: ElectoralProcessController;

  const mockElectoralProcessService = {
    getAllProcesses: jest.fn(),
    getProcessById: jest.fn(),
    createProcess: jest.fn(),
    updateProcess: jest.fn(),
    deleteProcess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectoralProcessController],
      providers: [
        ElectoralProcessService,
        { provide: getModelToken('ElectoralProcess'), useValue: mockElectoralProcessService },
      ],
    }).compile();

    controller = module.get<ElectoralProcessController>(ElectoralProcessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all electoral processes', async () => {
    const result = [{ /* mock data */ }];
    jest.spyOn(mockElectoralProcessService, 'getAllProcesses').mockResolvedValue(result);

    expect(await controller.getAllProcesses()).toBe(result);
  });

  // Similar tests for other controller methods
});

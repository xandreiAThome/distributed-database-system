import { Test, TestingModule } from '@nestjs/testing';
import { ReplicationController } from './replication.controller';

describe('ReplicationController', () => {
  let controller: ReplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReplicationController],
    }).compile();

    controller = module.get<ReplicationController>(ReplicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

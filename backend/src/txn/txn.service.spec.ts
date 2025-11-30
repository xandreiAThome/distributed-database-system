import { Test, TestingModule } from '@nestjs/testing';
import { TxnService } from './txn.service';

describe('TxnService', () => {
  let service: TxnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TxnService],
    }).compile();

    service = module.get<TxnService>(TxnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { ApiProperty } from '@nestjs/swagger';

export class SyncResultDto {
  @ApiProperty({
    description: 'Node identifier',
  })
  nodeId: string;

  @ApiProperty({
    description: 'Whether the sync was successful',
  })
  success: boolean;

  @ApiProperty({
    description: 'Number of records synced',
  })
  recordsCount: number;

  @ApiProperty({
    description: 'Error message if sync failed',
    required: false,
  })
  error?: string;
}

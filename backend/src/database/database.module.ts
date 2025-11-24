import { Module } from '@nestjs/common';
import { DatabaseAsyncProvider, databaseProvider } from './database.provider';

@Module({
  providers: [...databaseProvider],
  exports: [DatabaseAsyncProvider],
})
export class DatabaseModule {}

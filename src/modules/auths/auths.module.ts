import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [AuthsController],
  providers: [AuthsService],
  exports: [AuthsService],
})
export class AuthsModule {}

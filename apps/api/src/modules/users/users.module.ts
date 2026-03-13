import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SharedModule } from '../shared/shared.module';
import { AuthsModule } from '../auths/auths.module';

@Module({
  imports: [SharedModule, AuthsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

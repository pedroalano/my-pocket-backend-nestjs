import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class AuthsService {
  constructor(private readonly prisma: PrismaService) {}
}

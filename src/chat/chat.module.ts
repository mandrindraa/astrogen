import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [PrismaModule, ConfigModule.forRoot()],
  providers: [ChatService],
  controllers: [ChatController]
})
export class ChatModule {}

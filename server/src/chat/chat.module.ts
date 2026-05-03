import { Module } from '@nestjs/common';
import { ChatsService } from './chat.service';
import { ChatsController } from './chat.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [ChatsController],
    providers: [ChatsService, PrismaService],
})
export class ChatsModule { }
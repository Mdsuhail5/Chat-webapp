import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
    constructor(private prisma: PrismaService) { }

    async getChats() {
        return this.prisma.chat.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                Message: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    async createChat(user1Id: string, user2Id: string) {
        const chatId = [user1Id, user2Id].sort().join('-');

        const chat = await this.prisma.chat.upsert({
            where: { id: chatId },
            update: {},
            create: { id: chatId },
        });

        return chat;
    }
}
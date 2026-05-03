import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    async getMessages(chatId: string) {
        return this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
            include: {
                User: true, // 🔥 this adds user info
            },
        });
    }
}
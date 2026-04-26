import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
// chat.gateway.ts
import { Message } from '@prisma/client';
import { randomUUID } from 'crypto'; // add this

// ✅ Strong typing (no "any")
interface MessageData {
  content: string;
  chatId: string;
  senderId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private prisma: PrismaService) { }

  // ✅ Fix: definite assignment
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log('User connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('User disconnected:', client.id);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: MessageData,
    @ConnectedSocket() client: Socket,
  ) {
    const { content, chatId, senderId } = data;

    // Optional: Auto-create dummy User & Chat so foreign key constraints don't fail for this quick demo
    await this.prisma.user.upsert({
      where: { id: senderId },
      update: {},
      create: { id: senderId, name: 'Demo User' },
    });
    await this.prisma.chat.upsert({
      where: { id: chatId },
      update: {},
      create: { id: chatId },
    });

    // ✅ Strongly typed Prisma result
    const message: Message = await this.prisma.message.create({
      data: {
        id: randomUUID(), // ✅ required — no @default(uuid()) in schema
        content,
        chatId,
        senderId,
      },
    });
    this.server.emit('receive_message', message);
  }
}
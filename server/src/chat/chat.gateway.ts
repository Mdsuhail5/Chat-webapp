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
  private onlineUsers = new Map<string, string>();
  // userId -> socketId
  // ✅ Fix: definite assignment
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log('User connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('User disconnected:', client.id);
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
      }
    }
    this.server.emit("online_users", Array.from(this.onlineUsers.keys()));
  }

  @SubscribeMessage("user_online")
  handleUserOnline(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket
  ) {
    this.onlineUsers.set(userId, client.id);
    this.server.emit("online_users", Array.from(this.onlineUsers.keys()));
  }

  @SubscribeMessage("typing")
  handleTyping(
    @MessageBody() data: { chatId: string; senderId: string }
  ) {
    this.server.emit("typing", data);
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
    const message = await this.prisma.message.create({
      data: {
        content,
        chatId,
        senderId,
        status: "sent",
      },
      include: {
        User: true, // 🔥 THIS FIXES YOUR UI
      },
    });
    this.server.emit("receive_message", message);

    // 🔥 update to delivered
    await this.prisma.message.update({
      where: { id: message.id },
      data: { status: "delivered" },
    });
  }
  @SubscribeMessage("mark_read")
  async handleRead(@MessageBody() data: any) {
    const { chatId } = data;

    await this.prisma.message.updateMany({
      where: { chatId },
      data: { status: "read" },
    });

    this.server.emit("messages_read", chatId);
  }
}
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatGateway } from './chat/chat.gateway';
import { PrismaModule } from './prisma/prisma.module';
import { MessagesModule } from './messages/messages.module';
import { ChatsModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
@Module({
  imports: [AuthModule, PrismaModule, MessagesModule, ChatsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule { }

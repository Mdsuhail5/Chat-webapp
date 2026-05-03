import { Controller, Get } from '@nestjs/common';
import { ChatsService } from './chat.service';
import { Post, Body } from '@nestjs/common';
@Controller('chats')
export class ChatsController {
    constructor(private chatsService: ChatsService) { }

    @Get()
    getChats() {
        return this.chatsService.getChats();
    }

    @Post()
    createChat(
        @Body('user1Id') user1Id: string,
        @Body('user2Id') user2Id: string
    ) {
        return this.chatsService.createChat(user1Id, user2Id);
    }
}
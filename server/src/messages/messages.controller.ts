import { Controller, Get, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
    constructor(private messagesService: MessagesService) { }

    @Get()
    getMessages(@Query('chatId') chatId: string) {
        return this.messagesService.getMessages(chatId);
    }
}
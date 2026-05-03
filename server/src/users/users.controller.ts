import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post()
    createUser(@Body('name') name: string) {
        return this.usersService.createUser(name);
    }

    @Get()
    getUsers() {
        return this.usersService.getUsers();
    }
}
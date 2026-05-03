import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async createUser(name: string) {
        return this.prisma.user.create({
            // Assuming generating a random uuid for id since it's required by your schema
            data: { id: Date.now().toString(), name },
        });
    }

    async getUsers() {
        return this.prisma.user.findMany();
    }
}
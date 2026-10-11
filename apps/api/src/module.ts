import {Module,Injectable,OnModuleDestroy} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {PrismaClient} from '@prisma/client';
import {AuthController,AuthService,AuthGuard} from './auth';
import {InvitationsController,InvitationsService} from './invitations';
@Injectable() export class Database extends PrismaClient implements OnModuleDestroy {async onModuleDestroy(){await this.$disconnect()}}
@Module({imports:[JwtModule.register({global:true,secret:process.env.JWT_SECRET,signOptions:{expiresIn:'7d'}})],controllers:[AuthController,InvitationsController],providers:[Database,AuthService,AuthGuard,InvitationsService]})
export class AppModule {constructor(){if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw new Error('Set a strong JWT_SECRET in .env');}}

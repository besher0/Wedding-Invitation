import {Body,CanActivate,Controller,ExecutionContext,Injectable,Post,Get,Req,UseGuards,UnauthorizedException,ConflictException,HttpCode} from '@nestjs/common';
import {IsEmail,IsString,MinLength,MaxLength} from 'class-validator';
import {JwtService} from '@nestjs/jwt';
import {hash,compare} from 'bcryptjs';
import {Database} from './database';
import {Request} from 'express';
export type AuthedRequest = Request & {userId:string};
export class Credentials {
 @IsEmail() @MaxLength(254) email!:string;
 @IsString() @MinLength(8) @MaxLength(128) password!:string;
}
@Injectable() export class AuthService {
 constructor(private db:Database,private jwt:JwtService){}
 async register(dto:Credentials){
  const email=dto.email.trim().toLowerCase();
  try{const u=await this.db.user.create({data:{email,passwordHash:await hash(dto.password,12)}});return {token:await this.jwt.signAsync({sub:u.id}),user:{id:u.id,email:u.email}};}
  catch(e:any){if(e?.code==='P2002')throw new ConflictException('Email in use');throw e;}
 }
 async login(dto:Credentials){
  const u=await this.db.user.findUnique({where:{email:dto.email.trim().toLowerCase()}});
  if(!u||!await compare(dto.password,u.passwordHash))throw new UnauthorizedException('Invalid credentials');
  return {token:await this.jwt.signAsync({sub:u.id}),user:{id:u.id,email:u.email}};
 }
}
@Injectable() export class AuthGuard implements CanActivate {
 constructor(private jwt:JwtService){}
 async canActivate(ctx:ExecutionContext){
  const req=ctx.switchToHttp().getRequest<AuthedRequest>();
  const h=req.headers.authorization||'';
  if(!h.startsWith('Bearer '))throw new UnauthorizedException();
  try{const p=await this.jwt.verifyAsync<{sub:string}>(h.slice(7));if(!p.sub)throw new Error();req.userId=p.sub;return true;}
  catch{throw new UnauthorizedException();}
 }
}
@Controller('auth') export class AuthController {
 constructor(private auth:AuthService,private db:Database){}
 @Post('register') register(@Body() dto:Credentials){return this.auth.register(dto)}
 @Post('login') @HttpCode(200) login(@Body() dto:Credentials){return this.auth.login(dto)}
 @Get('me') @UseGuards(AuthGuard) me(@Req() req:AuthedRequest){return this.db.user.findUnique({where:{id:req.userId},select:{id:true,email:true}})}
}

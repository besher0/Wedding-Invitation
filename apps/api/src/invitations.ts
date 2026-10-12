import {Body,Controller,Get,Post,Patch,Delete,Param,Req,UseGuards,Injectable,NotFoundException,BadRequestException} from '@nestjs/common';
import {IsIn,IsObject,IsString,IsOptional,MaxLength} from 'class-validator';
import {Prisma} from '@prisma/client';
import {randomUUID} from 'crypto';
import {Database} from './database';
import {AuthGuard,AuthedRequest} from './auth';
class CreateDto {
 @IsString() @MaxLength(160) title!:string;
 @IsIn(['rose','gold','night']) theme!:string;
 @IsObject() content!:Record<string,unknown>;
}
class UpdateDto {
 @IsOptional() @IsString() @MaxLength(160) title?:string;
 @IsOptional() @IsIn(['rose','gold','night']) theme?:string;
 @IsOptional() @IsObject() content?:Record<string,unknown>;
}
function checked(content:Record<string,unknown>):Prisma.InputJsonObject {
 const allowed=new Set(['groom','bride','groomFamily','brideFamily','intro','invitedBy','date','time','venue','address','mapUrl','gpsLocation','musicUrl']);
 for(const [k,v] of Object.entries(content)){if(!allowed.has(k)||typeof v!=='string'||v.length>1000)throw new BadRequestException('Invalid invitation content');}
 return content as Prisma.InputJsonObject;
}
@Injectable() export class InvitationsService {
 constructor(private db:Database){}
 list(ownerId:string){return this.db.invitation.findMany({where:{ownerId},orderBy:{createdAt:'desc'}})}
 async owned(id:string,ownerId:string){const i=await this.db.invitation.findFirst({where:{id,ownerId}});if(!i)throw new NotFoundException();return i;}
 create(ownerId:string,d:CreateDto){return this.db.invitation.create({data:{ownerId,title:d.title,theme:d.theme,content:checked(d.content),slug:'invite-'+randomUUID()}})}
 async update(id:string,ownerId:string,d:UpdateDto){await this.owned(id,ownerId);return this.db.invitation.update({where:{id},data:{title:d.title,theme:d.theme,...(d.content?{content:checked(d.content)}:{})}})}
 async remove(id:string,ownerId:string){await this.owned(id,ownerId);await this.db.invitation.delete({where:{id}});return {deleted:true}}
 async publish(id:string,ownerId:string,publish:boolean){await this.owned(id,ownerId);return this.db.invitation.update({where:{id},data:{status:publish?'PUBLISHED':'DRAFT',publishedAt:publish?new Date():null}})}
 async publicBySlug(slug:string){const i=await this.db.invitation.findFirst({where:{slug,status:'PUBLISHED'},select:{slug:true,title:true,theme:true,content:true}});if(!i)throw new NotFoundException();return i;}
}
@Controller('invitations') export class InvitationsController {
 constructor(private service:InvitationsService){}
 @Get('public/:slug') public(@Param('slug') slug:string){return this.service.publicBySlug(slug)}
 @Get() @UseGuards(AuthGuard) list(@Req() r:AuthedRequest){return this.service.list(r.userId)}
 @Get(':id') @UseGuards(AuthGuard) one(@Param('id') id:string,@Req() r:AuthedRequest){return this.service.owned(id,r.userId)}
 @Post() @UseGuards(AuthGuard) create(@Body() d:CreateDto,@Req() r:AuthedRequest){return this.service.create(r.userId,d)}
 @Patch(':id') @UseGuards(AuthGuard) update(@Param('id') id:string,@Body() d:UpdateDto,@Req() r:AuthedRequest){return this.service.update(id,r.userId,d)}
 @Delete(':id') @UseGuards(AuthGuard) remove(@Param('id') id:string,@Req() r:AuthedRequest){return this.service.remove(id,r.userId)}
 @Post(':id/publish') @UseGuards(AuthGuard) publish(@Param('id') id:string,@Req() r:AuthedRequest){return this.service.publish(id,r.userId,true)}
 @Post(':id/unpublish') @UseGuards(AuthGuard) unpublish(@Param('id') id:string,@Req() r:AuthedRequest){return this.service.publish(id,r.userId,false)}
}

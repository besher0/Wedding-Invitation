import {Controller,Get,ServiceUnavailableException} from '@nestjs/common';
import {Database} from './database';
@Controller('health')
export class HealthController {
 constructor(private readonly db:Database){}
 @Get('live') live(){return {status:'ok'};}
 @Get('ready') async ready(){
  try { await this.db.$queryRaw`SELECT 1`; return {status:'ready',database:'connected'}; }
  catch {throw new ServiceUnavailableException('Database unavailable');}
 }
}

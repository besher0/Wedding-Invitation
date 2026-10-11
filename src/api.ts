import type {Invitation,Theme} from './data';
const BASE=(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/,'');
export type RemoteInvitation={id:string;slug:string;title:string;theme:Theme;status:'DRAFT'|'PUBLISHED';content:Record<string,string>};
export type Session={token:string;user:{id:string;email:string}};
export async function api<T>(path:string,method='GET',data?:unknown,token?:string):Promise<T>{
 const response=await fetch(BASE+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:data===undefined?undefined:JSON.stringify(data)});
 const payload=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(Array.isArray(payload?.message)?payload.message.join('، '):payload?.message||'تعذر الاتصال بالخادم');
 return payload as T;
}
export function payload(i:Invitation){return {title:i.title||'دعوة زفاف',theme:i.theme,content:{groom:i.groom,bride:i.bride,intro:i.intro,invitedBy:i.invitedBy,date:i.date,time:i.time,venue:i.venue,address:i.address,mapUrl:i.mapUrl}}}
export function fromRemote(r:RemoteInvitation):Invitation{return {id:r.id,title:r.title,theme:r.theme,groom:r.content.groom||'',bride:r.content.bride||'',intro:r.content.intro||'',invitedBy:r.content.invitedBy||'',date:r.content.date||'',time:r.content.time||'',venue:r.content.venue||'',address:r.content.address||'',mapUrl:r.content.mapUrl||'',musicName:'',createdAt:''}}

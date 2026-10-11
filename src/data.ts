export type Theme = 'rose' | 'gold' | 'night';
export type Invitation = {
  id: string; title: string; groom: string; bride: string; intro: string; invitedBy: string;
  date: string; time: string; venue: string; address: string; mapUrl: string;
  theme: Theme; musicName: string; createdAt: string;
};
export const themes: Record<Theme,{label:string,caption:string}> = {
  rose:{label:'زهور الورد',caption:'وردي هادئ'},
  gold:{label:'ليلة ذهبية',caption:'ذهبي ملكي'},
  night:{label:'نجوم الليل',caption:'داكن أنيق'}
};
export const starter: Invitation = {
 id:'demo',title:'دعوة زفافنا',groom:'علي',bride:'رزان',
 intro:'بكل الحب والفرح، نتشرف بدعوتكم لمشاركتنا أجمل لحظات العمر',
 invitedBy:'تتشرف عائلتا العروسين بدعوتكم لحضور حفل الزفاف',
 date:'2026-11-20',time:'19:00',venue:'قاعة الأفراح',address:'عنوان القاعة هنا',
 mapUrl:'',theme:'rose',musicName:'',createdAt:new Date().toISOString()
};
export function loadInvitations():Invitation[] { try {const raw=localStorage.getItem('wedding-invitations-v1');const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[]} catch{return []}}
export function saveInvitations(items:Invitation[]) {try{localStorage.setItem('wedding-invitations-v1',JSON.stringify(items))}catch{}}

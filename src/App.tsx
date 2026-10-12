import {useEffect,useMemo,useRef,useState} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {ArrowLeft,ArrowRight,CalendarDays,Check,ChevronDown,Copy,ExternalLink,Heart,MapPin,Menu,Music2,Pause,Play,Plus,Save,Share2,Sparkles,Volume2,VolumeX,X} from 'lucide-react';
import {Invitation,loadInvitations,saveInvitations,starter,Theme,themes} from './data';

type Page='home'|'templates'|'editor'|'dashboard';
function uid(){return typeof crypto!=='undefined' && 'randomUUID' in crypto?crypto.randomUUID():String(Date.now())}
function dateText(d:string){if(!d)return 'حدّد التاريخ';const t=new Date(d+'T12:00:00');return isNaN(t.getTime())?'حدّد التاريخ':t.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
export function InvitePreview({invite,compact=false,musicUrl}:{invite:Invitation,compact?:boolean,musicUrl?:string}){
 const [open,setOpen]=useState(false);const [playing,setPlaying]=useState(false);
 const audio=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{setOpen(false);setPlaying(false);audio.current?.pause()},[invite.theme,invite.id]);
 const start=async()=>{setOpen(true);if(audio.current&&musicUrl){try{await audio.current.play();setPlaying(true)}catch{setPlaying(false)}}};
 const toggle=async()=>{if(!audio.current)return;if(playing){audio.current.pause();setPlaying(false)}else{try{await audio.current.play();setPlaying(true)}catch{setPlaying(false)}}};
 return <div className={`invitation invitation--${invite.theme} ${compact?'invitation--compact':''}`}>
  {musicUrl && <audio ref={audio} src={musicUrl} loop preload="none" />}
  <AnimatePresence mode="wait">
   {!open?<motion.div key="cover" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:1.06}} className="invitation-cover">
    <div className="ornament">✦ &nbsp; ❀ &nbsp; ✦</div><span className="overline">دعوة خاصة لكم</span>
    <div className="envelope"><Heart size={30} strokeWidth={1.1}/></div>
    <h2>{invite.groom||'العريس'} <span>و</span> {invite.bride||'العروس'}</h2>
    <button className="open-invite" onClick={start}>افتح الدعوة <Heart size={15}/></button>
    <span className="microcopy">لحظات الفرح أجمل بحضوركم</span>
   </motion.div>:<motion.div key="inside" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="invitation-inside">
    <span className="ornament">✧ ❀ ✧</span><span className="overline">بسم الله الرحمن الرحيم</span>
    <p className="invited-by">{invite.invitedBy}</p><h2>{invite.groom||'العريس'} <span>و</span> {invite.bride||'العروس'}</h2>
    <p className="intro">{invite.intro}</p><div className="ornament-line">❀</div>
    <div className="invite-detail"><CalendarDays size={18}/><span>{dateText(invite.date)}</span></div>
    <div className="invite-detail"><span>الساعة {invite.time||'—'}</span></div>
    <div className="invite-detail"><MapPin size={18}/><span>{invite.venue||'اسم القاعة'}</span></div>
    <small>{invite.address}</small>
    {invite.mapUrl?.startsWith('https://')&&<a href={invite.mapUrl} target="_blank" rel="noreferrer" className="map-link">عرض الموقع على الخريطة <ExternalLink size={13}/></a>}
    <p className="closing">بانتظاركم بكل الحب ♡</p>
    {musicUrl&&<button className="music-control" onClick={toggle} aria-label={playing?'إيقاف الموسيقى':'تشغيل الموسيقى'}>{playing?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>}
    <button className="restart" onClick={()=>{setOpen(false);audio.current?.pause();setPlaying(false)}}>العودة للغلاف</button>
   </motion.div>}
  </AnimatePresence>
 </div>
}
const fields:[keyof Invitation,string,'text'|'date'|'time'|'textarea'|'url'][]=[
 ['groom','اسم العريس','text'],['bride','اسم العروس','text'],['intro','مقدمة الدعوة','textarea'],['invitedBy','من يتقدم بالدعوة','textarea'],['date','تاريخ الزفاف','date'],['time','وقت الحفل','time'],['venue','اسم القاعة','text'],['address','عنوان القاعة','text'],['mapUrl','رابط خرائط Google','url']];
export default function App(){
 const [page,setPage]=useState<Page>('home');const [menu,setMenu]=useState(false);
 const [items,setItems]=useState<Invitation[]>(loadInvitations);const [invite,setInvite]=useState<Invitation>({...starter});
 const [musicUrl,setMusicUrl]=useState('');const [showSaved,setShowSaved]=useState(false);const [copied,setCopied]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);
 const count=items.length;
 useEffect(()=>{saveInvitations(items)},[items]);
 useEffect(()=>()=>{if(musicUrl)URL.revokeObjectURL(musicUrl)},[musicUrl]);
 function navigate(next:Page){setPage(next);setMenu(false);window.scrollTo({top:0,behavior:'smooth'})}
 function editNew(theme:Theme='rose'){setInvite({...starter,id:uid(),theme,createdAt:new Date().toISOString()});setMusicUrl('');navigate('editor')}
 function editExisting(item:Invitation){setInvite({...item});setMusicUrl('');navigate('editor')}
 function save(){const existing=items.some(it=>it.id===invite.id);setItems(old=>existing?old.map(it=>it.id===invite.id?invite:it):[invite,...old]);setShowSaved(true);setTimeout(()=>setShowSaved(false),2500)}
 const update=(key:keyof Invitation,value:string)=>setInvite(i=>({...i,[key]:value}));
 const totalFields=useMemo(()=>fields.filter(f=>String(invite[f[0]]||'').trim()).length,[invite]);
 function share(){if(navigator.share){navigator.share({title:'دعوتنا',text:'دعوة زفافنا'}).catch(()=>{})}else{navigator.clipboard?.writeText(window.location.href).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1800)})}}
 return <div className="app">
 <header className="site-header"><button className="brand" onClick={()=>navigate('home')}><span className="brand-mark">✳</span> ليلتنا <small>كل قصة حب تستحق دعوة</small></button>
 <nav className={menu?'nav open':'nav'}><button onClick={()=>navigate('home')}>الرئيسية</button><button onClick={()=>navigate('templates')}>القوالب</button><button onClick={()=>navigate('dashboard')}>دعواتي {count>0&&<em>{count}</em>}</button></nav>
 <button className="primary header-cta" onClick={()=>editNew()}>صمم دعوتك <ArrowLeft size={16}/></button><button className="mobile-menu" onClick={()=>setMenu(!menu)} aria-label="القائمة">{menu?<X/>:<Menu/>}</button>
 </header>
 {page==='home'&&<><main className="hero"><div className="hero-copy"><span className="eyebrow"><Sparkles size={16}/> لأن التفاصيل الصغيرة تصنع فرحاً كبيراً</span><h1>ليلة العمر تبدأ <span>بدعوة تليق بها</span></h1><p>صمّم دعوة زفاف إلكترونية تنبض بالحب، اختر التصميم الذي يشبه قصتك، أضف أسماءكم وتفاصيل الفرح، وشاركها مع من تحب.</p><div className="hero-actions"><button className="primary big" onClick={()=>navigate('templates')}>استكشف التصاميم <ArrowLeft size={18}/></button><button className="ghost big" onClick={()=>editNew()}>جرّب المحرر مجاناً <ArrowLeft size={17}/></button></div><div className="hero-notes"><span><Check/> تصاميم متحركة</span><span><Check/> تعديل مباشر</span><span><Check/> مناسبة للجوال</span></div></div><div className="hero-art"><div className="art-ring"/><div className="hero-card"><InvitePreview invite={starter} compact /></div><span className="floating flower-one">✿</span><span className="floating flower-two">✧</span></div></main>
 <section className="features"><div><span>01</span><h3>اختر تصميماً</h3><p>قوالب بلمسات مختلفة تناسب ذوقك</p></div><div><span>02</span><h3>أضف تفاصيل فرحك</h3><p>الأسماء، الموعد، المكان والكلمات الخاصة</p></div><div><span>03</span><h3>شاهد النتيجة</h3><p>معاينة متحركة مباشرة قبل النشر</p></div></section>
 <section className="section" id="templates"><div className="section-heading"><div><span className="eyebrow">قوالب تناسب كل قصة</span><h2>اختَر ما يشبه فرحتكم</h2></div><button className="text-button" onClick={()=>navigate('templates')}>عرض كل القوالب <ArrowLeft size={16}/></button></div><TemplateGrid onSelect={editNew}/></section><section className="bottom-banner"><span>✦</span><h2>دعوتكم، بطريقتكم.</h2><p>ابدأ الآن وخلّي أول لحظة من فرحتكم مميزة.</p><button className="primary big" onClick={()=>editNew()}>ابدأ التصميم <ArrowLeft size={17}/></button></section></>}
 {page==='templates'&&<main className="section page-section"><div className="center-heading"><span className="eyebrow">مجموعة ليلتنا</span><h1>تصاميم تحكي حكايتكم</h1><p>اختر قالباً وابدأ تخصيصه على ذوقك. كل قالب يتضمن معاينة متحركة.</p></div><TemplateGrid onSelect={editNew}/></main>}
 {page==='dashboard'&&<main className="section page-section"><div className="section-heading"><div><span className="eyebrow">مساحة إبداعك</span><h1>دعواتي</h1><p>المسودات محفوظة محلياً داخل هذا المتصفح.</p></div><button className="primary" onClick={()=>editNew()}><Plus size={17}/> دعوة جديدة</button></div>{items.length===0?<div className="empty"><Heart size={35}/><h3>ما عندك دعوات محفوظة بعد</h3><p>ابدأ بأول تصميم لفرحك واحفظه هون.</p><button className="primary" onClick={()=>navigate('templates')}>اختيار قالب <ArrowLeft size={16}/></button></div>:<div className="dashboard-grid">{items.map(item=><article className="saved-card" key={item.id}><div className={`saved-art theme-${item.theme}`}>✦<h3>{item.groom} و {item.bride}</h3></div><div className="saved-meta"><h3>{item.groom} و {item.bride}</h3><p>{dateText(item.date)}</p><button className="outline" onClick={()=>editExisting(item)}>تعديل الدعوة <ArrowLeft size={15}/></button><button className="delete-button" onClick={()=>{if(window.confirm('حذف هذه الدعوة من المتصفح؟'))setItems(old=>old.filter(it=>it.id!==item.id))}}>حذف</button></div></article>)}</div>}</main>}
 {page==='editor'&&<main className="editor-page"><div className="editor-heading"><div><button className="back" onClick={()=>navigate('templates')}><ArrowRight size={16}/> القوالب</button><h1>صمّم دعوتك</h1><p>كل التفاصيل قابلة للتغيير والمعاينة تحدث مباشرة.</p></div><div className="editor-actions"><button className="outline" onClick={share}><Share2 size={16}/>{copied?'تم النسخ':'مشاركة تجريبية'}</button><button className="primary" onClick={save}><Save size={16}/> حفظ المسودة</button></div></div>
 <div className="editor-layout"><div className="editor-fields"><div className="field-panel"><div className="panel-title"><span className="panel-icon"><Heart size={17}/></span><div><h2>تفاصيل الدعوة</h2><p>{totalFields} من {fields.length} حقول معبأة</p></div></div>
 <div className="fields-grid">{fields.map(([key,label,type])=><label key={key} className={type==='textarea'?'span-all':''}><span>{label}</span>{type==='textarea'?<textarea value={String(invite[key])} onChange={e=>update(key,e.target.value)} rows={3} maxLength={700}/>:<input type={type} value={String(invite[key])} onChange={e=>update(key,e.target.value)} maxLength={type==='url'?1000:140} placeholder={label}/>}</label>)}</div></div>
 <div className="field-panel"><div className="panel-title"><span className="panel-icon"><Sparkles size={18}/></span><div><h2>أسلوب التصميم</h2><p>اختر الألوان وطابع الدعوة</p></div></div><div className="theme-choices">{(Object.keys(themes) as Theme[]).map(theme=><button key={theme} className={`theme-choice theme-${theme} ${invite.theme===theme?'selected':''}`} onClick={()=>setInvite(i=>({...i,theme}))}><span className="swatch">✦</span><strong>{themes[theme].label}</strong><small>{themes[theme].caption}</small>{invite.theme===theme&&<Check size={15}/>}</button>)}</div></div>
 <div className="field-panel"><div className="panel-title"><span className="panel-icon"><Music2 size={18}/></span><div><h2>موسيقى الخلفية</h2><p>تبدأ بعد ضغط الزائر على «افتح الدعوة»</p></div></div><input ref={fileRef} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" hidden onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>15*1024*1024){alert('الحد الأقصى للملف 15 ميغابايت');return}if(musicUrl)URL.revokeObjectURL(musicUrl);setMusicUrl(URL.createObjectURL(f));setInvite(i=>({...i,musicName:f.name}))}}/><button className="upload" onClick={()=>fileRef.current?.click()}><Music2 size={20}/><span>{musicUrl?invite.musicName:'اختر أغنية من جهازك (حتى 15MB)'}</span></button><p className="hint">للنسخة التجريبية فقط: ملف الأغنية لا يُرفع للسيرفر ولا يبقى بعد إعادة تحميل الصفحة. استخدم ملفات تملك حق نشرها.</p></div>
 </div><div className="preview-panel"><div className="preview-title"><div><h2>معاينة الدعوة</h2><p>جرّب فتح الظرف وشاهد الحركة</p></div><span className="live-dot">مباشر</span></div><div className="phone"><div className="phone-camera"/><InvitePreview invite={invite} musicUrl={musicUrl}/></div><p className="preview-note">هذا نموذج تفاعلي يعمل داخل الموقع. النشر برابط عام سيتوفر عند ربط الباك إند.</p></div></div></main>}
 <footer><div className="footer-logo">✳ ليلتنا</div><p>كل قصة حب تستحق بداية جميلة ♡</p><small>نسخة تجريبية — الحفظ في المتصفح فقط، بدون حسابات أو نشر عام</small></footer>
 <AnimatePresence>{showSaved&&<motion.div className="toast" initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}><Check size={17}/> تم حفظ الدعوة على هذا الجهاز</motion.div>}</AnimatePresence>
 </div>
}
function TemplateGrid({onSelect}:{onSelect:(theme:Theme)=>void}){return <div className="template-grid">{(Object.keys(themes) as Theme[]).map((theme,index)=><article className="template-card" key={theme}><div className={`template-art theme-${theme}`}><span className="template-ornament">✧ ❀ ✧</span><span className="template-caption">دعوة زفاف</span><h3>علي <i>و</i> رزان</h3><div className="template-border">✦</div><span className="template-caption">بكل الحب ندعوكم</span></div><div className="template-info"><div><h3>{themes[theme].label}</h3><p>{themes[theme].caption} · قالب متحرك</p></div><button onClick={()=>onSelect(theme)} aria-label={`اختيار ${themes[theme].label}`}><ArrowLeft size={19}/></button></div></article>)}</div>}

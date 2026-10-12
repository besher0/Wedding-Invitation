import {useEffect,useMemo,useRef,useState} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {CalendarDays,MapPin,Heart,ExternalLink,ChevronDown,CalendarPlus} from 'lucide-react';
import type {Invitation} from './data';
import './cinematic.css';

const formatDate=(date:string)=>{if(!date)return 'تاريخ الزفاف';const d=new Date(date+'T12:00:00');return Number.isNaN(+d)?date:d.toLocaleDateString('ar-SY',{day:'numeric',month:'long',year:'numeric',weekday:'long'})};
function calendarDays(date:string){
 const d=date?new Date(date+'T12:00:00'):new Date();
 const valid=Number.isNaN(+d)?new Date():d;
 const first=new Date(valid.getFullYear(),valid.getMonth(),1).getDay();
 const offset=(first+1)%7;
 const count=new Date(valid.getFullYear(),valid.getMonth()+1,0).getDate();
 return {month:valid.toLocaleDateString('ar-SY',{month:'long',year:'numeric'}),selected:date&&!Number.isNaN(+d)?d.getDate():null,days:[...Array(offset).fill(0),...Array.from({length:count},(_,i)=>i+1)]};
}
function saveCalendar(invite:Invitation){
 if(!invite.date)return;
 const start=new Date(invite.date+'T'+(invite.time||'19:00')+':00');
 if(Number.isNaN(+start))return;
 const end=new Date(start.getTime()+3*3600000);
 const utc=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Laylatna//Wedding Invitation//AR','BEGIN:VEVENT','DTSTART:'+utc(start),'DTEND:'+utc(end),'SUMMARY:'+[invite.groom,invite.bride].filter(Boolean).join(' و ')+' - حفل الزفاف','LOCATION:'+(invite.venue||'')+' '+(invite.address||''),'DESCRIPTION:'+(invite.intro||''),'END:VEVENT','END:VCALENDAR'].join('\r\n');
 const blob=new Blob([body],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='wedding-invitation.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function directionsUrl(invite:Invitation):string|null {
 const raw=(invite.gpsLocation||invite.mapUrl||'').trim();
 if(!raw)return null;
 // Accept latitude, longitude (optionally after an @), or a Google Maps URL.
 const coords=raw.match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,،]\s*(-?\d{1,3}(?:\.\d+)?)$/);
 if(coords){
  const lat=Number(coords[1]),lng=Number(coords[2]);
  if(lat>=-90&&lat<=90&&lng>=-180&&lng<=180)return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(lat+','+lng);
  return null;
 }
 try {
  const url=new URL(raw);
  if(url.protocol!=='https:')return null;
  const host=url.hostname.toLowerCase();
  if(host==='maps.app.goo.gl'||host==='goo.gl'||host==='maps.google.com'||host==='www.google.com'||host==='google.com'||host.endsWith('.google.com'))return url.toString();
 }catch{return null}
 return null;
}
export default function CinematicInvite({invite,compact=false}:{invite:Invitation,compact?:boolean}){
 const [opened,setOpened]=useState(false);
 const [autoPlaying,setAutoPlaying]=useState(false);
 const viewport=useRef<HTMLDivElement>(null);
 const autoRef=useRef(false);
 const lastFrame=useRef<number|null>(null);
 const cal=useMemo(()=>calendarDays(invite.date),[invite.date]);
 const mapsDestination=directionsUrl(invite) || (invite.address?.trim() ? 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent([invite.venue,invite.address].filter(Boolean).join('، ')) : null);
 useEffect(()=>{
  if(!opened||compact){setAutoPlaying(false);return;}
  const el=viewport.current;if(!el)return;
  el.scrollTop=0;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const timer=window.setTimeout(()=>{autoRef.current=true;setAutoPlaying(true)},2400);
  return ()=>{window.clearTimeout(timer);autoRef.current=false;lastFrame.current=null};
 },[opened,compact]);
 useEffect(()=>{
  if(!autoPlaying||!opened||compact)return;
  let frame=0;
  const tick=(time:number)=>{
   const el=viewport.current;
   if(!el||document.hidden){lastFrame.current=null;frame=requestAnimationFrame(tick);return}
   if(lastFrame.current!==null){
    const dt=Math.min(time-lastFrame.current,80);
    el.scrollTop+=dt*0.038;
    if(el.scrollTop+el.clientHeight>=el.scrollHeight-4){setAutoPlaying(false);autoRef.current=false;return}
   }
   lastFrame.current=time;frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return ()=>{cancelAnimationFrame(frame);lastFrame.current=null};
 },[autoPlaying,opened,compact]);
 const manualStop=()=>{if(autoRef.current){autoRef.current=false;setAutoPlaying(false)}};
 return <div ref={viewport} onWheel={manualStop} onTouchStart={manualStop} onKeyDown={e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key))manualStop()}} className={'cinematic '+(compact?'cinematic--compact ':'')+'cinematic--'+invite.theme} dir="rtl">
  <AnimatePresence mode="wait">
   {!opened?<motion.div key="sealed" className="cin-sealed cin-envelope-scene" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:1}} transition={{duration:.2}}>
     <div className="cin-emboss cin-emboss--tl" aria-hidden="true">❀<span>❧</span></div>
     <div className="cin-emboss cin-emboss--br" aria-hidden="true">❀<span>❧</span></div>
     <span className="cin-envelope-caption">دعوة زفاف</span>
     <h1 className="cin-names cin-names--cover">{invite.groom||'العريس'} <span>و</span> {invite.bride||'العروس'}</h1>
     <button className="cin-envelope cin-full-envelope" type="button" onClick={()=>setOpened(true)} aria-label="اضغط على الختم لفتح ظرف الدعوة">
       <span className="cin-envelope-fold cin-envelope-fold--left"/><span className="cin-envelope-fold cin-envelope-fold--right"/>
       <span className="cin-satin-ribbon cin-satin-ribbon--vertical"/><span className="cin-satin-ribbon cin-satin-ribbon--horizontal"/>
       <span className="cin-satin-tail cin-satin-tail--left"/><span className="cin-satin-tail cin-satin-tail--right"/>
       <span className="cin-satin-bow"><i/><i/></span>
       <span className="cin-seal"><Heart size={22} strokeWidth={1.3}/></span>
     </button>
     <span className="cin-seal-hint">المس الختم لفتح الدعوة</span>
   </motion.div>:
   <motion.div key="content" initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:.9}} className="cin-content">
    <section className="cin-section cin-hero">
     <div className="cin-corner cin-corner--tr">❦</div><div className="cin-corner cin-corner--tl">❦</div>
     <span className="cin-kicker">بسم الله الرحمن الرحيم</span>
     <p className="cin-verse">﴿ وَجَعَلَ بَيْنَكُم مَوَدَّةً وَرَحْمَةً ﴾</p>
     <div className="cin-family-pair" aria-label="أسماء العائلتين">
       <div className="cin-family-column"><span className="cin-family-title">حرم السيد</span><span className="cin-parent-name">{invite.groomFamily||'فلان'}</span><strong>{invite.groom||'العريس'}</strong></div>
       <div className="cin-family-column"><span className="cin-family-title">حرم السيد</span><span className="cin-parent-name">{invite.brideFamily||'فلان'}</span><strong>{invite.bride||'العروس'}</strong></div>
     </div>
     <p className="cin-invited">{invite.invitedBy||'تتشرف عائلتا العروسين بدعوتكم لحضور حفل الزفاف'}</p>
     <div className="cin-divider">✧ ❀ ✧</div>
     <span className="cin-label">نحتفل معاً بزفاف</span>
     <div className="cin-couple-names">{invite.groom||'العريس'} <span>و</span> {invite.bride||'العروس'}</div>
     <p className="cin-intro">{invite.intro||'نتشرف بوجودكم ومشاركتكم فرحتنا'}</p>
     <div className="cin-date-line"><span>✦</span>{formatDate(invite.date)}<span>✦</span></div>
     <ChevronDown className="cin-down"/>
    </section>
    <section className="cin-section cin-date-section">
     <span className="cin-label">Save the date</span>
     <h2>موعد فرحتنا</h2>
     <div className="cin-calendar"><div className="cin-month">{cal.month}</div><div className="cin-weekdays">{['أح','إث','ثل','أر','خم','جم','سب'].map(d=><span key={d}>{d}</span>)}</div><div className="cin-calendar-grid">{cal.days.map((day,i)=><span key={i} className={day&&cal.selected===day?'selected':''}>{day||''}</span>)}</div></div>
     <div className="cin-time"><CalendarDays size={17}/>{formatDate(invite.date)} {invite.time?'• الساعة '+invite.time:''}</div>
     {invite.date&&<button className="cin-subtle-button" onClick={()=>saveCalendar(invite)}><CalendarPlus size={16}/> أضف الموعد إلى التقويم</button>}
    </section>
    <section className="cin-section cin-venue-section">
     <div className="cin-divider">❁ ✦ ❁</div>
     <span className="cin-label">The celebration</span>
     <h2>مكان الحفل</h2><span className="cin-location-label">عنوان الصالة</span>
     <div className="cin-place-illustration" aria-hidden="true"><span>❀</span><div className="cin-arches"><Heart size={65} strokeWidth={1.2}/><span>✧</span><Heart size={65} strokeWidth={1.2}/></div><span>❀</span></div>
     <h3>{invite.venue||'قاعة الحفل'}</h3><p className="cin-venue-address"><MapPin size={18}/>{invite.address||'العنوان غير محدد بعد'}</p>
     {mapsDestination&&<a className="cin-map" href={mapsDestination} target="_blank" rel="noopener noreferrer"><MapPin size={17}/> افتح موقع الصالة واتبع الاتجاهات <ExternalLink size={14}/></a>}
    </section>
    <section className="cin-section cin-ending">
     <div className="cin-divider">✧ ❀ ✧</div><h2>حضوركم يكمل فرحتنا</h2><p>ننتظركم بكل الحب والسعادة</p>
     <Heart size={25} strokeWidth={1.1}/>
    </section>
   </motion.div>}
  </AnimatePresence>
 </div>;
}

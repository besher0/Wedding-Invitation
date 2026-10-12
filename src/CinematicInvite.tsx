import {useEffect,useMemo,useRef,useState} from 'react';
import {CalendarDays,MapPin,Heart,ExternalLink,ChevronDown,CalendarPlus,Volume2,VolumeX} from 'lucide-react';
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
 const [phase,setPhase]=useState<'closed'|'opening'|'opened'>('closed');
 const opened=phase==='opened';
 const openingTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const audioRef=useRef<HTMLAudioElement|null>(null);
 const [playing,setPlaying]=useState(false);
 const audioUrl=useMemo(()=>{
  try {const url=new URL((invite.musicUrl||'').trim());return url.protocol==='https:'?url.href:''}
  catch{return ''}
 },[invite.musicUrl]);
 useEffect(()=>()=>{if(openingTimer.current)clearTimeout(openingTimer.current)},[]);
 useEffect(()=>{setPlaying(false)},[audioUrl]);
 const openEnvelope=()=>{
  if(phase!=='closed')return;
  // Play synchronously from the genuine user interaction; browsers block unattended autoplay.
  if(audioUrl&&audioRef.current)audioRef.current.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false));
  setPhase('opening');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  openingTimer.current=setTimeout(()=>setPhase('opened'),reduced?120:3000);
 };
 const toggleMusic=()=>{
  const audio=audioRef.current;if(!audio)return;
  if(audio.paused)audio.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false));
  else {audio.pause();setPlaying(false)}
 };
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
  const timer=window.setTimeout(()=>{autoRef.current=true;setAutoPlaying(true)},3200);
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
 return <div ref={viewport} onWheel={manualStop} onTouchStart={manualStop} onKeyDown={e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key))manualStop()}} className={'cinematic cinematic--'+phase+' '+(compact?'cinematic--compact ':'')+'cinematic--'+invite.theme} dir="rtl">
  {audioUrl&&<audio ref={audioRef} src={audioUrl} loop preload="none" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>}
  {audioUrl&&opened&&<div className="cin-audio-toolbar"><button type="button" onClick={toggleMusic} aria-label={playing?'إيقاف الموسيقى':'تشغيل الموسيقى'} title={playing?'إيقاف الموسيقى':'تشغيل الموسيقى'}>{playing?<Volume2 size={19}/>:<VolumeX size={19}/>}</button></div>}
  <div className="cin-content">
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
  </div>
  {phase!=='opened'&&<div className={'cin-gate-scene'+(phase==='opening'?' cin-gate-opening':'')}>
   <div className="cin-gate-invitation" aria-hidden="true"><span className="cin-gate-flourish">✿ ❀ ✿</span><span className="cin-gate-title">دعوة زفاف</span><span className="cin-gate-names">{invite.groom||'العريس'} <i>و</i> {invite.bride||'العروس'}</span><span className="cin-gate-subtitle">من القلب إلى القلب</span></div>
   <div className="cin-gate-door cin-gate-door--right" aria-hidden="true"><span className="cin-gate-flowers">❀</span><span className="cin-gate-ornament">✧</span></div>
   <div className="cin-gate-door cin-gate-door--left" aria-hidden="true"><span className="cin-gate-flowers">❀</span><span className="cin-gate-ornament">✧</span></div>
   <button type="button" className="cin-gate-trigger" aria-label="اضغط لفتح بطاقة الزفاف" onClick={openEnvelope} disabled={phase!=='closed'}><span className="cin-gate-medallion" aria-hidden="true"><Heart size={27} strokeWidth={1.35}/></span></button>
  </div>}
 </div>;
}

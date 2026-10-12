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
function GateFlower({className=''}:{className?:string}){
 return <svg className={className} viewBox="0 0 160 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M80 252C78 205 70 164 91 125C112 86 106 52 79 18M84 178C52 168 38 152 29 129M85 148C117 137 131 116 132 92M80 214C105 210 120 189 126 174" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  <path d="M78 202C50 198 39 174 35 165C60 164 74 177 78 202ZM88 156C108 132 129 138 140 131C135 155 114 164 88 156ZM89 126C70 118 63 101 61 90C86 96 92 107 89 126ZM109 81C133 72 139 52 139 42C118 48 103 62 109 81ZM81 231C97 216 117 219 129 213C120 231 100 239 81 231Z" fill="currentColor" fillOpacity=".17" stroke="currentColor" strokeWidth="1.4"/>
  <path d="M77 14C69 -1 55 5 56 17C41 14 38 30 50 36C43 47 58 57 69 48C81 59 94 49 89 36C105 32 100 16 86 17C89 5 78 0 77 14Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity=".09"/>
  <circle cx="72" cy="30" r="7" stroke="currentColor" strokeWidth="1.8"/>
  <path d="M27 126C14 111 3 121 11 133C2 139 10 153 23 147C29 158 45 152 44 141C55 134 44 119 33 126Z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity=".11"/>
  <circle cx="27" cy="139" r="4" stroke="currentColor" strokeWidth="1.4"/>
  <path d="M128 174C115 161 104 173 113 183C106 195 121 205 132 194C145 202 154 188 145 178C153 166 137 159 128 174Z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity=".1"/>
  <circle cx="130" cy="184" r="4" stroke="currentColor" strokeWidth="1.4"/>
  <circle cx="110" cy="113" r="2.8" fill="currentColor" fillOpacity=".36"/><circle cx="56" cy="91" r="2.3" fill="currentColor" fillOpacity=".36"/>
 </svg>;
}
export default function CinematicInvite({invite,compact=false}:{invite:Invitation,compact?:boolean}){
 type OpeningPhase='sealed'|'unsealing'|'doors'|'lift'|'reveal'|'opened';
 const [phase,setPhase]=useState<OpeningPhase>('sealed');
 const opened=phase==='opened';
 const sceneRef=useRef<HTMLDivElement>(null);
 const leftRef=useRef<HTMLDivElement>(null);
 const rightRef=useRef<HTMLDivElement>(null);
 const cardRef=useRef<HTMLDivElement>(null);
 const sealRef=useRef<HTMLSpanElement>(null);
 const busyRef=useRef(false);
 const disposed=useRef(false);
 useEffect(()=>{disposed.current=false;return ()=>{disposed.current=true}},[]);
 const audioRef=useRef<HTMLAudioElement|null>(null);
 const [playing,setPlaying]=useState(false);
 const audioUrl=useMemo(()=>{
  try {const url=new URL((invite.musicUrl||'').trim());return url.protocol==='https:'?url.href:''}
  catch{return ''}
 },[invite.musicUrl]);
 useEffect(()=>{setPlaying(false)},[audioUrl]);
 const openEnvelope=async()=>{
  if(phase!=='sealed'||busyRef.current)return;
  busyRef.current=true;
  if(audioUrl&&audioRef.current)audioRef.current.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false));
  const scene=sceneRef.current,left=leftRef.current,right=rightRef.current,card=cardRef.current,seal=sealRef.current;
  if(!scene||!left||!right||!card||!seal)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run=(el:HTMLElement,frames:Keyframe[],ms:number,easing='ease-in-out')=>el.animate(frames,{duration:reduced?Math.max(220,ms*.45):ms,easing,fill:'forwards'}).finished;
  try{
   setPhase('unsealing');
   await run(seal,[{transform:'scale(1)',opacity:1},{transform:'scale(1.11)',opacity:1,offset:.38},{transform:'scale(.55) rotate(12deg)',opacity:0}],630,'cubic-bezier(.22,.62,.2,1)');
   if(disposed.current)return;
   setPhase('doors');
   await Promise.all([
    run(left,[{transform:'rotateY(0deg)'},{transform:'rotateY(-12deg)',offset:.24},{transform:'rotateY(-46deg)',offset:.62},{transform:'rotateY(-78deg)'}],2100,'cubic-bezier(.2,.64,.2,1)'),
    run(right,[{transform:'rotateY(0deg)'},{transform:'rotateY(12deg)',offset:.24},{transform:'rotateY(46deg)',offset:.62},{transform:'rotateY(78deg)'}],2100,'cubic-bezier(.2,.64,.2,1)')
   ]);
   if(disposed.current)return;
   setPhase('lift');card.style.zIndex='7';
   await run(card,[{transform:'translate3d(0,5%,0) scale(.92)'},{transform:'translate3d(0,-12%,0) scale(1)',offset:.62},{transform:'translate3d(0,-21%,0) scale(1.08)'}],1350,'cubic-bezier(.18,.78,.21,1)');
   if(disposed.current)return;
   setPhase('reveal');
   await Promise.all([
    run(card,[{transform:'translate3d(0,-21%,0) scale(1.08)',opacity:1},{transform:'translate3d(0,-24%,0) scale(1.18)',opacity:1,offset:.5},{transform:'translate3d(0,-24%,0) scale(1.25)',opacity:0}],1100),
    run(scene,[{opacity:1},{opacity:1,offset:.25},{opacity:0}],1200)
   ]);
   if(!disposed.current)setPhase('opened');
  }catch{
   if(!disposed.current){setPhase('reveal');await new Promise(resolve=>setTimeout(resolve,850));if(!disposed.current)setPhase('opened')}
  }
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
  {phase!=='opened'&&<div ref={sceneRef} className={'cin-gate-scene cin-gate-scene--'+phase}>
   <div className="cin-gate-atmosphere" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>
   <div className="cin-gate-book"><span className="cin-gate-book-corner cin-gate-book-corner--tl" aria-hidden="true">❧</span><span className="cin-gate-book-corner cin-gate-book-corner--br" aria-hidden="true">❧</span>
    <div ref={cardRef} className="cin-gate-sheet" aria-hidden="true">
     <span className="cin-gate-sheet-ornament">✧ ❀ ✧</span>
     <span className="cin-gate-sheet-heading">دعوة زفاف</span>
     <span className="cin-gate-sheet-names">{invite.groom||'العريس'} <em>و</em> {invite.bride||'العروس'}</span>
     <span className="cin-gate-sheet-note">يسعدنا أن تشاركونا فرحتنا</span>
     <span className="cin-gate-sheet-flower">❧</span>
    </div>
    <div ref={rightRef} className="cin-gate-leaf cin-gate-leaf--right" aria-hidden="true">
     <div className="cin-gate-leaf-edge"/><GateFlower className="cin-gate-flower-art"/>
     <span className="cin-gate-leaf-detail">✦ ♡ ✦</span>
    </div>
    <div ref={leftRef} className="cin-gate-leaf cin-gate-leaf--left" aria-hidden="true">
     <div className="cin-gate-leaf-edge"/><GateFlower className="cin-gate-flower-art"/>
     <span className="cin-gate-leaf-detail">✦ ♡ ✦</span>
    </div>
    <button className="cin-gate-touch" type="button" disabled={phase!=='sealed'} onClick={openEnvelope} aria-label="افتح دعوة الزفاف">
     <span ref={sealRef} className="cin-gate-wax"><span className="cin-gate-wax-inner"><Heart size={26} strokeWidth={1.3}/></span></span>
    </button>
   </div>
   {phase==='sealed'&&<span className="cin-gate-instruction">المس الختم لفتح الدعوة</span>}
  </div>}
 </div>;
}

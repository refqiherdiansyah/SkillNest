import { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

/* ══════════════════════════════════════════
   TOKENS
══════════════════════════════════════════ */
const C = {
  bg:'#07090E', surface:'#0C1119', card:'#131B27',
  border:'rgba(255,255,255,0.07)',
  teal:'#11D5B8', amber:'#F5A52A', purple:'#8F7FFF',
  coral:'#FF8765', green:'#4BC99A',
  slate:'#5A6B80', muted:'#8898AF', light:'#BEC9D8', white:'#E6EEF5',
}
const SK = ['#11D5B8','#F5A52A','#8F7FFF','#FF8765','#4BC99A']

/* ══════════════════════════════════════════
   LOCAL STORAGE
══════════════════════════════════════════ */
const K = {
  modules:'SkillNest:modules', sessions:'SkillNest:sessions',
  skills:'SkillNest:skills',   mentors:'SkillNest:mentors',
  badges:'SkillNest:badges',   activities:'SkillNest:activities',
  msgs:'SkillNest:msgs',       answers:'SkillNest:answers',
  cur:'SkillNest:cur',         notes:'SkillNest:notes',
  deleted:'SkillNest:deleted',
}
const load = (key, fb) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb } }
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

/* ══════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════ */
const QUESTIONS = [
  {id:1, domain:'Guest Relations',  q:'A VIP guest arrives 3 hours before check-in. What is your first response?',       opts:['Ask them to wait in the lobby','Offer F&B while checking room availability','Direct to the concierge desk','Apologize and ask them to return later'],                      correct:1},
  {id:2, domain:'Communication',    q:'What is the proper greeting when answering the hotel phone?',                        opts:['Hello?','Yes, how can I help?','Good morning, [Hotel], [Name] speaking — how may I assist?','Front desk, what do you need?'],                                          correct:2},
  {id:3, domain:'Technical Skills', q:"A guest's folio shows a billing discrepancy at check-out. First step?",              opts:['Accept whatever the guest says','Verify the folio against system records before adjusting','Refuse any changes','Comp the full bill to avoid conflict'],                 correct:1},
  {id:4, domain:'Prof. Conduct',    q:'A guest is raising their voice at the front desk. How do you respond?',              opts:['Match their tone firmly','Stay calm, listen, apologize, and offer a solution','Call security immediately','Ignore them until they calm down'],                          correct:1},
  {id:5, domain:'Technical Skills', q:'What does PMS stand for in hotel operations?',                                       opts:['Primary Management Suite','Property Management System','Protocol Management Software','Personnel Management System'],                                                   correct:1},
  {id:6, domain:'Service Delivery', q:'A walk-in arrives when fully booked. Best response?',                                opts:['Turn them away immediately','Offer to waitlist and suggest nearby alternatives','Say rooms may open without checking','Give an uncleaned room'],                         correct:1},
  {id:7, domain:'Guest Relations',  q:'A guest requests a room upgrade. How do you handle it?',                             opts:['Upgrade automatically for free','Check availability, explain options and costs','Deny without explanation','Ask them to call back'],                                     correct:1},
  {id:8, domain:'Prof. Conduct',    q:'During a busy check-in rush, a colleague is struggling. You?',                      opts:['Continue only your own work','Offer to help between your own tasks','Tell them to slow down','Report to management'],                                                    correct:1},
  {id:9, domain:'Communication',    q:"A guest doesn't speak Bahasa or English. How do you assist?",                       opts:['Speak louder in English','Use translation tools and find a multilingual colleague','Ask them to find a translator','Hand them materials and walk away'],                correct:1},
  {id:10,domain:'Service Delivery', q:'A guest reports room uncleaned at 3 PM. Immediate action?',                         opts:['Tell them it should be done','Apologize, contact housekeeping, offer an alternative room or amenity','Ask them to wait for the afternoon shift','Blame housekeeping staff'], correct:1},
  {id:11,domain:'Technical Skills', q:'Which info is essential to complete a guest check-in?',                              opts:['Just their name','Valid ID, reservation details, payment method, and room assignment','Payment only','Reservation number only'],                                          correct:1},
  {id:12,domain:'Guest Relations',  q:'A guest asks for local dining recommendations. Ideal response?',                    opts:['Tell them to search online','Give 2-3 personalized picks and offer to make a reservation',"Say you're not familiar with the area",'Recommend only the hotel restaurant'], correct:1},
]

const MENTOR_RESP = {
  1:['At Aston Inn we always anticipate guest needs before they ask — that is what separates good from great FO.','First impressions define the entire stay. Be warm, proactive, and solution-focused from the first hello.','Always use the guest name at least twice during check-in. It builds rapport instantly.','Great question — let me walk you through how we handle that at Aston step by step.'],
  2:['As Bell Captain, the key to busy arrivals is calm triage — VIP status first, always.','Concierge work is about genuine local knowledge. Guests can feel when you actually care about helping them.','Learn the hotel supplier contacts before reaching out externally for any guest request.','Luggage logistics are underrated — always tag, always confirm the room number before leaving the trolley.'],
  3:['When I was in CoE I felt the exact same theory-practice gap. SkillNest would have helped so much!','After graduating I realized attitude is the foundation — technical skills follow with practice.','The PMS felt overwhelming at first. Two weeks on the floor and it becomes pure muscle memory.','Focus on communication first. That is what separates average interns from the ones who get job offers.'],
  4:['RevPAR equals ADR times Occupancy Rate. Every FO decision connects to this formula — memorize it.','Opera and CloudBeds are the PMS systems most Indonesian hotels use. Worth learning both interfaces.','Rate strategy depends on seasonality, local events, and daily competitor benchmarking.','The relationship between front office and revenue management is closer than most interns expect.'],
}

const INIT_MODULES = [
  {id:1,name:'Front Desk Orientation',  domain:'Technical Skills',done:false,dur:'45m'},
  {id:2,name:'Guest Check-in Protocol', domain:'Prof. Conduct',   done:false,dur:'30m'},
  {id:3,name:'PMS System Basics',       domain:'Technical Skills',done:false,dur:'60m'},
  {id:4,name:'Handling Complaints',     domain:'Guest Relations', done:false,dur:'40m'},
  {id:5,name:'Phone Etiquette',         domain:'Communication',   done:false,dur:'25m'},
  {id:6,name:'VIP Guest Protocols',     domain:'Guest Relations', done:false,dur:'35m'},
  {id:7,name:'Room Type Knowledge',     domain:'Technical Skills',done:false,dur:'30m'},
  {id:8,name:'Service Recovery',        domain:'Service Delivery',done:false,dur:'45m'},
]
const INIT_SESSIONS = [
  {id:1,mentor:'Ms. Dewi Rahayu', time:'3:00 PM Today',    topic:'Check-in Procedures',status:'upcoming',notes:''},
  {id:2,mentor:'Mr. Budi Santoso',time:'Tomorrow 2:00 PM', topic:'Guest Relations',     status:'upcoming',notes:''},
]
const INIT_SKILLS = [
  {name:'Communication',   value:82,benchmark:90},
  {name:'Technical Skills',value:65,benchmark:88},
  {name:'Guest Relations', value:78,benchmark:87},
  {name:'Prof. Conduct',   value:90,benchmark:92},
  {name:'Service Delivery',value:71,benchmark:85},
]
const INIT_MENTORS = [
  {id:1,name:'Ms. Dewi Rahayu', role:'FO Manager',     hotel:'Aston Inn Batu Malang',tag:'Guest Services',connected:true, av:'DR',color:'#11D5B8'},
  {id:2,name:'Mr. Budi Santoso',role:'Bell Captain',   hotel:'JW Marriott Surabaya', tag:'Concierge',     connected:false,av:'BS',color:'#F5A52A'},
  {id:3,name:'Ms. Sari Putri',  role:"CoE Alumni '22", hotel:'UMM Graduate',          tag:'Career Advice', connected:true, av:'SP',color:'#8F7FFF'},
  {id:4,name:'Mr. Agus Wijaya', role:'Revenue Manager',hotel:'Trans Luxury Hotel',    tag:'Revenue & PMS', connected:false,av:'AW',color:'#FF8765'},
]
const INIT_BADGES = [
  {id:1,name:'Guest Service Pro', icon:'🏆',earned:false,desc:'Complete 5 Guest Relations modules'},
  {id:2,name:'PMS Expert',        icon:'⚡',earned:false,desc:'Score 85%+ on Technical Skills assessment'},
  {id:3,name:'Communication Ace', icon:'💬',earned:false,desc:'Complete all Communication modules'},
  {id:4,name:'Protocol Master',   icon:'📋',earned:false,desc:'Complete all Prof. Conduct modules'},
  {id:5,name:'Service Champion',  icon:'🎯',earned:false,desc:'Achieve 90%+ in Service Delivery'},
  {id:6,name:'First Connection',  icon:'🤝',earned:false,desc:'Connect with your first mentor'},
  {id:7,name:'Assessment Ace',    icon:'🎓',earned:false,desc:'Complete the full 12-question assessment'},
  {id:8,name:'Quick Learner',     icon:'🚀',earned:false,desc:'Complete 3 modules in one session'},
]
const INIT_CERTS = [
  {id:1,name:'Front Office Fundamentals',date:'15 Jan 2025',module:'Front Desk Orientation'},
  {id:2,name:'Guest Communication',      date:'22 Jan 2025',module:'Phone Etiquette'},
]
const INIT_MSGS = {
  1:[{from:'mentor',text:'Hi! Ready to help with your FO preparation at Aston Inn. What questions do you have?',time:'10:00 AM'}],
  3:[{from:'mentor',text:'Hey! As a CoE grad I know exactly what Pra-internship feels like. Ask me anything!',time:'Yesterday'}],
}
const INIT_ACTIVITIES = [
  {id:1,text:'Welcome to SkillNest — your readiness journey starts here.',color:'#11D5B8',time:'Just now'},
  {id:2,text:'2 mentor sessions scheduled this week.',                 color:'#F5A52A',time:'Today'},
  {id:3,text:'Start the assessment to unlock your gap report.',        color:'#8F7FFF',time:'Today'},
]

/* ══════════════════════════════════════════
   DOWNLOADS
══════════════════════════════════════════ */
function dlCSV(skills) {
  const rows = [
    ['Domain','Score (%)','Benchmark (%)','Gap (pts)','Status'],
    ...skills.map(s => [s.name, s.value, s.benchmark, s.benchmark - s.value, s.value >= s.benchmark ? 'On Target' : 'Needs Work']),
  ]
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), {href:url, download:'SkillNest_Skills.csv'}).click()
  URL.revokeObjectURL(url)
}

function dlCert(cert) {
  const html = [
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    '<title>Certificate — ' + cert.name + '</title>',
    '<style>*{margin:0;padding:0;box-sizing:border-box}',
    'body{background:#07090E;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;padding:24px}',
    '.c{max-width:640px;width:100%;padding:52px 44px;border:2px solid #11D5B8;background:#0C1119;color:#E6EEF5;text-align:center;border-radius:20px}',
    '.logo{font-size:28px;font-weight:900;color:#11D5B8;margin-bottom:4px}',
    '.tag{font-size:11px;color:#8898AF;font-style:italic;margin-bottom:20px}',
    '.div{width:56px;height:2px;background:#11D5B8;margin:0 auto 20px}',
    '.lbl{font-size:10px;color:#8898AF;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px}',
    'h1{font-size:28px;font-weight:800;margin-bottom:8px}',
    '.sub{font-size:13px;color:#8898AF;margin-bottom:6px}',
    '.nm{font-size:24px;font-weight:700;color:#11D5B8;margin-bottom:20px}',
    '.mod{font-size:13px;color:#BEC9D8;padding:10px 20px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;display:inline-block;margin-bottom:20px}',
    '.dt{font-size:11px;color:#5A6B80;margin-top:10px}',
    '</style></head><body>',
    '<div class="c">',
    '<div class="logo">SkillNest</div>',
    '<div class="tag">Where theory meets the floor.</div>',
    '<div class="div"></div>',
    '<div class="lbl">Certificate of Completion</div>',
    '<h1>' + cert.name + '</h1>',
    '<div class="sub">Awarded to</div>',
    '<div class="nm">Muhamad Refqi Dwi Herdiansyah</div>',
    '<div class="mod">📚 ' + cert.module + '</div>',
    '<div class="div"></div>',
    '<div class="dt">Issued ' + cert.date + ' &nbsp;·&nbsp; SkillNest Readiness Platform &nbsp;·&nbsp; UMM CoE Program</div>',
    '</div></body></html>',
  ].join('')
  const blob = new Blob([html], {type:'text/html'})
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), {href:url, download:'SkillNest_Cert_' + cert.name.replace(/\s+/g,'_') + '.html'}).click()
  URL.revokeObjectURL(url)
}

function dlPortfolio(skills, modules, certs, badges, activities) {
  const q = v => '"' + String(v).replace(/"/g,'""') + '"'
  const rows = [
    ['SkillNest PORTFOLIO REPORT'],
    ['Generated', new Date().toLocaleDateString('id-ID')],
    [],
    ['== SKILLS OVERVIEW =='],
    ['Domain','Score','Benchmark','Gap','Status'],
    ...skills.map(s => [s.name, s.value+'%', s.benchmark+'%', (s.benchmark-s.value)+'pts', s.value>=s.benchmark?'On Target':'Needs Work']),
    [],
    ['== MODULES =='],
    ['Module','Domain','Duration','Status'],
    ...modules.map(m => [m.name, m.domain, m.dur, m.done?'Completed':'Pending']),
    [],
    ['== CERTIFICATIONS =='],
    ['Certificate','Module','Date'],
    ...certs.map(c => [c.name, c.module, c.date]),
    [],
    ['== BADGES =='],
    ['Badge','Status','Requirement'],
    ...badges.map(b => [b.name, b.earned?'Earned':'Locked', b.desc]),
    [],
    ['== RECENT ACTIVITY =='],
    ['Activity','Time'],
    ...activities.slice(0,10).map(a => [a.text, a.time]),
  ]
  const csv = rows.map(r => Array.isArray(r) ? r.map(q).join(',') : '').join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), {href:url, download:'SkillNest_Portfolio.csv'}).click()
  URL.revokeObjectURL(url)
}

/* ══════════════════════════════════════════
   UI ATOMS
══════════════════════════════════════════ */
const pg = {padding:'12px 16px 28px'}

function MCard({children, style={}}) {
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:'14px 16px',marginBottom:10,...style}}>{children}</div>
}
function SHead({title,right}) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,marginTop:6}}>
      <div style={{fontSize:11,color:C.muted,letterSpacing:'0.8px',fontWeight:700}}>{title}</div>
      {right}
    </div>
  )
}
function Pill({text,color}) {
  return <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:100,background:`${color}14`,color,border:`1px solid ${color}25`}}>{text}</span>
}
function Btn({children,onClick,color=C.teal,fg=C.bg,full=false,sm=false,disabled=false,style={}}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{background:disabled?C.muted:color,color:fg,border:'none',borderRadius:10,padding:sm?'7px 12px':'11px 18px',fontWeight:700,fontSize:sm?12:13,cursor:disabled?'not-allowed':'pointer',minHeight:sm?32:40,opacity:disabled?0.5:1,...(full?{width:'100%'}:{}),...style}}>
      {children}
    </button>
  )
}
function OBtn({children,onClick,sm=false,style={}}) {
  return (
    <button onClick={onClick} style={{background:'transparent',color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:sm?'6px 10px':'10px 16px',fontWeight:600,fontSize:sm?11:13,cursor:'pointer',minHeight:sm?30:40,...style}}>
      {children}
    </button>
  )
}
function MInput({value,onChange,placeholder,multiline=false,rows=2,style={}}) {
  const base = {background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',color:C.white,fontSize:14,width:'100%',boxSizing:'border-box',fontFamily:'inherit',...style}
  return multiline
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...base,resize:'none'}}/>
    : <input value={value} onChange={onChange} placeholder={placeholder} style={base}/>
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
function Dashboard({modules,setModules,sessions,setSessions,skills,activities,setActivities}) {
  const [addOpen,setAddOpen] = useState(false)
  const [ns,setNs] = useState({mentor:'',time:'',topic:''})
  const [expSess,setExpSess] = useState(null)
  const avg = Math.round(skills.reduce((a,s)=>a+s.value,0)/skills.length)
  const done = modules.filter(m=>m.done).length
  const upcoming = sessions.filter(s=>s.status==='upcoming').length

  const addAct = (text,color) => setActivities(p=>[{id:Date.now(),text,color,time:'Just now'},...p])

  function addSess() {
    if(!ns.mentor||!ns.topic) return
    const s = {id:Date.now(),...ns,status:'upcoming',notes:''}
    setSessions(p=>[...p,s])
    addAct(`Session added: ${s.topic} with ${s.mentor}`,C.teal)
    setNs({mentor:'',time:'',topic:''})
    setAddOpen(false)
  }
  function doneSess(id) {
    const s = sessions.find(x=>x.id===id)
    setSessions(p=>p.map(x=>x.id===id?{...x,status:'completed'}:x))
    if(s) addAct(`Completed: ${s.topic} with ${s.mentor}`,C.green)
  }
  function toggleMod(id) {
    setModules(p=>p.map(m=>{
      if(m.id!==id) return m
      const done = !m.done
      if(done) addAct(`Module completed: ${m.name}`,C.green)
      return {...m,done}
    }))
  }

  return (
    <div style={pg}>
      {/* Hero score card */}
      <MCard style={{background:`linear-gradient(135deg,${C.card} 0%,rgba(17,213,184,0.08) 100%)`,border:`1px solid rgba(17,213,184,0.15)`,marginBottom:10}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:2}}>Good morning,</div>
        <div style={{fontSize:20,fontWeight:900,color:C.white,marginBottom:14}}>Refqi ✦</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:'0.8px',marginBottom:2}}>READINESS SCORE</div>
            <div style={{fontSize:48,fontWeight:900,color:C.teal,lineHeight:1}}>{avg}%</div>
          </div>
          <div style={{textAlign:'right',paddingBottom:4}}>
            <div style={{fontSize:11,color:C.amber,marginBottom:2}}>▲ improving</div>
            <div style={{fontSize:10,color:C.muted}}>keep going</div>
          </div>
        </div>
        <div style={{height:5,background:'rgba(255,255,255,0.05)',borderRadius:3,marginTop:14}}>
          <div style={{height:5,borderRadius:3,background:C.teal,width:`${avg}%`,transition:'width 0.4s'}}/>
        </div>
      </MCard>

      {/* Mini stats */}
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        {[
          {l:'MODULES',v:`${done}/${modules.length}`,c:C.amber},
          {l:'SESSIONS',v:upcoming,c:C.coral},
          {l:'AVG SCORE',v:`${avg}%`,c:C.purple},
        ].map(s=>(
          <div key={s.l} style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'10px 12px'}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:'0.8px',marginBottom:3}}>{s.l}</div>
            <div style={{fontSize:22,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <SHead title="TODAY'S MODULES"/>
      <MCard style={{padding:'10px 14px'}}>
        {modules.map((m,i)=>(
          <div key={m.id} onClick={()=>toggleMod(m.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 2px',borderBottom:i<modules.length-1?`1px solid ${C.border}`:'none',cursor:'pointer',minHeight:44}}>
            <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${m.done?C.green:C.slate}`,background:m.done?C.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:C.bg,fontWeight:900,flexShrink:0}}>
              {m.done&&'✓'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:m.done?C.slate:C.white,textDecoration:m.done?'line-through':'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:1}}>{m.domain} · {m.dur}</div>
            </div>
          </div>
        ))}
      </MCard>

      {/* Mentor sessions */}
      <SHead title="MENTOR SESSIONS" right={<Btn onClick={()=>setAddOpen(!addOpen)} sm>+ Add</Btn>}/>

      {addOpen&&(
        <MCard>
          <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:10}}>New Session</div>
          <MInput value={ns.mentor} onChange={e=>setNs(p=>({...p,mentor:e.target.value}))} placeholder="Mentor name"/>
          <div style={{height:8}}/>
          <MInput value={ns.topic} onChange={e=>setNs(p=>({...p,topic:e.target.value}))} placeholder="Session topic"/>
          <div style={{height:8}}/>
          <MInput value={ns.time} onChange={e=>setNs(p=>({...p,time:e.target.value}))} placeholder="Date & time"/>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <Btn onClick={addSess} full>Save Session</Btn>
            <OBtn onClick={()=>setAddOpen(false)}>Cancel</OBtn>
          </div>
        </MCard>
      )}

      {sessions.length===0&&(
        <div style={{textAlign:'center',color:C.muted,fontSize:13,padding:'24px 0'}}>No sessions yet — add one above.</div>
      )}

      {sessions.map(s=>(
        <MCard key={s.id} style={{border:`1px solid ${s.status==='completed'?'rgba(75,201,154,0.2)':C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8,gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:s.status==='completed'?C.muted:C.white,marginBottom:2}}>{s.topic}</div>
              <div style={{fontSize:11,color:C.muted}}>👤 {s.mentor}{s.time?` · ⏰ ${s.time}`:''}</div>
            </div>
            <Pill text={s.status==='completed'?'Done':'Upcoming'} color={s.status==='completed'?C.green:C.teal}/>
          </div>
          {expSess===s.id&&(
            <MInput value={s.notes} onChange={e=>setSessions(p=>p.map(x=>x.id===s.id?{...x,notes:e.target.value}:x))} placeholder="Session notes..." multiline style={{marginBottom:8}}/>
          )}
          <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
            <OBtn onClick={()=>setExpSess(expSess===s.id?null:s.id)} sm>📝 Notes</OBtn>
            {s.status!=='completed'&&<Btn onClick={()=>doneSess(s.id)} color={C.green} sm>✓ Done</Btn>}
            <Btn onClick={()=>setSessions(p=>p.filter(x=>x.id!==s.id))} color="rgba(255,135,101,0.1)" fg={C.coral} sm>✕ Delete</Btn>
          </div>
        </MCard>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════
   ASSESSMENT
══════════════════════════════════════════ */
function Assessment({skills,setSkills,activities,setActivities,badges,setBadges}) {
  const [answers,setAnswers] = useState(()=>load(K.answers,{}))
  const [cur,setCur] = useState(()=>load(K.cur,0))
  const [paused,setPaused] = useState(false)
  const [notes,setNotes] = useState(()=>load(K.notes,''))
  const [notesOpen,setNotesOpen] = useState(false)
  const [deleted,setDeleted] = useState(()=>load(K.deleted,[]))
  const [report,setReport] = useState(null)

  useEffect(()=>{ save(K.answers,answers) },[answers])
  useEffect(()=>{ save(K.cur,cur) },[cur])
  useEffect(()=>{ save(K.notes,notes) },[notes])
  useEffect(()=>{ save(K.deleted,deleted) },[deleted])

  const qs = QUESTIONS.filter(q=>!deleted.includes(q.id))
  const answered = Object.keys(answers).length
  const pct = qs.length ? Math.round(answered/qs.length*100) : 0
  const q = qs[cur] || qs[0]

  function complete() {
    const dom = {}
    qs.forEach(q=>{ if(!dom[q.domain]) dom[q.domain]={c:0,t:0}; dom[q.domain].t++; if(answers[q.id]===q.correct) dom[q.domain].c++ })
    const total = qs.filter(q=>answers[q.id]===q.correct).length
    const score = Math.round(total/qs.length*100)
    setSkills(prev=>prev.map(s=>{ const d=dom[s.name]; if(!d) return s; return {...s,value:Math.min(100,Math.round(s.value*0.6+(d.c/d.t*100)*0.4))} }))
    setActivities(p=>[{id:Date.now(),text:`Assessment complete — scored ${score}%`,color:C.purple,time:'Just now'},...p])
    if(score>=80) setBadges(p=>p.map(b=>b.id===7?{...b,earned:true}:b))
    setReport({dom,total,qs:qs.length,score})
  }

  function resetAssessment() {
    setAnswers({}); setCur(0); setDeleted([]); setReport(null)
    save(K.answers,{}); save(K.cur,0); save(K.deleted,[])
  }

  const colScore = p => p>=80?C.green:p>=60?C.amber:C.coral

  if(report) return (
    <div style={pg}>
      <MCard style={{textAlign:'center',padding:'28px 16px',background:`linear-gradient(135deg,${C.card},rgba(143,127,255,0.08))`}}>
        <div style={{fontSize:10,color:C.purple,letterSpacing:'1px',fontWeight:700,marginBottom:10}}>ASSESSMENT COMPLETE</div>
        <div style={{fontSize:64,fontWeight:900,color:colScore(report.score),lineHeight:1,marginBottom:6}}>{report.score}%</div>
        <div style={{fontSize:13,color:C.muted}}>{report.total} / {report.qs} correct · Skills updated</div>
      </MCard>
      <SHead title="GAP REPORT BY DOMAIN"/>
      {Object.entries(report.dom).map(([d,r])=>{ const p=Math.round(r.c/r.t*100); return (
        <MCard key={d}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700,color:C.white}}>{d}</div>
            <span style={{fontSize:12,fontWeight:700,color:colScore(p)}}>{p}% · {p>=80?'✓ Strong':p>=60?'△ Review':'✗ Focus'}</span>
          </div>
          <div style={{height:7,background:'rgba(255,255,255,0.05)',borderRadius:4}}>
            <div style={{height:7,borderRadius:4,background:colScore(p),width:`${p}%`}}/>
          </div>
        </MCard>
      )})}
      <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
        <Btn onClick={resetAssessment} full>Retake Assessment</Btn>
        <OBtn onClick={()=>setReport(null)}>Close Report</OBtn>
      </div>
    </div>
  )

  if(!q) return <div style={{...pg,textAlign:'center',paddingTop:40}}><div style={{color:C.muted}}>No questions available.</div></div>

  return (
    <div style={pg}>
      {/* Controls row */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,gap:8}}>
        <div style={{fontSize:12,color:C.muted}}>Q{cur+1}/{qs.length} · {pct}% done</div>
        <div style={{display:'flex',gap:6}}>
          <OBtn onClick={()=>setNotesOpen(!notesOpen)} sm>📝 Notes</OBtn>
          <Btn onClick={()=>setPaused(!paused)} color={paused?C.teal:'rgba(245,165,42,0.14)'} fg={paused?C.bg:C.amber} sm>{paused?'▶ Resume':'⏸ Pause'}</Btn>
        </div>
      </div>

      {/* Notes */}
      {notesOpen&&(
        <MCard style={{marginBottom:10}}>
          <MInput value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Write session notes here..." multiline rows={3}/>
        </MCard>
      )}

      {/* Progress bar */}
      <div style={{height:5,background:'rgba(255,255,255,0.05)',borderRadius:3,marginBottom:12}}>
        <div style={{height:5,borderRadius:3,background:C.teal,width:`${pct}%`,transition:'width 0.3s'}}/>
      </div>

      {/* Question dots */}
      <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:6,marginBottom:12}}>
        {qs.map((aq,i)=>(
          <div key={aq.id} onClick={()=>!paused&&setCur(i)} style={{width:28,height:28,borderRadius:7,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,cursor:'pointer',background:answers[aq.id]!==undefined?(answers[aq.id]===aq.correct?'rgba(75,201,154,0.18)':'rgba(255,135,101,0.18)'):i===cur?'rgba(17,213,184,0.15)':'rgba(255,255,255,0.04)',border:`1.5px solid ${answers[aq.id]!==undefined?(answers[aq.id]===aq.correct?C.green:C.coral):i===cur?C.teal:C.border}`,color:i===cur?C.teal:C.muted}}>
            {i+1}
          </div>
        ))}
      </div>

      {paused ? (
        <MCard style={{textAlign:'center',padding:'36px 16px'}}>
          <div style={{fontSize:32,marginBottom:10}}>⏸</div>
          <div style={{fontSize:16,fontWeight:800,color:C.white,marginBottom:6}}>Paused</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Progress saved. Resume when ready.</div>
          <Btn onClick={()=>setPaused(false)} full>▶ Resume Assessment</Btn>
        </MCard>
      ) : (
        <>
          <MCard>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <Pill text={q.domain} color={C.teal}/>
              <button onClick={()=>{setDeleted(p=>[...p,q.id]);setCur(c=>Math.max(0,c>=qs.length-1?c-1:c))}} style={{background:'rgba(255,135,101,0.08)',color:C.coral,border:`1px solid rgba(255,135,101,0.2)`,borderRadius:7,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                Remove
              </button>
            </div>
            <div style={{fontSize:15,fontWeight:700,color:C.white,lineHeight:1.6,marginBottom:16}}>{q.q}</div>
            {q.opts.map((opt,i)=>(
              <div key={i} onClick={()=>setAnswers(p=>({...p,[q.id]:i}))} style={{marginBottom:8,padding:'11px 14px',borderRadius:12,border:`1px solid ${answers[q.id]===i?'rgba(17,213,184,0.45)':C.border}`,background:answers[q.id]===i?'rgba(17,213,184,0.07)':C.surface,cursor:'pointer',display:'flex',alignItems:'center',gap:10,minHeight:44}}>
                <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${answers[q.id]===i?C.teal:C.slate}`,background:answers[q.id]===i?C.teal:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:C.bg,fontWeight:900}}>
                  {answers[q.id]===i&&'✓'}
                </div>
                <span style={{fontSize:13,color:answers[q.id]===i?C.teal:C.light,lineHeight:1.4}}>{opt}</span>
              </div>
            ))}
          </MCard>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <OBtn onClick={()=>setCur(c=>Math.max(0,c-1))} disabled={cur===0}>← Prev</OBtn>
            {cur<qs.length-1
              ? <Btn onClick={()=>setCur(c=>c+1)} full>Next →</Btn>
              : <Btn onClick={complete} disabled={answered<qs.length} color={answered>=qs.length?C.green:C.muted} full>
                  {answered>=qs.length?'Complete & See Results →':`Answer ${qs.length-answered} more...`}
                </Btn>
            }
          </div>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   SKILLS
══════════════════════════════════════════ */
function Skills({skills,setSkills}) {
  const [exportOpen,setExportOpen] = useState(false)
  const [editing,setEditing] = useState(null)
  const avg = Math.round(skills.reduce((a,s)=>a+s.value,0)/skills.length)

  function update(name,v) {
    setSkills(p=>p.map(s=>s.name===name?{...s,value:Math.max(0,Math.min(100,Number(v)))}:s))
  }
  function copySheets() {
    const tsv = [['Domain','Score','Benchmark','Gap'],...skills.map(s=>[s.name,s.value+'%',s.benchmark+'%',(s.benchmark-s.value)+'pts'])].map(r=>r.join('\t')).join('\n')
    navigator.clipboard.writeText(tsv).then(()=>alert('Copied! Open Google Sheets and paste with Ctrl+V')).catch(()=>alert('Copy failed — try CSV download instead'))
    setExportOpen(false)
  }

  return (
    <div style={pg}>
      {/* Header */}
      <MCard style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px'}}>
        <div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:'0.8px',marginBottom:2}}>AVERAGE SCORE</div>
          <div style={{fontSize:38,fontWeight:900,color:C.teal,lineHeight:1}}>{avg}%</div>
        </div>
        <div style={{position:'relative'}}>
          <Btn onClick={()=>setExportOpen(!exportOpen)}>Export ↓</Btn>
          {exportOpen&&(
            <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:6,minWidth:200,zIndex:50,boxShadow:'0 8px 24px rgba(0,0,0,0.5)'}}>
              {[
                {icon:'📊',l:'Download CSV',          fn:()=>{dlCSV(skills);setExportOpen(false)}},
                {icon:'📗',l:'Download Excel (.csv)', fn:()=>{dlCSV(skills);setExportOpen(false)}},
                {icon:'🔗',l:'Copy for Google Sheets',fn:copySheets},
                {icon:'↗', l:'Open Google Sheets',   fn:()=>{window.open('https://docs.google.com/spreadsheets/d/new','_blank');setExportOpen(false)}},
              ].map(item=>(
                <div key={item.l} onClick={item.fn} onMouseEnter={e=>e.currentTarget.style.background=C.surface} onMouseLeave={e=>e.currentTarget.style.background='transparent'} style={{padding:'10px 12px',cursor:'pointer',fontSize:13,color:C.white,borderRadius:8,display:'flex',alignItems:'center',gap:8}}>
                  <span>{item.icon}</span>{item.l}
                </div>
              ))}
            </div>
          )}
        </div>
      </MCard>

      {/* Skill bars */}
      <SHead title="DOMAIN SCORES · tap % to edit"/>
      <MCard>
        {skills.map((s,i)=>(
          <div key={s.name} style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <div style={{width:9,height:9,borderRadius:2,background:SK[i]}}/>
                <span style={{fontSize:13,fontWeight:600,color:C.white}}>{s.name}</span>
              </div>
              {editing===s.name
                ? <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <input type="number" min="0" max="100" value={s.value} onChange={e=>update(s.name,e.target.value)} style={{width:52,background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:'4px 6px',color:SK[i],fontSize:14,fontWeight:800,textAlign:'center',fontFamily:'inherit'}}/>
                    <button onClick={()=>setEditing(null)} style={{background:'none',border:'none',color:C.teal,cursor:'pointer',fontSize:18,lineHeight:1,padding:0}}>✓</button>
                  </div>
                : <div onClick={()=>setEditing(s.name)} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
                    <span style={{fontSize:16,fontWeight:800,color:SK[i]}}>{s.value}%</span>
                    <span style={{fontSize:10,color:C.slate}}>✎</span>
                  </div>
              }
            </div>
            <div style={{position:'relative',height:10,background:'rgba(255,255,255,0.04)',borderRadius:5}}>
              <div style={{height:10,borderRadius:5,background:SK[i],width:`${s.value}%`,transition:'width 0.4s',opacity:0.85}}/>
              <div style={{position:'absolute',top:0,left:`${s.benchmark}%`,height:10,borderLeft:`2px dashed ${SK[i]}80`}}>
                <span style={{position:'absolute',top:-14,left:-12,fontSize:9,color:SK[i],fontWeight:600}}>{s.benchmark}%</span>
              </div>
            </div>
            <div style={{fontSize:10,color:s.value>=s.benchmark?C.green:C.coral,marginTop:3,fontWeight:600}}>
              {s.value>=s.benchmark?`✓ ${s.value-s.benchmark}pt above benchmark`:`${s.benchmark-s.value}pt below benchmark`}
            </div>
          </div>
        ))}
      </MCard>

      {/* Pie chart */}
      <SHead title="SCORE DISTRIBUTION"/>
      <MCard>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={skills.map(s=>({name:s.name,value:s.value}))} cx="50%" cy="50%" innerRadius={50} outerRadius={82} paddingAngle={3} dataKey="value">
              {skills.map((_,i)=><Cell key={i} fill={SK[i]}/>)}
            </Pie>
            <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={(v,n)=>[`${v}%`,n]}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
          {skills.map((s,i)=>(
            <div key={s.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <div style={{width:10,height:10,borderRadius:2,background:SK[i],flexShrink:0}}/>
                <span style={{fontSize:13,color:C.muted}}>{s.name}</span>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:SK[i]}}>{s.value}%</span>
            </div>
          ))}
        </div>
      </MCard>
    </div>
  )
}

/* ══════════════════════════════════════════
   MENTORS
══════════════════════════════════════════ */
function Mentors({mentors,setMentors,activities,setActivities}) {
  const [active,setActive] = useState(null)
  const [msgs,setMsgs] = useState(()=>load(K.msgs,INIT_MSGS))
  const [inp,setInp] = useState('')
  const [typing,setTyping] = useState(false)
  const endRef = useRef(null)
  const openM = mentors.find(m=>m.id===active?.id)
  const openMsgs = openM ? (msgs[openM.id]||[]) : []

  useEffect(()=>{ save(K.msgs,msgs) },[msgs])
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[openMsgs,typing])

  function connect(id) {
    setMentors(p=>p.map(m=>{
      if(m.id!==id) return m
      if(!m.connected) {
        setActivities(ap=>[{id:Date.now(),text:`Connected with ${m.name}`,color:m.color,time:'Just now'},...ap])
        setMsgs(prev=>({...prev,[id]:prev[id]||[{from:'mentor',text:`Hi! Thanks for connecting. I am here to help you prepare for your Pra-internship. What would you like to discuss?`,time:'Just now'}]}))
      }
      return {...m,connected:!m.connected}
    }))
  }

  function send() {
    if(!inp.trim()||!active) return
    const id = active.id
    setMsgs(p=>({...p,[id]:[...(p[id]||[]),{from:'user',text:inp.trim(),time:'Now'}]}))
    setInp('')
    setTyping(true)
    const pool = MENTOR_RESP[id]||['Great question! Let me share my perspective.','That is something many interns wonder about.']
    setTimeout(()=>{
      setMsgs(p=>({...p,[id]:[...(p[id]||[]),{from:'mentor',text:pool[Math.floor(Math.random()*pool.length)],time:'Now'}]}))
      setTyping(false)
    },1300)
  }

  return (
    <>
      <div style={pg}>
        <div style={{fontSize:11,color:C.muted,letterSpacing:'0.8px',fontWeight:700,marginBottom:10}}>
          MENTORS · {mentors.filter(m=>m.connected).length} CONNECTED
        </div>
        {mentors.map(m=>(
          <MCard key={m.id}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
              <div style={{width:44,height:44,borderRadius:'50%',background:`${m.color}18`,border:`2px solid ${m.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,color:m.color,flexShrink:0}}>{m.av}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:C.white}}>{m.name}</div>
                <div style={{fontSize:11,color:C.muted,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.role} · {m.hotel}</div>
              </div>
              {m.connected&&<div style={{width:8,height:8,borderRadius:'50%',background:C.green,flexShrink:0}}/>}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
              <Pill text={m.tag} color={m.color}/>
              <div style={{display:'flex',gap:6}}>
                {m.connected&&<Btn onClick={()=>setActive(m)} color={`${m.color}18`} fg={m.color} sm>💬 Chat</Btn>}
                <Btn onClick={()=>connect(m.id)} color={m.connected?'rgba(255,135,101,0.1)':m.color} fg={m.connected?C.coral:C.bg} sm>{m.connected?'Disconnect':'Connect'}</Btn>
              </div>
            </div>
          </MCard>
        ))}
      </div>

      {/* Full-screen chat overlay */}
      {active&&openM&&(
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:C.bg,zIndex:80,display:'flex',flexDirection:'column'}}>
          <div style={{height:56,display:'flex',alignItems:'center',gap:12,padding:'0 16px',borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
            <button onClick={()=>setActive(null)} style={{background:'none',border:'none',color:C.teal,cursor:'pointer',fontSize:22,padding:4,display:'flex',alignItems:'center',lineHeight:1}}>←</button>
            <div style={{width:36,height:36,borderRadius:'50%',background:`${openM.color}18`,border:`1.5px solid ${openM.color}35`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:openM.color,flexShrink:0}}>{openM.av}</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:C.white}}>{openM.name}</div>
              <div style={{fontSize:11,color:C.green}}>● Online · {openM.tag}</div>
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:8}}>
            {openMsgs.map((msg,i)=>(
              <div key={i} style={{display:'flex',justifyContent:msg.from==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'82%',padding:'10px 14px',borderRadius:msg.from==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',background:msg.from==='user'?C.teal:C.card,color:msg.from==='user'?C.bg:C.white,fontSize:14,lineHeight:1.5}}>
                  {msg.text}
                  <div style={{fontSize:9,color:msg.from==='user'?'rgba(0,0,0,0.4)':C.slate,marginTop:4,textAlign:msg.from==='user'?'right':'left'}}>{msg.time}</div>
                </div>
              </div>
            ))}
            {typing&&(
              <div style={{display:'flex'}}>
                <div style={{padding:'10px 16px',borderRadius:'16px 16px 16px 4px',background:C.card,color:C.muted,fontSize:22,letterSpacing:3}}>···</div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <div style={{padding:'10px 16px 20px',borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0,display:'flex',gap:8}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={`Message ${openM.name.split(' ')[1]}...`} style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',color:C.white,fontSize:14,fontFamily:'inherit'}}/>
            <button onClick={send} disabled={!inp.trim()} style={{background:C.teal,color:C.bg,border:'none',borderRadius:12,padding:'12px 18px',fontWeight:700,fontSize:16,cursor:'pointer',opacity:inp.trim()?1:0.5,minWidth:52}}>↑</button>
          </div>
        </div>
      )}
    </>
  )
}

/* ══════════════════════════════════════════
   PORTFOLIO
══════════════════════════════════════════ */
function Portfolio({modules,skills,badges,setBadges,certs,activities,setActivities,onReset}) {
  const [selBadge,setSelBadge] = useState(null)
  const [showReset,setShowReset] = useState(false)
  const done = modules.filter(m=>m.done)
  const avg = Math.round(skills.reduce((a,s)=>a+s.value,0)/skills.length)
  const earnedB = badges.filter(b=>b.earned).length

  function unlock(id) {
    setBadges(p=>p.map(b=>{
      if(b.id!==id||b.earned) return b
      setActivities(ap=>[{id:Date.now(),text:`Badge unlocked: ${b.name}`,color:C.amber,time:'Just now'},...ap])
      return {...b,earned:true}
    }))
  }
  function exportAll() {
    dlPortfolio(skills,modules,certs,badges,activities)
    setActivities(p=>[{id:Date.now(),text:'Portfolio exported as CSV report',color:C.coral,time:'Just now'},...p])
  }

  return (
    <div style={pg}>
      {/* Stats 2x2 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
        {[
          {l:'READINESS',   v:`${avg}%`,          c:C.teal},
          {l:'MODULES',     v:`${done.length}/${modules.length}`, c:C.amber},
          {l:'CERTIFICATES',v:certs.length,         c:C.green},
          {l:'BADGES',      v:`${earnedB}/${badges.length}`, c:C.purple},
        ].map(x=>(
          <div key={x.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'12px 14px',borderTop:`3px solid ${x.c}`}}>
            <div style={{fontSize:9,color:C.muted,letterSpacing:'0.7px',marginBottom:4}}>{x.l}</div>
            <div style={{fontSize:28,fontWeight:900,color:x.c,lineHeight:1}}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Module tracker */}
      <SHead title="MODULE PROGRESS"/>
      <MCard>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.muted,marginBottom:8}}>
          <span>{done.length} of {modules.length} completed</span>
          <span style={{color:C.amber,fontWeight:700}}>{Math.round(done.length/modules.length*100)}%</span>
        </div>
        <div style={{height:6,background:'rgba(255,255,255,0.04)',borderRadius:3,marginBottom:12}}>
          <div style={{height:6,borderRadius:3,background:C.amber,width:`${Math.round(done.length/modules.length*100)}%`,transition:'width 0.4s'}}/>
        </div>
        {modules.map(m=>(
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,minHeight:32}}>
            <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${m.done?C.green:C.slate}`,background:m.done?C.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:C.bg,fontWeight:900,flexShrink:0}}>{m.done&&'✓'}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:m.done?C.muted:C.white,textDecoration:m.done?'line-through':'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
              <div style={{fontSize:10,color:C.muted}}>{m.domain}</div>
            </div>
          </div>
        ))}
      </MCard>

      {/* Badges */}
      <SHead title={`BADGES · ${earnedB}/${badges.length} EARNED`}/>
      <MCard>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          {badges.map(b=>(
            <div key={b.id} onClick={()=>setSelBadge(selBadge?.id===b.id?null:b)} style={{background:b.earned?'rgba(245,165,42,0.06)':C.surface,border:`1px solid ${b.earned?'rgba(245,165,42,0.22)':C.border}`,borderRadius:12,padding:'10px 6px',cursor:'pointer',textAlign:'center',opacity:b.earned?1:0.5}}>
              <div style={{fontSize:24,marginBottom:4,filter:b.earned?'none':'grayscale(1)'}}>{b.icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:b.earned?C.white:C.muted,lineHeight:1.3}}>{b.name}</div>
              <div style={{fontSize:9,color:b.earned?C.amber:C.slate,marginTop:2}}>{b.earned?'✓ Earned':'🔒 Locked'}</div>
            </div>
          ))}
        </div>
        {selBadge&&(
          <div style={{marginTop:12,background:C.surface,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:4}}>{selBadge.icon} {selBadge.name}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:selBadge.earned?0:12}}>{selBadge.desc}</div>
            {!selBadge.earned&&<Btn onClick={()=>unlock(selBadge.id)} color={C.amber} full>Unlock Badge</Btn>}
          </div>
        )}
      </MCard>

      {/* Certifications */}
      <SHead title="CERTIFICATIONS" right={<Btn onClick={exportAll} sm>Export Portfolio</Btn>}/>
      {certs.length===0&&<div style={{textAlign:'center',color:C.muted,fontSize:13,padding:'16px 0'}}>Complete modules to earn certificates.</div>}
      {certs.map(c=>(
        <MCard key={c.id}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:2}}>🎓 {c.name}</div>
              <div style={{fontSize:11,color:C.muted,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.module} · {c.date}</div>
            </div>
            <Btn onClick={()=>{dlCert(c);setActivities(p=>[{id:Date.now(),text:`Certificate downloaded: ${c.name}`,color:C.coral,time:'Just now'},...p])}} color={C.green} sm>↓ Download</Btn>
          </div>
        </MCard>
      ))}

      {/* Recent activity */}
      <SHead title="RECENT ACTIVITY"/>
      <MCard>
        {activities.slice(0,10).map((a,i)=>(
          <div key={a.id||i} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:a.color,flexShrink:0,marginTop:4}}/>
            <div>
              <div style={{fontSize:13,color:C.light,lineHeight:1.4}}>{a.text}</div>
              <div style={{fontSize:10,color:C.slate,marginTop:2}}>{a.time}</div>
            </div>
          </div>
        ))}
      </MCard>

      {/* Reset */}
      <SHead title="DANGER ZONE"/>
      <MCard style={{border:'1px solid rgba(255,135,101,0.2)'}}>
        <div style={{fontSize:13,color:C.muted,marginBottom:10}}>Reset all app data and start fresh. This cannot be undone.</div>
        {showReset
          ? <div>
              <div style={{fontSize:13,fontWeight:700,color:C.coral,marginBottom:10}}>Are you sure? All progress will be lost.</div>
              <div style={{display:'flex',gap:8}}>
                <Btn onClick={onReset} color="rgba(255,135,101,0.15)" fg={C.coral} full>Yes, Reset Everything</Btn>
                <OBtn onClick={()=>setShowReset(false)}>Cancel</OBtn>
              </div>
            </div>
          : <Btn onClick={()=>setShowReset(true)} color="rgba(255,135,101,0.1)" fg={C.coral} full>Reset All Data</Btn>
        }
      </MCard>
    </div>
  )
}

/* ══════════════════════════════════════════
   TABS + APP SHELL
══════════════════════════════════════════ */
const TABS = [
  {id:'dashboard', label:'Home',    icon:'🏠', color:'#11D5B8'},
  {id:'assessment',label:'Quiz',    icon:'📝', color:'#F5A52A'},
  {id:'skills',    label:'Skills',  icon:'📊', color:'#8F7FFF'},
  {id:'mentors',   label:'Mentors', icon:'💬', color:'#FF8765'},
  {id:'portfolio', label:'Profile', icon:'📁', color:'#4BC99A'},
]

export default function App() {
  const [tab,setTab] = useState('dashboard')
  const [modules,  setModules]   = useState(()=>load(K.modules,   INIT_MODULES))
  const [sessions, setSessions]  = useState(()=>load(K.sessions,  INIT_SESSIONS))
  const [skills,   setSkills]    = useState(()=>load(K.skills,    INIT_SKILLS))
  const [mentors,  setMentors]   = useState(()=>load(K.mentors,   INIT_MENTORS))
  const [badges,   setBadges]    = useState(()=>load(K.badges,    INIT_BADGES))
  const [certs]                  = useState(()=>load('SkillNest:certs', INIT_CERTS))
  const [activities,setActivities]= useState(()=>load(K.activities,INIT_ACTIVITIES))

  useEffect(()=>{ save(K.modules,   modules)    },[modules])
  useEffect(()=>{ save(K.sessions,  sessions)   },[sessions])
  useEffect(()=>{ save(K.skills,    skills)     },[skills])
  useEffect(()=>{ save(K.mentors,   mentors)    },[mentors])
  useEffect(()=>{ save(K.badges,    badges)     },[badges])
  useEffect(()=>{ save(K.activities,activities) },[activities])

  function resetAll() {
    Object.values(K).forEach(k=>localStorage.removeItem(k))
    localStorage.removeItem('SkillNest:certs')
    setModules(INIT_MODULES); setSessions(INIT_SESSIONS); setSkills(INIT_SKILLS)
    setMentors(INIT_MENTORS); setBadges(INIT_BADGES); setActivities(INIT_ACTIVITIES)
    setTab('dashboard')
  }

  const score = Math.round(skills.reduce((a,s)=>a+s.value,0)/skills.length)
  const activeTab = TABS.find(t=>t.id===tab)

  return (
    <div style={{background:'#020407',minHeight:'100vh',display:'flex',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:430,background:C.bg,color:C.white,fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>

        {/* Top header */}
        <header style={{height:50,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0,zIndex:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:26,height:26,borderRadius:7,background:C.teal,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:13,color:C.bg}}>B</div>
            <span style={{fontWeight:900,fontSize:15,letterSpacing:'-0.3px'}}>SkillNest</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:'0.5px'}}>SCORE</div>
            <div style={{fontSize:15,fontWeight:900,color:C.teal}}>{score}%</div>
            <div style={{width:6,height:6,borderRadius:'50%',background:C.green}}/>
          </div>
        </header>

        {/* Tab label bar */}
        <div style={{height:30,display:'flex',alignItems:'center',padding:'0 16px',background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:10,color:activeTab.color,fontWeight:700,letterSpacing:'0.8px'}}>
            <span style={{fontSize:13}}>{activeTab.icon}</span>
            {activeTab.label.toUpperCase()}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{flex:1,overflowY:'auto',position:'relative'}}>
          {tab==='dashboard'  && <Dashboard  modules={modules} setModules={setModules} sessions={sessions} setSessions={setSessions} skills={skills} activities={activities} setActivities={setActivities}/>}
          {tab==='assessment' && <Assessment skills={skills} setSkills={setSkills} activities={activities} setActivities={setActivities} badges={badges} setBadges={setBadges}/>}
          {tab==='skills'     && <Skills     skills={skills} setSkills={setSkills}/>}
          {tab==='mentors'    && <Mentors    mentors={mentors} setMentors={setMentors} activities={activities} setActivities={setActivities}/>}
          {tab==='portfolio'  && <Portfolio  modules={modules} skills={skills} badges={badges} setBadges={setBadges} certs={certs} activities={activities} setActivities={setActivities} onReset={resetAll}/>}
        </div>

        {/* Bottom navigation */}
        <nav style={{height:62,display:'flex',background:C.surface,borderTop:`1px solid ${C.border}`,flexShrink:0,zIndex:10}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer',gap:3,padding:'6px 2px',position:'relative'}}>
              <span style={{fontSize:20,lineHeight:1,filter:tab===t.id?'none':'grayscale(1)',opacity:tab===t.id?1:0.45}}>{t.icon}</span>
              <span style={{fontSize:9,fontWeight:700,color:tab===t.id?t.color:C.slate,letterSpacing:'0.2px'}}>{t.label}</span>
              {tab===t.id&&<div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:20,height:2.5,borderRadius:2,background:t.color}}/>}
            </button>
          ))}
        </nav>

      </div>
    </div>
  )
}

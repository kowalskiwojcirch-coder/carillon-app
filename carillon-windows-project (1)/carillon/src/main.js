import './style.css';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const noteNames = ['C','Cis','D','Dis','E','F','Fis','G','Gis','A','B','H'];
const blackNotes = new Set(['Cis','Dis','Fis','Gis','B']);
let octave = 3, audioCtx = null, master = null, decodedSample = null, sampleLabel = '', midiAccess = null, recording = false, recorder = null, chunks = [], recordingStarted = 0, events = [], activeSources = new Map();
let recordings = loadRecordings();

function loadRecordings(){ try { return JSON.parse(localStorage.getItem('carillon-recordings') || '[]'); } catch { return []; } }
function saveRecordings(){ try { localStorage.setItem('carillon-recordings', JSON.stringify(recordings)); } catch { alert('Brak miejsca na zapis nagrania. Pobierz nagrania i usuń stare.'); } updateRecordings(); }
function initAudio(){ if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); master = audioCtx.createGain(); master.gain.value = Number($('#volume').value)/100; master.connect(audioCtx.destination); } if(audioCtx.state==='suspended') audioCtx.resume(); return audioCtx; }
function noteMidi(name, oct){ return (oct+1)*12 + noteNames.indexOf(name); }
function midiName(num){ const n = noteNames[((num%12)+12)%12]; const o = Math.floor(num/12)-1; return {name:n,oct:o,label:`${n}${o}`}; }
function noteFreq(num){ return 440 * Math.pow(2,(num-69)/12); }

function renderKeyboard(){
  const keyboard=$('#keyboard'); keyboard.innerHTML='';
  noteNames.forEach((name,i)=>{
    const button=document.createElement('button');
    button.className='key '+(blackNotes.has(name)?'black-key':'white-key');
    button.dataset.note=name; button.dataset.semitone=i;
    button.innerHTML=`<span class="key-note">${name}</span><small>${octave}</small>`;
    button.title=`${name}${octave}`;
    button.addEventListener('pointerdown',e=>{e.preventDefault(); playNote(noteMidi(name,octave),true);});
    button.addEventListener('pointerup',()=>stopNote(noteMidi(name,octave)));
    button.addEventListener('pointerleave',()=>stopNote(noteMidi(name,octave)));
    keyboard.appendChild(button);
  });
  $('#octaveLabel').textContent=`Oktawa ${octave}`;
}
function flashKey(num,on){ const d=midiName(num); const el=$(`.key[data-note="${d.name}"]`); if(d.oct===octave && el) el.classList.toggle('pressed',on); }
async function importSample(file){
  if(!file)return;
  try {
    initAudio();
    const buffer=await file.arrayBuffer();
    decodedSample=await audioCtx.decodeAudioData(buffer);
    sampleLabel=file.name;
    $('#sampleName').textContent=file.name;
    $('#sampleMeta').textContent=`${decodedSample.duration.toFixed(2)} s · ${decodedSample.numberOfChannels} kanał(y)`;
    $('#audioStatus').textContent='Próbka gotowa';
    localStorage.setItem('carillon-sample-name',file.name);
  } catch(e){ alert('Nie udało się otworzyć pliku audio. Spróbuj MP3 lub WAV.'); }
}
function makePitchShiftBuffer(semitones){
  // Offline granular pitch shifter: changes pitch while approximately preserving the sample duration.
  // Two overlapping grains use Hann windows and a moving read head.
  const src=decodedSample, rate=Math.pow(2,semitones/12), length=src.length;
  const out=audioCtx.createBuffer(src.numberOfChannels,length,src.sampleRate);
  const grain=2048, hop=grain/2;
  for(let ch=0;ch<src.numberOfChannels;ch++){
    const input=src.getChannelData(ch), output=out.getChannelData(ch);
    for(let start=0;start<length;start+=hop){
      const phase=(start%grain)/grain;
      const readStart=Math.floor(start*rate);
      for(let j=0;j<grain && start+j<length;j++){
        const dest=start+j;
        const win=0.5-0.5*Math.cos(2*Math.PI*j/(grain-1));
        const read=(readStart + j*rate) % length;
        const idx=Math.floor(read), frac=read-idx;
        const next=(idx+1)%length;
        output[dest]+=((input[idx]*(1-frac)+input[next]*frac)*win);
      }
    }
    // Normalize the overlapping window sum to reduce level variation.
    // A short edge fade avoids clicks at the beginning/end.
    const fade=Math.min(256,Math.floor(length/8));
    for(let i=0;i<fade;i++){const g=i/fade;output[i]*=g;output[length-1-i]*=g;}
  }
  return out;
}
const pitchCache=new Map();
function getPitchBuffer(num){
  const root=noteMidi('C',3), semi=num-root;
  if(!decodedSample) return null;
  if(semi===0) return decodedSample;
  if(pitchCache.has(semi))return pitchCache.get(semi);
  const b=makePitchShiftBuffer(semi); pitchCache.set(semi,b); return b;
}
function playNote(num, fromUi=false){
  initAudio();
  const buffer=getPitchBuffer(num);
  if(!buffer){ $('#audioStatus').textContent='Najpierw wczytaj próbkę C3'; return; }
  stopNote(num);
  const src=audioCtx.createBufferSource(); src.buffer=buffer;
  const gain=audioCtx.createGain(); gain.gain.value=1;
  src.connect(gain); gain.connect(master); src.start();
  activeSources.set(num,{src,gain});
  flashKey(num,true);
  const n=midiName(num); $('#lastNote').textContent=n.label; $('#lastNoteDetail').textContent=`MIDI ${num} · ${Math.round(noteFreq(num))} Hz`;
  if(recording) events.push({type:'noteon',note:num,time:performance.now()-recordingStarted});
  src.onended=()=>{if(activeSources.get(num)?.src===src){activeSources.delete(num);flashKey(num,false);}};
}
function stopNote(num){
  const item=activeSources.get(num);
  if(item){try{item.src.stop();}catch{} activeSources.delete(num);}
  flashKey(num,false);
  if(recording) events.push({type:'noteoff',note:num,time:performance.now()-recordingStarted});
}
function setVolume(v){$('#volume').value=v;$('#volume2').value=v;$('#volumeValue').textContent=v+'%';if(master)master.gain.setTargetAtTime(v/100,audioCtx.currentTime,.02);localStorage.setItem('carillon-volume',v);}
function navigate(page){
  $$('.page').forEach(p=>p.classList.add('hidden')); $(`#${page}Page`).classList.remove('hidden');
  $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
  const titles={instrument:'Carillon',settings:'Ustawienia',recordings:'Nagrania',info:'Informacje'};$('#pageTitle').textContent=titles[page];
}
$$('.nav').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
$('#octDown').onclick=()=>{octave=Math.max(0,octave-1);renderKeyboard();};
$('#octUp').onclick=()=>{octave=Math.min(7,octave+1);renderKeyboard();};
$('#volume').oninput=e=>setVolume(e.target.value);$('#volume2').oninput=e=>setVolume(e.target.value);
$('#sampleInput').onchange=e=>importSample(e.target.files[0]);$('#sampleInput2').onchange=e=>importSample(e.target.files[0]);
$('#midiConnect').onclick=$('#midiConnect2').onclick=connectMidi;
$('#showTerms').onclick=()=>$('#termsModal').classList.remove('hidden');
$('#acceptTerms').onclick=()=>{localStorage.setItem('carillon-terms','yes');$('#termsModal').classList.add('hidden');};
function keyboardMap(e){
  if(e.repeat || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const map={'a':0,'w':1,'s':2,'e':3,'d':4,'f':5,'t':6,'g':7,'y':8,'h':9,'u':10,'j':11};
  const k=e.key.toLowerCase(); if(k in map){e.preventDefault();playNote(noteMidi(noteNames[map[k]],octave));}
  if(k==='z'){octave=Math.max(0,octave-1);renderKeyboard();}
  if(k==='x'){octave=Math.min(7,octave+1);renderKeyboard();}
}
function keyboardUp(e){const map={'a':0,'w':1,'s':2,'e':3,'d':4,'f':5,'t':6,'g':7,'y':8,'h':9,'u':10,'j':11};const k=e.key.toLowerCase();if(k in map)stopNote(noteMidi(noteNames[map[k]],octave));}
window.addEventListener('keydown',keyboardMap);window.addEventListener('keyup',keyboardUp);
async function connectMidi(){
  if(!navigator.requestMIDIAccess){$('#midiStatus').textContent='Web MIDI niedostępne w tej przeglądarce';$('#settingsMidi').textContent='Web MIDI niedostępne';return;}
  try{
    midiAccess=await navigator.requestMIDIAccess();
    const attach=()=>{let count=0;for(const input of midiAccess.inputs.values()){input.onmidimessage=onMidi;count++;}const msg=count?`Połączono: ${count} wejście MIDI`:'Nie znaleziono urządzenia MIDI';$('#midiStatus').textContent=msg;$('#settingsMidi').textContent=msg;};
    attach();midiAccess.onstatechange=attach;
  }catch(e){$('#midiStatus').textContent='Brak zgody na dostęp do MIDI';}
}
function onMidi(e){const [status,note,velocity]=e.data;const type=status&0xf0;if(type===0x90&&velocity>0)playNote(note);else if(type===0x80||(type===0x90&&velocity===0))stopNote(note);}
function startRecording(){
  initAudio();
  if(!master) return;
  if(!audioCtx.createMediaStreamDestination){alert('Nagrywanie audio nie jest obsługiwane w tym środowisku.');return;}
  const dest=audioCtx.createMediaStreamDestination(); master.connect(dest);
  chunks=[];events=[];recordingStarted=performance.now();recorder=new MediaRecorder(dest.stream);
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=async()=>{
    const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});
    const dataUrl=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob);});
    const title=`Nagranie ${new Date().toLocaleString('pl-PL')}`;
    recordings.unshift({id:Date.now(),title,date:new Date().toISOString(),duration:Math.round((performance.now()-recordingStarted)/1000),mime:blob.type,audio:dataUrl,events});
    saveRecordings();$('#recordStatus').textContent='Nagranie zapisane';$('#audioStatus').textContent='Nagranie zapisane';
    try{master.disconnect(dest);}catch{}
  };
  recorder.start();recording=true;$('#recordStart').disabled=true;$('#recordStop').disabled=false;$('#recordStatus').textContent='Trwa nagrywanie…';$('#audioStatus').textContent='REC';
}
function stopRecording(){if(recorder&&recorder.state!=='inactive'){recording=false;recorder.stop();$('#recordStart').disabled=false;$('#recordStop').disabled=true;}}
$('#recordStart').onclick=startRecording;$('#recordStop').onclick=stopRecording;
function updateRecordings(){
  $('#recordCount').textContent=recordings.length;const list=$('#recordingsList');list.innerHTML='';
  if(!recordings.length){list.innerHTML='<div class="empty-state">Nie masz jeszcze nagrań. Kliknij „Nagraj”, aby rozpocząć.</div>';return;}
  recordings.forEach(rec=>{
    const row=document.createElement('div');row.className='recording-row';
    const meta=document.createElement('div');meta.className='recording-meta';meta.innerHTML=`<strong></strong><small></small>`;meta.querySelector('strong').textContent=rec.title;meta.querySelector('small').textContent=`${new Date(rec.date).toLocaleString('pl-PL')} · ${rec.duration||0} s`;
    const actions=document.createElement('div');actions.className='recording-actions';
    const play=document.createElement('button');play.className='btn';play.textContent='▶ Odtwórz';play.onclick=()=>{const a=new Audio(rec.audio);a.play();};
    const download=document.createElement('button');download.className='btn';download.textContent='↓ Pobierz';download.onclick=()=>{const a=document.createElement('a');a.href=rec.audio;a.download=`carillon-${rec.id}.webm`;a.click();};
    const del=document.createElement('button');del.className='btn';del.textContent='Usuń';del.onclick=()=>{if(confirm('Usunąć to nagranie?')){recordings=recordings.filter(x=>x.id!==rec.id);saveRecordings();}};
    actions.append(play,download,del);row.append(meta,actions);list.append(row);
  });
}
$('#recordStart').title='Nagrywaj dźwięk wyjściowy Carillonu';
const savedVol=localStorage.getItem('carillon-volume');if(savedVol!==null)setVolume(savedVol);
renderKeyboard();updateRecordings();
if(localStorage.getItem('carillon-terms')!=='yes')$('#termsModal').classList.remove('hidden');
if(!navigator.requestMIDIAccess){$('#midiStatus').textContent='MIDI zależy od obsługi systemu';$('#settingsMidi').textContent='MIDI zależy od środowiska';}
window.addEventListener('beforeunload',()=>{for(const n of activeSources.keys())stopNote(n);});

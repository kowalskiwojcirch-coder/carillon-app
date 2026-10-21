import "./style.css";

const $ = (s) => document.querySelector(s);
const app = $("#app");
app.innerHTML = `
  <div class="shell">
    <header><div class="brandmark">C</div><div><div class="brand">CARILLON</div><div class="subbrand">INSTRUMENT • STUDIO</div></div><div class="status"><i></i> GOTOWY</div></header>
    <nav><button class="tab active" data-tab="instrument">Carillon</button><button class="tab" data-tab="settings">Ustawienia</button><button class="tab" data-tab="recordings">Nagrania</button><button class="tab" data-tab="info">Informacje</button></nav>
    <main>
      <section class="page active" id="instrument">
        <div class="intro"><div><div class="eyebrow">WIRTUALNY INSTRUMENT</div><h1>Twoje brzmienie.<br><em>Twój carillon.</em></h1><p>Wczytaj próbkę C3 i graj na klawiaturze lub myszą.</p></div><div class="orb">♪</div></div>
        <div class="panel sample"><div><div class="label">PRÓBKA DŹWIĘKU</div><strong id="sampleName">Nie wczytano pliku</strong><div class="muted" id="sampleStatus">Wybierz plik C3.mp3, aby rozpocząć.</div></div><label class="goldbtn filebtn">Wczytaj C3.mp3<input id="sampleFile" type="file" accept="audio/*" hidden></label></div>
        <div class="panel controls"><div><div class="label">DŹWIĘK</div><div class="muted">Transpozycja chromatyczna • C3–C5</div></div><div class="controlrow"><label for="noteSelect">Nuta</label><select id="noteSelect"></select><button id="playNote" class="goldbtn">▶ Odtwórz</button></div></div>
        <div class="keyboardWrap"><div class="keyboardTitle"><span>KLAWIATURA</span><span class="muted">Kliknij klawisz lub użyj A–K</span></div><div id="keyboard" class="keyboard"></div></div>
        <div class="notice" id="notice">Najpierw wczytaj próbkę dźwięku C3.</div>
      </section>
      <section class="page" id="settings"><div class="eyebrow">PREFERENCJE</div><h1>Ustawienia</h1><div class="panel setting"><div><strong>Głośność</strong><div class="muted">Poziom odtwarzania</div></div><input id="volume" type="range" min="0" max="100" value="80"></div><div class="panel setting"><div><strong>Wejście MIDI</strong><div class="muted" id="midiStatus">Obsługa zależy od dostępności MIDI w systemie.</div></div><button id="midiButton" class="outline">Sprawdź MIDI</button></div><div class="panel setting"><div><strong>Próbka C3</strong><div class="muted">Użyj oryginalnego pliku jako źródła brzmienia.</div></div><button class="outline" id="resetSample">Wyczyść próbkę</button></div></section>
      <section class="page" id="recordings"><div class="eyebrow">TWOJE WYKONANIA</div><h1>Nagrania</h1><div class="panel recControls"><div><strong id="recState">Gotowy do nagrywania</strong><div class="muted">Nagranie przechwytuje dźwięk generowany w tej sesji.</div></div><button id="recordBtn" class="goldbtn">● Nagraj</button></div><div id="recordList" class="recordList"></div><p class="muted small">Uwaga: nagrania przechowywane lokalnie zależą od dostępnego miejsca w aplikacji. Pobieraj ważne pliki na dysk.</p></section>
      <section class="page" id="info"><div class="eyebrow">O APLIKACJI</div><h1>Carillon</h1><div class="panel prose"><p>Carillon to prototyp aplikacji instrumentu wirtualnego z ciemnym interfejsem i złotymi akcentami.</p><p><strong>Próbka:</strong> wczytaj swój plik C3.mp3. Aplikacja nie zawiera pliku dźwiękowego, ponieważ trzeba użyć Twojej oryginalnej próbki.</p><p><strong>Ważne:</strong> wersja prototypowa nie gwarantuje jeszcze studyjnej jakości transpozycji ani pełnej zgodności MIDI. Przed publiczną publikacją trzeba przetestować dźwięk, zapis nagrań i obsługę MIDI.</p></div></section>
    </main>
    <footer>CARILLON <span>•</span> WERSJA PROTOTYPOWA</footer>
  </div>
  <div class="modal" id="welcome"><div class="modalbox"><div class="brandmark big">C</div><div class="eyebrow">WITAMY W CARILLON</div><h2>Muzyka zaczyna się tutaj.</h2><p>Prototyp aplikacji instrumentu. Wczytaj własną próbkę dźwięku, aby zacząć. To wersja testowa — funkcje mogą wymagać dalszego dopracowania.</p><button class="goldbtn wide" id="agree">Rozumiem i przechodzę dalej</button></div></div>
`;
const noteNames = ["C","Cis","D","Dis","E","F","Fis","G","Gis","A","B","H"];
const notes = [];
for (let oct=3; oct<=5; oct++) for(let i=0;i<12;i++) if(!(oct===5 && i>0)) notes.push({name:noteNames[i]+oct, semitone:(oct-3)*12+i, black:[1,3,6,8,10].includes(i)});
const sel=$("#noteSelect");
notes.forEach(n=>{const o=document.createElement("option");o.value=n.semitone;o.textContent=n.name;sel.append(o)});
let audioCtx=null, sampleBuffer=null, volume=.8, activeSources=new Set(), mediaDest=null, recorder=null, chunks=[], recording=false;
const midiFrequency = n => 130.8128 * Math.pow(2,n/12);
function ctx(){if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();mediaDest=audioCtx.createMediaStreamDestination();} if(audioCtx.state==="suspended") audioCtx.resume(); return audioCtx;}
function say(msg){$("#notice").textContent=msg;}
function play(semitone=0){
 if(!sampleBuffer){say("Najpierw wczytaj plik C3.mp3.");return;}
 const c=ctx(), src=c.createBufferSource(), gain=c.createGain();
 // Prototype pitch shift by playback ratio; this changes duration and is not final-quality transposition.
 src.buffer=sampleBuffer; src.playbackRate.value=Math.pow(2,semitone/12);
 gain.gain.value=volume;
 src.connect(gain);gain.connect(c.destination);gain.connect(mediaDest);
 src.onended=()=>activeSources.delete(src);activeSources.add(src);src.start();
}
$("#sampleFile").addEventListener("change",async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const c=ctx();sampleBuffer=await c.decodeAudioData(await file.arrayBuffer());$("#sampleName").textContent=file.name;$("#sampleStatus").textContent=`Wczytano • ${sampleBuffer.duration.toFixed(2)} s`;say("Próbka wczytana. Wybierz nutę i odtwórz.");}
 catch(err){say("Nie udało się otworzyć pliku audio. Spróbuj ponownie użyć MP3 lub WAV.");}
});
$("#playNote").onclick=()=>play(Number(sel.value));
const keyboard=$("#keyboard");
notes.slice(0,24).forEach((n,i)=>{
 const b=document.createElement("button");b.className="key "+(n.black?"black":"white");b.textContent=n.name;b.title="Odtwórz "+n.name;b.onclick=()=>{sel.value=n.semitone;play(n.semitone)};keyboard.append(b);
});
const keyMap={"a":0,"w":1,"s":2,"e":3,"d":4,"f":5,"t":6,"g":7,"y":8,"h":9,"u":10,"j":11,"k":12};
window.addEventListener("keydown",e=>{if(e.repeat||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const s=keyMap[e.key.toLowerCase()];if(s!==undefined){sel.value=String(s);play(s)}});
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab,.page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.tab).classList.add("active");if(b.dataset.tab==="recordings")renderRecordings()});
$("#agree").onclick=()=>$("#welcome").classList.add("hidden");
if(localStorage.getItem("carillon-agreed")==="yes")$("#welcome").classList.add("hidden");else $("#agree").onclick=()=>{localStorage.setItem("carillon-agreed","yes");$("#welcome").classList.add("hidden")};
$("#volume").oninput=e=>volume=Number(e.target.value)/100;
$("#resetSample").onclick=()=>{sampleBuffer=null;$("#sampleName").textContent="Nie wczytano pliku";$("#sampleStatus").textContent="Wybierz plik C3.mp3, aby rozpocząć.";say("Próbka została wyczyszczona.")};
$("#midiButton").onclick=async()=>{if(!navigator.requestMIDIAccess){$("#midiStatus").textContent="MIDI nie jest dostępne w tym widoku aplikacji. Wymaga integracji natywnej.";return;}try{const access=await navigator.requestMIDIAccess();$("#midiStatus").textContent=`MIDI dostępne • wejścia: ${access.inputs.size}`;access.inputs.forEach(input=>input.onmidimessage=e=>{if((e.data[0]&0xf0)===0x90&&e.data[2]>0)play(e.data[1]-48)});}catch(e){$("#midiStatus").textContent="Brak zgody lub niedostępne urządzenie MIDI."}};
$("#recordBtn").onclick=()=>{
 if(!recording){if(!mediaDest){ctx()} chunks=[];try{recorder=new MediaRecorder(mediaDest.stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||"audio/webm"});const reader=new FileReader();reader.onload=()=>{try{const items=JSON.parse(localStorage.getItem("carillon-recordings")||"[]");items.unshift({name:"Carillon "+new Date().toLocaleString("pl-PL"),date:Date.now(),url:reader.result,type:blob.type});localStorage.setItem("carillon-recordings",JSON.stringify(items.slice(0,8)));$("#recState").textContent="Nagranie zapisane lokalnie";renderRecordings()}catch(e){$("#recState").textContent="Brak miejsca na zapis. Pobierz nagranie lub usuń stare.";}};reader.readAsDataURL(blob)};recorder.start();recording=true;$("#recordBtn").textContent="■ Zatrzymaj";$("#recState").textContent="Nagrywanie…"}catch(e){$("#recState").textContent="Nie udało się rozpocząć nagrywania."}}
 else{recorder.stop();recording=false;$("#recordBtn").textContent="● Nagraj";$("#recState").textContent="Zapisywanie nagrania…"}
};
function renderRecordings(){const list=$("#recordList");list.innerHTML="";let items=[];try{items=JSON.parse(localStorage.getItem("carillon-recordings")||"[]")}catch{}if(!items.length){list.innerHTML='<div class="empty">Brak nagrań. Kliknij „Nagraj”, aby utworzyć pierwsze.</div>';return}items.forEach((it,i)=>{const row=document.createElement("div");row.className="panel recording";const title=document.createElement("strong");title.textContent=it.name;const audio=document.createElement("audio");audio.controls=true;audio.src=it.url;const download=document.createElement("a");download.className="outline linkbtn";download.href=it.url;download.download=`carillon-${i+1}.webm`;download.textContent="Pobierz";const del=document.createElement("button");del.className="outline";del.textContent="Usuń";del.onclick=()=>{items.splice(i,1);localStorage.setItem("carillon-recordings",JSON.stringify(items));renderRecordings()};row.append(title,audio,download,del);list.append(row)})}
renderRecordings();

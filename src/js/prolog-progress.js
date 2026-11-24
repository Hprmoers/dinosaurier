
/* AKTE 66 – Prolog (separater Spielstand), Fortschritt, Abschlussdialoge und Urkunde. */
const prologKey='akte66-prolog-v1';
let prologCompleted=false;
try{prologCompleted=localStorage.getItem(prologKey)==='true'}catch(e){}
function saveProlog(){try{localStorage.setItem(prologKey,prologCompleted?'true':'false')}catch(e){}}
const baseOpenMission=openMission;
const baseDrawCards=drawCards;
const baseSceneAction=sceneAction;
function rankName(n){if(n===0)return 'Auf Spurensuche';if(n<=2)return 'Feldforschung';if(n<=4)return 'Beweisforschung';if(n<=6)return 'Expeditionsprofi';return 'Forschungsleitung'}
function updateFooter(){const b=document.getElementById('completeButton');if(current<0)return;b.textContent=completed[current]?'✓ Mission gelöst · Abschluss öffnen':'Feldnachweis bestätigen';b.classList.toggle('done',completed[current]);b.title=completed[current]?'Abschlussdialog erneut öffnen, ohne die Markierung zu verändern':'Bestätige den Heft-Check und sichere den Feldnachweis';}
openMission=function(i){baseOpenMission(i);updateFooter()};
function drawPrologCard(){const node=document.getElementById('hubPrologStatus');if(node)node.textContent=prologCompleted?'Hypothese im Heft festgehalten':'Deine erste begründete Vermutung';}
drawCards=function(){baseDrawCards();drawPrologCard()};
function updatePrologUI(){
 const text=prologCompleted?'Hypothese im Heft festgehalten · jederzeit erneut ansehen':'Deine erste Vermutung, bevor die Forschung beginnt.';
 document.getElementById('prologBannerStatus').textContent=text;
 document.getElementById('archivePrologStatus').textContent=prologCompleted?'✓ Im Forscherheft gesichert':'Noch nicht bestätigt';
 document.getElementById('prologSaved').textContent=prologCompleted?'✓ Dein Heftnachweis für den Prolog ist gesichert.':' ';
 document.getElementById('prologConfirm').textContent=prologCompleted?'✓ Hypothese gesichert · Abschluss öffnen':'Hypothese im Heft festgehalten';
 drawPrologCard();
}
refreshScene=function(){
 const n=completed.filter(Boolean).length;
 document.getElementById('sceneCompletion').textContent=n+' / 7';
 document.getElementById('sceneProgress').innerHTML=completed.map(ok=>'<span class="scene-dot'+(ok?' done':'')+'"></span>').join('');
 document.getElementById('archiveCount').textContent=n+' von 7 Heft-Checks markiert';
 document.getElementById('researchRank').textContent='Forscherrang: '+rankName(n);
 document.getElementById('researchPoints').textContent=(n*100)+' Forscherpunkte';
 document.getElementById('researchBadges').textContent=n+' / 7 Abzeichen';
 document.getElementById('archiveRankPanel').innerHTML='<span>Rang: '+rankName(n)+'</span><span>'+n*100+' Forscherpunkte</span><span>'+n+' / 7 Abzeichen</span>';
 const unlocked=n>=3;
 document.getElementById('archiveUnlockState').innerHTML=unlocked?'<p class="status">🔓 Das Wissensarchiv ist freigeschaltet.</p>':'<div class="archive-locked"><h2>🔒 Wissensarchiv</h2><p>Du kannst die Archivakten freischalten, nachdem du drei der sieben Heft-Checks bestätigt hast. Bisher: '+n+' von 3. Dein Forscherheft bleibt jederzeit zugänglich.</p></div>';
 document.getElementById('archiveList').innerHTML=unlocked?titles.map((t,i)=>'<article class="archive-entry"><h2>Mission '+(i+1)+' · '+t+'</h2><p>'+subtitles[i]+'</p><p class="status">'+(completed[i]?'✓ Heft-Check markiert':'Heft-Check noch offen')+'</p><button class="btn main" type="button" data-scene="mission-'+i+'">Mission öffnen</button></article>').join(''):'';
 document.getElementById('badgeList').innerHTML=unlocked?titles.map((t,i)=>'<article class="badge-unit'+(completed[i]?' earned':'')+'"><div class="badge-medal" aria-hidden="true">'+(completed[i]?'🏅':'◈')+'</div><strong>Abzeichen '+(i+1)+'</strong><small>'+t+'</small><small>'+(completed[i]?'Erhalten':'Noch offen')+'</small></article>').join(''):'';
 document.getElementById('archiveCertificate').classList.toggle('hidden',n!==7);
 updatePrologUI();
};
function openProlog(){current=-1;updatePrologUI();view('prolog');}
sceneAction=function(action){
 if(action==='prolog'){openProlog();return;}
 if(action==='certificate'){showCertificate();return;}
 baseSceneAction(action);
};
const solved=document.getElementById('missionSolved');
let solvedContext=null;
function dismissSolved(){if(solved.open)solved.close();}
function showSolved(kind,index=-1){
 solvedContext={kind,index};
 const isProlog=kind==='prolog';
 document.getElementById('solvedTitle').textContent=isProlog?'Expeditionsauftakt gesichert!':'Mission gelöst!';
 document.getElementById('solvedKicker').textContent=isProlog?'✦ PROLOG · OHNE WERTUNG':'✓ FELDNACHWEIS BESTÄTIGT';
 document.getElementById('solvedDescription').textContent=isProlog?'Deine erste Hypothese steht im analogen Forscherheft. Sie zählt nicht zu den sieben Missionsakten. In Mission 7 kannst du sie mit deinen Ergebnissen vergleichen.':'Dein Heft-Check für Mission '+(index+1)+' ist markiert. Du hast damit ein Abzeichen und 100 symbolische Forscherpunkte für deinen dokumentierten Arbeitsstand erhalten.';
 document.getElementById('solvedNext').textContent=isProlog?'Nächste Mission →':(index===6?'🏆 Urkunde ansehen':'Nächste Mission →');
 document.getElementById('solvedUndo').textContent=isProlog?'Prolog-Nachweis bewusst zurücknehmen':'Heft-Check bewusst zurücknehmen';
 if(!solved.open)solved.showModal();
 document.getElementById('solvedHome').focus();
}
document.getElementById('prologConfirm').onclick=()=>{
 if(!prologCompleted){prologCompleted=true;saveProlog();}
 refreshScene();showSolved('prolog');
};
document.getElementById('completeButton').onclick=()=>{
 if(current<0||current>=7)return;
 if(!completed[current]){completed[current]=true;save();}
 updateFooter();refreshScene();showSolved('mission',current);
};
document.getElementById('solvedClose').onclick=dismissSolved;
document.getElementById('solvedHome').onclick=()=>{dismissSolved();hub()};
document.getElementById('solvedNext').onclick=()=>{
 const c=solvedContext; dismissSolved();
 if(!c)return;
 if(c.kind==='prolog'){openMission(0);return;}
 if(c.index===6){showCertificate();return;}
 openMission(c.index+1);
};
document.getElementById('solvedUndo').onclick=()=>{
 const c=solvedContext;if(!c)return;
 const message=c.kind==='prolog'?'Möchtest du die Bestätigung des Prologs wirklich zurücknehmen? Dein Heft bleibt unverändert.':'Möchtest du den Heft-Check von Mission '+(c.index+1)+' wirklich zurücknehmen? Dein Forscherheft bleibt unverändert.';
 if(!confirm(message))return;
 if(c.kind==='prolog'){prologCompleted=false;saveProlog();refreshScene();dismissSolved();openProlog();}
 else{completed[c.index]=false;save();refreshScene();dismissSolved();current=c.index;updateFooter();view('play');}
};
function showCertificate(){
 const n=completed.filter(Boolean).length;
 const body=document.getElementById('certificateBody');
 if(n!==7){
  body.innerHTML='<div class="certificate-panel"><div class="seal">🔒</div><h1>Urkunde noch verschlossen</h1><p>Die Urkunde wird freigeschaltet, sobald du alle sieben Missionsakten in deinem analogen Forscherheft bestätigt hast.</p><p><strong>'+n+' von 7 Akten</strong> sind bisher markiert.</p><p>Der Prolog zählt bewusst nicht mit.</p></div>';
 }else{
  body.innerHTML='<div class="certificate-panel"><div class="seal" aria-hidden="true">🏆</div><p>AKTE 66 · Expedition ins verlorene Zeitalter</p><h1>Forschungsurkunde</h1><p>Für die dokumentierte Bearbeitung der sieben Forschungsmissionen</p><div class="certificate-name" aria-hidden="true"></div><p><em>Name handschriftlich ergänzen</em></p><h2>Rang: Forschungsleitung</h2><p>700 Forscherpunkte · 7 Forschungsabzeichen</p><p>Die wissenschaftlichen Ergebnisse stehen im persönlichen Forscherheft. Die fachliche Qualität wird im Forschungskongress durch die Klasse und die Lehrkraft besprochen.</p><p>Expeditionszentrale · '+new Date().toLocaleDateString('de-DE')+'</p></div>';
 }
 document.getElementById('certificatePrint').classList.toggle('hidden',n!==7);
 view('certificate');
}
document.getElementById('certificatePrint').onclick=()=>window.print();
// Vorhandene Spielstände unter dem alten Schlüssel bleiben unverändert und werden sofort berücksichtigt.

// Lernziele sind bewusst sichtbar, aber optional zu vertiefen – kein neuer Pflicht-Check.
const goalDialog=document.getElementById('learningGoalDialog');
document.getElementById('goalDialogList').innerHTML=missionGoals.map((m,i)=>'<article><h3>Mission '+(i+1)+' · '+titles[i]+'</h3><ul>'+m.goals.map(g=>'<li>'+g+'</li>').join('')+'</ul></article>').join('');
document.querySelectorAll('.goals-open').forEach(b=>b.addEventListener('click',()=>goalDialog.showModal()));
document.getElementById('goalDialogClose').addEventListener('click',()=>goalDialog.close());
goalDialog.addEventListener('click',e=>{if(e.target===goalDialog)goalDialog.close()});
drawCards();refreshScene();

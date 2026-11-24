const documents = "{{missions}}";
let current = -1,
  returnSection = "hub";
let completed = Array(7).fill(false);
try {
  const x = JSON.parse(localStorage.getItem("akte66-expedition-2026") || "null");
  if (Array.isArray(x) && x.length === 7) completed = x.map(Boolean);
} catch (e) {}
const sections = [
  "trailer",
  "cover",
  "hub",
  "helpers",
  "play",
  "archive",
  "settings",
  "prolog",
  "certificate",
];
function view(id) {
  sections.forEach((x) => document.getElementById(x).classList.toggle("hidden", id !== x));
  window.scrollTo(0, 0);
}
function drawCards() {
  document.getElementById("missions").innerHTML = titles
    .map(
      (t, i) =>
        `<article class="mission"><img src="${arts[i]}" alt="Expeditionsmotiv der Mission ${i + 1}" loading="lazy"><div class="txt"><div class="status">MISSION ${i + 1} · ${completed[i] ? "Heft-Check markiert" : "Noch offen"}</div><h2>${t}</h2><p>${subtitles[i]}</p><p class="mission-quick-goal"><strong>Ich kann:</strong> ${missionGoals[i].short}</p><button class="btn main" data-open="${i}">Mission starten</button></div></article>`,
    )
    .join("");
  document
    .querySelectorAll("[data-open]")
    .forEach((b) => b.addEventListener("click", () => openMission(+b.dataset.open)));
}
function save() {
  try {
    localStorage.setItem("akte66-expedition-2026", JSON.stringify(completed));
  } catch (e) {}
}
/* Navigation am tatsächlichen Ende jeder eingebetteten Forschungsmission.
   Der Heft-Check bleibt freiwillige Selbstauskunft und wird beim Wechsel nicht gesetzt. */
function missionWithNavigation(html, missionIndex) {
  const isFinal = missionIndex === 6;
  const nextText = isFinal ? "Zum Forschungsabschluss" : "Zur nächsten Mission";
  const nextAction = isFinal ? "abschluss" : "naechste";
  const nav = `<style>
 .akte66-endnav{max-width:1100px;margin:35px auto 32px;padding:23px 23px 25px;
 background:#17272d;color:#f8f0df;border:2px solid #b99659;border-radius:16px;
 box-shadow:0 10px 30px #0004;font:inherit;text-align:left}
 .akte66-endnav h2{font-size:clamp(20px,3vw,26px);line-height:1.2;margin:0 0 9px;color:#ffdf9e}
 .akte66-endnav p{font-size:16px;line-height:1.5;margin:0 0 17px;color:#f0e8d9}
 .akte66-endnav .nav-buttons{display:flex;flex-wrap:wrap;gap:12px}
 .akte66-endnav button{appearance:none;cursor:pointer;border:1px solid #ddba73;border-radius:10px;
 padding:14px 18px;min-height:48px;font:700 16px/1.3 system-ui,-apple-system,Segoe UI,sans-serif;
 background:#ecd6a9;color:#19242b}
 .akte66-endnav button.secondary{background:#253840;color:#faf1dc}
 .akte66-endnav button:hover{filter:brightness(1.1)}
 .akte66-endnav button:focus-visible{outline:3px solid #fff;outline-offset:3px}
 @media(max-width:570px){.akte66-endnav{margin:24px 12px;padding:17px}
 .akte66-endnav .nav-buttons{display:grid;grid-template-columns:1fr}
 .akte66-endnav button{width:100%}}
 </style>
 <nav class="akte66-endnav" aria-label="Navigation nach Abschluss der Mission">
  <h2>${isFinal ? "Die Forschungsreise abschließen" : "Wie möchtest du weiterforschen?"}</h2>
  <p>Prüfe kurz, ob deine Ergebnisse im Forscherheft stehen. Du kannst die Station später erneut öffnen.</p>
  <div class="nav-buttons">
   <button type="button" onclick="parent.postMessage({type:'akte66-mission-navigation',mission:${missionIndex},target:'${nextAction}'},'*')">${nextText} →</button>
   <button type="button" class="secondary" onclick="parent.postMessage({type:'akte66-mission-navigation',mission:${missionIndex},target:'zentrale'},'*')">Zur Expeditionszentrale</button>
  </div>
 </nav>`;
  return html.replace(/<\/body>/i, nav + "</body>");
}
window.addEventListener("message", (event) => {
  const data = event.data;
  const frame = document.getElementById("gameFrame");
  if (event.source !== frame.contentWindow || !data || data.type !== "akte66-mission-navigation") return;
  if (!Number.isInteger(data.mission) || data.mission !== current) return;
  if (data.target === "zentrale") {
    hub();
    return;
  }
  if (data.target === "naechste" && current < 6) {
    openMission(current + 1);
    return;
  }
  if (data.target === "abschluss" && current === 6) {
    showCertificate();
  }
});
function openMission(i) {
  current = i;
  document.getElementById("playTitle").textContent = `Mission ${i + 1} · ${titles[i]}`;
  const frame = document.getElementById("gameFrame");
  frame.srcdoc = missionWithNavigation(documents[i], i);
  document.getElementById("goalTeaser").textContent = missionGoals[i].short;
  document.getElementById("missionGoalItems").innerHTML = missionGoals[i].goals
    .map((g) => "<li>" + g + "</li>")
    .join("");
  document.getElementById("currentGoals").open = false;
  document.getElementById("completeButton").textContent = completed[i]
    ? "✓ Heft-Check markiert"
    : "Heft-Check markieren";
  document.getElementById("completeButton").classList.toggle("done", completed[i]);
  view("play");
}
function hub() {
  document.getElementById("gameFrame").removeAttribute("srcdoc");
  current = -1;
  drawCards();
  refreshScene();
  view("cover");
}
const trailerData = [
  {
    title: "EINE VERLORENE WELT",
    caption: "Vor 66 Millionen Jahren war die Erde voller Leben.",
    src: "{{asset:img/trailer/1-verlorene-welt.jpg}}",
  },
  {
    title: "EINE WELT IM WANDEL",
    caption: "Dann veränderte eine Katastrophe den Lauf ihrer Geschichte.",
    src: "{{asset:img/trailer/2-welt-im-wandel.jpg}}",
  },
  {
    title: "DIE SPUREN BLEIBEN",
    caption: "Was verraten Gesteinsschichten und Fossilien?",
    src: "{{asset:img/trailer/3-spuren-bleiben.jpg}}",
  },
  {
    title: "DAS GROSSE RÄTSEL",
    caption: "Warum verschwanden so viele Arten – und andere nicht?",
    src: "{{asset:img/trailer/4-grosses-raetsel.jpg}}",
  },
  {
    title: "JETZT BIST DU GEFRAGT",
    caption: "Beobachten. Untersuchen. Beweise vergleichen.",
    src: "{{asset:img/trailer/5-du-bist-gefragt.jpg}}",
  },
  {
    title: "AKTE 66",
    caption: "Expedition ins verlorene Zeitalter",
    src: "{{asset:img/trailer/6-akte-66.jpg}}",
  },
];
const trailerAudio = document.getElementById("trailerAudio");
const trailer = document.getElementById("trailer");
const trailerStatus = document.getElementById("trailerAudioStatus");
let trailerStartStamp = 0,
  trailerRunId = 0,
  trailerIsRunning = false,
  trailerSilent = false,
  trailerMuted = false;
const trailerDuration = 42000;
const trailerSegments = [0, 6900, 13800, 20700, 27600, 34500];
function prepareTrailer() {
  const shots = document.getElementById("trailerShots");
  trailerData.forEach((scene, i) => {
    const el = document.createElement("div");
    el.className = "trailer-shot" + (i === 0 ? " active" : "");
    el.style.backgroundImage = 'url("' + scene.src + '")';
    shots.appendChild(el);
  });
}
function setTrailerScene(i) {
  [...document.querySelectorAll("#trailerShots .trailer-shot")].forEach((shot, k) =>
    shot.classList.toggle("active", k === i),
  );
  const d = trailerData[i];
  document.getElementById("trailerTitle").textContent = d.title;
  document.getElementById("trailerCaption").textContent = d.caption;
  document.getElementById("trailerEyebrow").textContent =
    i === trailerData.length - 1 ? "DEINE MISSION BEGINNT JETZT" : "DIE EXPEDITION INS VERLORENE ZEITALTER";
}
function stopTrailerAudio() {
  try {
    trailerAudio.pause();
    trailerAudio.currentTime = 0;
  } catch (e) {}
}
function finishTrailer() {
  trailerIsRunning = false;
  cancelAnimationFrame(trailerRunId);
  stopTrailerAudio();
  trailer.classList.remove("staged");
  trailerStatus.textContent = "";
  view("cover");
}
function tickTrailer() {
  if (!trailerIsRunning) return;
  const elapsed = Math.max(0, performance.now() - trailerStartStamp);
  let scene = 0;
  for (let i = 0; i < trailerSegments.length; i++) if (elapsed >= trailerSegments[i]) scene = i;
  if (trailer._currentScene !== scene) {
    setTrailerScene(scene);
    trailer._currentScene = scene;
  }
  document.getElementById("trailerProgressFill").style.width =
    Math.min(100, (elapsed / trailerDuration) * 100) + "%";
  if (elapsed >= trailerDuration) {
    finishTrailer();
    return;
  }
  trailerRunId = requestAnimationFrame(tickTrailer);
}
function beginTrailer(silent = false) {
  if (trailerIsRunning) return;
  trailerSilent = !!silent;
  trailerMuted = !!silent;
  trailerIsRunning = true;
  trailer.classList.add("staged");
  trailer._currentScene = -1;
  setTrailerScene(0);
  trailer._currentScene = 0;
  trailerStartStamp = performance.now();
  stopTrailerAudio();
  trailerAudio.volume = 1;
  trailerAudio.muted = false;
  document.getElementById("trailerMute").textContent = silent ? "Musik an" : "Musik aus";
  if (!silent) {
    const playPromise = trailerAudio.play();
    if (playPromise && playPromise.catch)
      playPromise.catch(() => {
        trailerMuted = true;
        document.getElementById("trailerMute").textContent = "Musik an";
        trailerStatus.textContent = "Tippe auf „Musik an“, um den Ton zu aktivieren.";
      });
    trailerStatus.textContent = "";
  } else {
    trailerStatus.textContent = "";
  }
  cancelAnimationFrame(trailerRunId);
  tickTrailer();
}
function toggleTrailerMute() {
  if (!trailerIsRunning) return;
  if (trailerSilent) {
    trailerSilent = false;
    trailerMuted = false;
  } else trailerMuted = !trailerMuted;
  if (trailerMuted) {
    trailerAudio.pause();
  } else {
    trailerAudio.currentTime = Math.min(Math.max(0, (performance.now() - trailerStartStamp) / 1000), 40.5);
    const p = trailerAudio.play();
    if (p && p.catch)
      p.catch(() => {
        trailerStatus.textContent = "Tippe erneut auf „Musik an“.";
      });
  }
  document.getElementById("trailerMute").textContent = trailerMuted ? "Musik an" : "Musik aus";
  document
    .getElementById("trailerMute")
    .setAttribute("aria-label", trailerMuted ? "Musik einschalten" : "Musik stummschalten");
  trailerStatus.textContent = "";
}
document.getElementById("trailerPlay").onclick = () => beginTrailer(false);
document.getElementById("trailerSilent").onclick = () => beginTrailer(true);
document.getElementById("trailerSkipInitial").onclick = finishTrailer;
document.getElementById("trailerSkip").onclick = finishTrailer;
document.getElementById("trailerMute").onclick = toggleTrailerMute;
document.addEventListener("keydown", (e) => {
  if (!trailer.classList.contains("hidden") && e.key === "Escape") {
    e.preventDefault();
    finishTrailer();
  }
});

document.getElementById("coverBack").onclick = () => view("cover");
document.getElementById("toHub").onclick = hub;
document.getElementById("helpOpen").onclick = () => {
  returnSection = "hub";
  view("helpers");
};
document.getElementById("playHelp").onclick = () => {
  returnSection = "play";
  view("helpers");
};
document.getElementById("helpBack").onclick = () => view(returnSection);
document.getElementById("completeButton").onclick = () => {
  if (current < 0) return;
  completed[current] = !completed[current];
  save();
  document.getElementById("completeButton").classList.toggle("done", completed[current]);
  document.getElementById("completeButton").textContent = completed[current]
    ? "✓ Heft-Check markiert"
    : "Heft-Check markieren";
  refreshScene();
};

// Bedienelemente der bildbasierten Expeditionszentrale.
function refreshScene() {
  const n = completed.filter(Boolean).length;
  document.getElementById("sceneCompletion").textContent = n + " / 7";
  document.getElementById("sceneProgress").innerHTML = completed
    .map((ok) => '<span class="scene-dot' + (ok ? " done" : "") + '"></span>')
    .join("");
  const count = document.getElementById("archiveCount");
  if (count) count.textContent = n + " von 7 Heft-Checks markiert";
  document.getElementById("archiveList").innerHTML = titles
    .map(
      (t, i) =>
        '<article class="archive-entry"><h2>Mission ' +
        (i + 1) +
        " · " +
        t +
        "</h2><p>" +
        subtitles[i] +
        '</p><p class="status">' +
        (completed[i] ? "✓ Heft-Check markiert" : "Heft-Check noch offen") +
        '</p><button class="btn main" type="button" data-scene="mission-' +
        i +
        '">Mission öffnen</button></article>',
    )
    .join("");
}
function showSceneHelp(type) {
  returnSection = current >= 0 ? "play" : "cover";
  const title = document.querySelector("#helpers .brand");
  if (title) title.textContent = type === "notebook" ? "Dein Forscherheft" : "Hilfen zur Expedition";
  view("helpers");
}
function sceneAction(action) {
  if (action.startsWith("mission-")) {
    const i = Number(action.slice(8));
    if (Number.isInteger(i) && i >= 0 && i < 7) openMission(i);
    return;
  }
  if (action === "home") {
    if (current >= 0) {
      hub();
    } else {
      refreshScene();
      view("cover");
    }
    return;
  }
  if (action === "notebook" || action === "help") {
    showSceneHelp(action);
    return;
  }
  if (action === "archive" || action === "settings") {
    refreshScene();
    view(action);
    return;
  }
  if (action === "replay") {
    view("trailer");
    try {
      stopTrailerAudio();
    } catch (e) {}
    trailerIsRunning = false;
    trailer.classList.remove("staged");
    setTrailerScene(0);
    document.getElementById("trailerProgressFill").style.width = "0%";
    return;
  }
  if (action === "fullscreen") {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        const p = document.documentElement.requestFullscreen();
        if (p && p.catch) p.catch(() => {});
      } else {
        alert("Auf diesem Gerät ist der Vollbildmodus möglicherweise nicht verfügbar.");
      }
    } catch (e) {}
  }
}
document.addEventListener("click", (e) => {
  const button = e.target.closest("[data-scene]");
  if (button) sceneAction(button.dataset.scene);
});
document.querySelector(".scene-shell").addEventListener("keydown", (e) => {
  if (e.target !== e.currentTarget) return;
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    e.currentTarget.scrollBy({ left: e.key === "ArrowRight" ? 260 : -260, behavior: "smooth" });
  }
});
document.getElementById("resetProgress").addEventListener("click", () => {
  if (
    !confirm(
      "Möchtest du wirklich alle sieben Fortschrittsmarkierungen auf diesem Gerät löschen? Dein Forscherheft aus Papier bleibt unverändert.",
    )
  )
    return;
  completed = Array(7).fill(false);
  save();
  refreshScene();
  document.getElementById("resetNotice").textContent = "Die Fortschrittsanzeige wurde zurückgesetzt.";
});

drawCards();
refreshScene();
prepareTrailer();
view("trailer");

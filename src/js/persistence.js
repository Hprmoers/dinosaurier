/* AKTE 66 – Fortschritt über Neuladen hinweg erhalten.
   1) Ort merken (Ansicht + offene Mission) -> nach Reload dort weitermachen, Trailer nur beim ersten Besuch.
   2) Missionsstand: echte Klicks im Missions-iframe werden aufgezeichnet und beim Öffnen
      der Mission erneut abgespielt (Missionsdateien bleiben unverändert).
   Muss NACH app.js und prolog-progress.js laufen (überschreibt view/missionWithNavigation). */
const placeKey = "akte66-ort-v1";
const missionLogKey = (i) => "akte66-mission-" + i + "-v1";
const missionLogLimit = 2000;
const docHashes = [];
function docHash(i) {
  if (docHashes[i] === undefined) {
    let h = 0;
    const s = documents[i];
    for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) | 0;
    docHashes[i] = h;
  }
  return docHashes[i];
}
function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (e) {
    return null;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}
function loadMissionLog(i) {
  const x = readJSON(missionLogKey(i));
  return x && x.hash === docHash(i) && Array.isArray(x.log) ? x.log : [];
}
function saveMissionLog(i, log) {
  writeJSON(missionLogKey(i), { hash: docHash(i), log: log.slice(0, missionLogLimit) });
}
function clearMissionLogs() {
  for (let i = 0; i < 7; i++) {
    try {
      localStorage.removeItem(missionLogKey(i));
    } catch (e) {}
  }
}

/* Läuft im Missions-iframe (wird per toString() eingefügt) – keine Bezüge auf Variablen der Hauptseite! */
function akte66MissionRecorder(mission, log) {
  const send = (entry) => parent.postMessage({ type: "akte66-mission-log", mission, entry }, "*");
  const pathOf = (el) => {
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      if (el.id && document.querySelectorAll('[id="' + el.id.replace(/"/g, "") + '"]').length === 1) {
        parts.unshift("#" + el.id);
        return parts.join(">");
      }
      parts.unshift([...el.parentElement.children].indexOf(el));
      el = el.parentElement;
    }
    parts.unshift("body");
    return parts.join(">");
  };
  const find = (path) => {
    const parts = path.split(">");
    const first = parts.shift();
    let el = first === "body" ? document.body : document.getElementById(first.slice(1));
    for (const p of parts) {
      if (!el) return null;
      el = el.children[+p];
    }
    return el || null;
  };
  let replaying = false,
    skipControl = null;
  const confirmQueue = [];
  const realConfirm = window.confirm.bind(window),
    realTimeout = window.setTimeout.bind(window);
  window.confirm = (msg) => {
    if (replaying) return confirmQueue.length ? confirmQueue.shift() : true;
    const r = realConfirm(msg);
    send(["confirm", r]);
    return r;
  };
  window.setTimeout = (fn, delay, ...args) => {
    if (replaying && typeof fn === "function" && (delay || 0) <= 1000) {
      fn(...args);
      return 0;
    }
    return realTimeout(fn, delay, ...args);
  };
  document.addEventListener(
    "click",
    (e) => {
      if (!e.isTrusted) return;
      const t = e.target;
      if (!(t instanceof Element) || t.closest(".akte66-endnav")) return;
      if (skipControl && t === skipControl) {
        skipControl = null;
        return;
      } // vom Label weitergereichter Klick
      const a = t.closest("a[href]");
      if (a && !a.getAttribute("href").startsWith("#")) return;
      const label = t.closest("label");
      if (label && label.control) {
        skipControl = label.control;
        realTimeout(() => {
          skipControl = null;
        }, 0);
      }
      send(["click", pathOf(t)]);
    },
    true,
  );
  const replay = () => {
    if (!log.length) return;
    replaying = true;
    try {
      for (let k = 0; k < log.length; k++) {
        const entry = log[k];
        if (!Array.isArray(entry) || entry[0] !== "click") continue;
        confirmQueue.length = 0;
        while (log[k + 1] && log[k + 1][0] === "confirm") confirmQueue.push(!!log[++k][1]);
        const el = find(String(entry[1]));
        if (el) {
          try {
            el.click();
          } catch (err) {}
        }
      }
    } finally {
      replaying = false;
      confirmQueue.length = 0;
    }
    document.querySelectorAll("dialog[open]").forEach((d) => {
      try {
        d.close();
      } catch (e) {}
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", replay);
  else replay();
}

const baseMissionWithNavigation = missionWithNavigation;
missionWithNavigation = function (html, i) {
  const log = JSON.stringify(loadMissionLog(i)).replace(/</g, "\\u003c");
  const restart =
    '<p style="margin:16px 0 0"><button type="button" class="secondary" onclick="parent.postMessage({type:\'akte66-mission-restart\',mission:' +
    i +
    "},'*')\">↺ Mission neu beginnen</button></p>";
  // Schluss-Tag getrennt schreiben ("<" + "/script>"): zusammenhängend würde er das Inline-Script
  // der Hauptseite beenden, und Prettier entfernt eine Maskierung mit Backslash wieder.
  const extra = "<script>(" + akte66MissionRecorder.toString() + ")(" + i + "," + log + ");<" + "/script>";
  return baseMissionWithNavigation(html, i)
    .replace(/<\/nav>(?![\s\S]*<\/nav>)/, restart + "</nav>")
    .replace(/<\/body>(?![\s\S]*<\/body>)/i, extra + "</body>");
};
window.addEventListener("message", (event) => {
  const data = event.data,
    frame = document.getElementById("gameFrame");
  if (event.source !== frame.contentWindow || !data || data.mission !== current || current < 0) return;
  if (data.type === "akte66-mission-log" && Array.isArray(data.entry)) {
    const log = loadMissionLog(current);
    log.push(data.entry);
    saveMissionLog(current, log);
  } else if (data.type === "akte66-mission-restart") {
    if (
      !confirm(
        "Mission " +
          (current + 1) +
          " von vorn beginnen? Deine Antworten in dieser Mission werden auf diesem Gerät gelöscht. Dein Forscherheft bleibt unverändert.",
      )
    )
      return;
    try {
      localStorage.removeItem(missionLogKey(current));
    } catch (e) {}
    openMission(current);
  }
});

/* Ort merken */
const baseView = view;
view = function (id) {
  baseView(id);
  if (id === "trailer") return; // Vorspann ist kein Ort zum Weitermachen
  writeJSON(placeKey, { view: id, mission: current });
};
function restorePlace(place) {
  const v = place.view,
    m = place.mission;
  if (Number.isInteger(m) && m >= 0 && m < 7 && (v === "play" || v === "helpers")) {
    openMission(m);
    if (v === "helpers") {
      returnSection = "play";
      view("helpers");
    }
    return;
  }
  if (v === "prolog") {
    openProlog();
    return;
  }
  if (v === "certificate") {
    showCertificate();
    return;
  }
  if (v === "archive" || v === "settings" || v === "hub") {
    refreshScene();
    view(v);
    return;
  }
  view("cover");
}
document.getElementById("resetMissionState").addEventListener("click", () => {
  if (
    !confirm(
      "Möchtest du die Antworten und Stufen aller Missionen auf diesem Gerät löschen? Heft-Checks und dein Forscherheft bleiben unverändert.",
    )
  )
    return;
  clearMissionLogs();
  document.getElementById("resetNotice").textContent = "Die Missionsstände wurden zurückgesetzt.";
});
{
  const place = readJSON(placeKey);
  if (place && typeof place.view === "string") {
    stopTrailerAudio();
    try {
      restorePlace(place);
    } catch (e) {
      view("cover");
    }
  }
}

/* ═══════════════════════════════════════════════════
   MSEUF Concert Singers – Choir Assessment Sheet
   app.js  |  Supabase shared database
═══════════════════════════════════════════════════ */

// ── Supabase ──
const SUPABASE_URL = "https://brpmjziododrlsmttcss.supabase.co";
const SUPABASE_KEY = "sb_publishable_av-lxhsq54_6MTYULxIuiw_pPtP5yuk";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════ CRITERIA ═══════════════════
// Original scoring restored: Excellent=30, Very Sat=24, Sat=18, Fair=12, Poor=6 or Poor=4
// Voice & Musicality are worth 30 pts max each (combined sub-criteria)
// Pronunciation, Timing, Stage Presence, Mastery are 10 pts max each
// Total = 30 + 30 + 10 + 10 + 10 + 10 = 100
const CRITERIA = [
  {
    id:        "voice",
    group:     "Voice",
    label:     "Quality & Tone",
    icon:      "🎙",
    max:       30,
    excellent: 30,
    verySat:   24,
    sat:       18,
    fair:      12,
    poor:      6,
    poor4:     4
  },
  {
    id:        "musicality",
    group:     "Musicality",
    label:     "Interpretation & Dynamics",
    icon:      "🎵",
    max:       30,
    excellent: 30,
    verySat:   24,
    sat:       18,
    fair:      12,
    poor:      6,
    poor4:     4
  },
  {
    id:        "pronunciation",
    group:     "Pronunciation",
    label:     "Clarity & Enunciation",
    icon:      "💬",
    max:       10,
    excellent: 10,
    verySat:   8,
    sat:       6,
    fair:      4,
    poor:      2,
    poor4:     1
  },
  {
    id:        "timing",
    group:     "Timing / Rhythm",
    label:     "Pace & Synchronization with Music",
    icon:      "🥁",
    max:       10,
    excellent: 10,
    verySat:   8,
    sat:       6,
    fair:      4,
    poor:      2,
    poor4:     1
  },
  {
    id:        "stage",
    group:     "Stage Presence",
    label:     "Confidence & Expression",
    icon:      "🌟",
    max:       10,
    excellent: 10,
    verySat:   8,
    sat:       6,
    fair:      4,
    poor:      2,
    poor4:     1
  },
  {
    id:        "mastery",
    group:     "Mastery of Lyrics",
    label:     "No error or lapses in memory",
    icon:      "📖",
    max:       10,
    excellent: 10,
    verySat:   8,
    sat:       6,
    fair:      4,
    poor:      2,
    poor4:     1
  }
];

// 6 rating levels — poor = 6 (or 2 for small criteria), poor4 = 4 (or 1)
const LEVELS       = ["excellent", "verySat", "sat", "fair", "poor", "poor4"];
const LEVEL_LABELS = ["Excellent", "Very Satisfactory", "Satisfactory", "Fair", "Poor (6/2)", "Poor (4/1)"];
const MAX_TOTAL    = 100;  // 30 + 30 + 10 + 10 + 10 + 10

// ── Runtime state ──
let records      = [];
let photos       = [];   // { id, dataUrl, name }
let songComments = [];   // { id, song, assessor, comment }

// ═══════════════════ HELPERS ═══════════════════
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getGrade(total) {
  const pct = (total / MAX_TOTAL) * 100;
  if (pct >= 90) return { label: "Outstanding",  bg: "rgba(201,168,76,.18)",  col: "#e8c97a" };
  if (pct >= 75) return { label: "Very Good",    bg: "rgba(184,144,128,.18)", col: "#c9a07a" };
  if (pct >= 60) return { label: "Good",         bg: "rgba(139,26,40,.35)",   col: "#f5a0b0" };
  if (pct >= 45) return { label: "Fair",         bg: "rgba(248,81,73,.15)",   col: "#f85149" };
  return              { label: "Needs Work",   bg: "rgba(110,118,129,.15)", col: "#8b949e" };
}

// Toast
let toastTimer;
function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent      = msg;
  t.style.background = isError
    ? "linear-gradient(135deg,#f85149,#ff6b6b)"
    : "linear-gradient(135deg,#c9a84c,#e8c97a)";
  t.style.color = isError ? "#fff" : "#2d0609";
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

// ═══════════════════ SUPABASE ═══════════════════
async function loadRecords() {
  const list = document.getElementById("records-list");
  list.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><p>Loading shared assessments…</p></div>`;

  try {
    const { data, error } = await db
      .from("records")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    records = data || [];
    renderRecords();
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>Could not load records. Check connection.</p><p style="font-size:.75rem;margin-top:6px">${escapeHtml(err.message)}</p></div>`;
  }
}

// ═══════════════════ SONG COMMENT ENTRIES (FORM) ═══════════════════
function addSongEntry() {
  const song     = document.getElementById("inp-song-title").value.trim();
  const assessor = document.getElementById("inp-song-assessor").value.trim();
  const comment  = document.getElementById("inp-song-comment").value.trim();

  if (!song) { showToast("⚠ Please enter a song title", true); return; }
  if (!comment) { showToast("⚠ Please enter a comment for this song", true); return; }

  songComments.push({
    id:       "sc" + Date.now(),
    song,
    assessor,
    comment
  });

  // Clear inputs
  document.getElementById("inp-song-title").value    = "";
  document.getElementById("inp-song-assessor").value = "";
  document.getElementById("inp-song-comment").value  = "";

  renderSongEntries();
  showToast("Song entry added");
}

function removeSongEntry(id) {
  songComments = songComments.filter(s => s.id !== id);
  renderSongEntries();
}

function renderSongEntries() {
  const container = document.getElementById("song-entries");
  if (!songComments.length) { container.innerHTML = ""; return; }

  container.innerHTML = songComments.map((s, i) => `
    <div style="background:var(--card2);border:1px solid var(--border2);border-radius:10px;
                padding:14px;margin-bottom:10px;position:relative">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
        <div>
          <div style="font-size:.95rem;font-weight:700;color:var(--gold-light)">🎵 ${escapeHtml(s.song)}</div>
          ${s.assessor ? `<div style="font-size:.74rem;color:var(--muted);margin-top:2px">👤 ${escapeHtml(s.assessor)}</div>` : ""}
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeSongEntry('${s.id}')">🗑 Remove</button>
      </div>
      <div style="font-size:.85rem;line-height:1.6;color:var(--text);border-top:1px solid var(--border);padding-top:8px;margin-top:4px;white-space:pre-wrap;word-break:break-word">
        ${escapeHtml(s.comment)}
      </div>
    </div>`).join("");
}

async function saveRecord() {
  const name = document.getElementById("inp-name").value.trim();
  if (!name) { showToast("⚠ Please enter performer/group name", true); return; }

  const btn = document.getElementById("save-btn");
  btn.textContent = "Saving…";
  btn.disabled    = true;

  const scores = {};
  let total    = 0;
  CRITERIA.forEach(c => {
    const checked = document.querySelector(`input[name="${c.id}"]:checked`);
    scores[c.id]  = checked ? parseInt(checked.value) : 0;
    total        += scores[c.id];
  });

  const record = {
    id:           "r" + Date.now(),
    name,
    date:         document.getElementById("inp-date").value || new Date().toISOString().split("T")[0],
    voice:        document.getElementById("inp-voice").value,
    assessor:     document.getElementById("inp-assessor").value.trim(),
    event:        document.getElementById("inp-event").value.trim(),
    songComments: songComments.map(s => ({ ...s })),
    scores,
    total,
    comment:      "",   // kept for backward compat
    photos:       photos.map(p => ({ ...p })),
    notes:        [],
    created_at:   new Date().toISOString()
  };

  try {
    const { error } = await db.from("records").insert([record]);
    if (error) throw error;
    showToast("✅ Assessment saved and shared!");
    resetForm();
    switchTab("records");
    await loadRecords();
  } catch (err) {
    console.error(err);
    showToast("❌ Save failed: " + err.message, true);
  } finally {
    btn.textContent = "💾 Save & Share Assessment";
    btn.disabled    = false;
  }
}

async function updateRecord(id, changes) {
  try {
    const { error } = await db.from("records").update(changes).eq("id", id);
    if (error) throw error;
    records = records.map(r => r.id === id ? { ...r, ...changes } : r);
  } catch (err) {
    console.error(err);
    showToast("❌ Update failed.", true);
  }
}

async function deleteRecord(id) {
  if (!confirm("Delete this assessment for ALL users permanently?")) return;
  try {
    const { error } = await db.from("records").delete().eq("id", id);
    if (error) throw error;
    records = records.filter(r => r.id !== id);
    closeModal();
    renderRecords();
    showToast("Assessment deleted");
  } catch (err) {
    console.error(err);
    showToast("❌ Delete failed.", true);
  }
}

// ── Notes ──
async function addComment(recordId) {
  const inp  = document.getElementById("new-comment-" + recordId);
  const text = inp ? inp.value.trim() : "";
  if (!text) return;
  const r = records.find(x => x.id === recordId);
  if (!r) return;
  const updatedNotes = [...(r.notes || []), { id: "n" + Date.now(), text, time: new Date().toISOString() }];
  await updateRecord(recordId, { notes: updatedNotes });
  showToast("Note added");
  openRecordDetail(recordId);
}

async function deleteComment(recordId, noteId) {
  const r = records.find(x => x.id === recordId);
  if (!r) return;
  const updatedNotes = (r.notes || []).filter(n => n.id !== noteId);
  await updateRecord(recordId, { notes: updatedNotes });
  showToast("Note deleted");
  openRecordDetail(recordId);
}

// ── Photos inside saved record ──
function addPhotoToRecord(recordId, event) {
  const r = records.find(x => x.id === recordId);
  if (!r) return;
  Array.from(event.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = async ev => {
      const updatedPhotos = [...(r.photos || []), {
        id: "p" + Date.now() + Math.random().toString(36).slice(2),
        dataUrl: ev.target.result, name: file.name
      }];
      await updateRecord(recordId, { photos: updatedPhotos });
      showToast("Photo added");
      openRecordDetail(recordId);
    };
    reader.readAsDataURL(file);
  });
}

async function deletePhotoFromRecord(recordId, photoId) {
  const r = records.find(x => x.id === recordId);
  if (!r) return;
  const updatedPhotos = (r.photos || []).filter(p => p.id !== photoId);
  await updateRecord(recordId, { photos: updatedPhotos });
  showToast("Photo removed");
  openRecordDetail(recordId);
}

// ═══════════════════ PHOTO UPLOAD (FORM) ═══════════════════
function handlePhotoUpload(e) {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      photos.push({ id: "p" + Date.now() + Math.random().toString(36).slice(2), dataUrl: ev.target.result, name: file.name });
      renderPhotoGrid();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = "";
}

function renderPhotoGrid() {
  const grid = document.getElementById("photo-grid");
  if (!photos.length) { grid.innerHTML = ""; return; }
  grid.innerHTML = photos.map(p => `
    <div class="photo-item" id="photo-${p.id}">
      <img src="${p.dataUrl}" alt="${escapeHtml(p.name)}">
      <div class="photo-overlay">
        <button class="btn btn-sm btn-danger" onclick="deletePhoto('${p.id}')">🗑</button>
      </div>
      <div class="photo-caption">${escapeHtml(p.name)}</div>
    </div>`).join("");
}

function deletePhoto(id) {
  photos = photos.filter(p => p.id !== id);
  renderPhotoGrid();
  showToast("Photo removed");
}

function initDragDrop() {
  const zone = document.getElementById("upload-zone");
  zone.addEventListener("dragover",  e => { e.preventDefault(); zone.classList.add("drag"); });
  zone.addEventListener("dragleave", ()  => zone.classList.remove("drag"));
  zone.addEventListener("drop",      e  => {
    e.preventDefault(); zone.classList.remove("drag");
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    handlePhotoUpload({ target: { files, value: "" } });
  });
}

// ═══════════════════ RESET FORM ═══════════════════
function resetForm() {
  ["inp-name","inp-assessor","inp-event","inp-song-title","inp-song-assessor","inp-song-comment"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("inp-date").value  = new Date().toISOString().split("T")[0];
  document.getElementById("inp-voice").value = "";

  CRITERIA.forEach(c => {
    document.querySelectorAll(`input[name="${c.id}"]`).forEach(r => r.checked = false);
    const el = document.getElementById(`score-${c.id}`);
    if (el) el.textContent = "–";
  });
  photos       = [];
  songComments = [];
  renderPhotoGrid();
  renderSongEntries();
  updateTotal();
}

// ═══════════════════ BUILD CRITERIA ROWS ═══════════════════
function buildCriteriaRows() {
  const container = document.getElementById("criteria-rows");
  let html = "";

  CRITERIA.forEach(c => {
    html += `
      <div class="section-label">${c.icon} ${c.group}</div>
      <div class="criteria-row" id="row-${c.id}">
        <div class="criteria-name">
          ${c.label}
          <small>Max: ${c.max} pts</small>
        </div>
        ${LEVELS.map((lvl, i) => `
          <div class="rating-cell">
            <div class="max">${c[lvl]}</div>
            <div class="radio-group">
              <input type="radio" name="${c.id}" id="${c.id}_${lvl}" value="${c[lvl]}" onchange="updateTotal()">
              <label for="${c.id}_${lvl}">${c[lvl]}</label>
            </div>
          </div>`).join("")}
        <div class="score-display" id="score-${c.id}">–</div>
      </div>`;
  });

  container.innerHTML = html;
}

// ═══════════════════ LIVE SCORE ═══════════════════
function updateTotal() {
  let total = 0;
  CRITERIA.forEach(c => {
    const checked = document.querySelector(`input[name="${c.id}"]:checked`);
    const val     = checked ? parseInt(checked.value) : 0;
    const el      = document.getElementById(`score-${c.id}`);
    if (el) el.textContent = checked ? val : "–";
    total += val;
  });

  document.getElementById("total-score").textContent = total;
  const pct = Math.round((total / MAX_TOTAL) * 100);
  document.getElementById("progress-fill").style.width = Math.min(pct, 100) + "%";
  document.getElementById("progress-pct").textContent  = Math.min(pct, 100) + "%";

  const { label, bg, col } = getGrade(total);
  const badge = document.getElementById("grade-badge");
  badge.textContent      = label;
  badge.style.background = bg;
  badge.style.color      = col;
}

// ═══════════════════ RENDER RECORDS WITH SORT/FILTER ═══════════════════
function renderRecords() {
  const query      = (document.getElementById("search-input").value || "").toLowerCase();
  const voiceFilter = document.getElementById("filter-voice").value;
  const sortBy     = document.getElementById("sort-by").value;
  const list       = document.getElementById("records-list");
  const countEl    = document.getElementById("records-count");

  // 1. Filter
  let filtered = records.filter(r => {
    // flatten all song titles and comments for searching
    const songText = (r.songComments || []).map(s => `${s.song} ${s.comment} ${s.assessor}`).join(" ").toLowerCase();
    const matchQ = !query ||
      (r.name      || "").toLowerCase().includes(query) ||
      (r.event     || "").toLowerCase().includes(query) ||
      (r.voice     || "").toLowerCase().includes(query) ||
      (r.assessor  || "").toLowerCase().includes(query) ||
      songText.includes(query);

    const matchV = !voiceFilter || r.voice === voiceFilter;
    return matchQ && matchV;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "date-desc":  return new Date(b.date) - new Date(a.date);
      case "date-asc":   return new Date(a.date) - new Date(b.date);
      case "score-desc": return b.total - a.total;
      case "score-asc":  return a.total - b.total;
      case "name-asc":   return (a.name||"").localeCompare(b.name||"");
      case "voice":
        const order = ["Soprano 1","Soprano 2","Soprano","Alto 1","Alto 2","Alto","Tenor 1","Tenor 2","Tenor","Bass 1","Bass 2","Bass","Full Choir","Mixed",""];
        return order.indexOf(a.voice||"") - order.indexOf(b.voice||"");
      default: return 0;
    }
  });

  // 3. Count label
  countEl.textContent = filtered.length
    ? `Showing ${filtered.length} of ${records.length} assessment${records.length !== 1 ? "s" : ""}`
    : "";

  // 4. Empty state
  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>${query || voiceFilter ? "No matching assessments found." : "No assessments yet. Create the first one!"}</p>
      </div>`;
    return;
  }

  // 5. Render cards — grouped by date when sorted by date
  let html = "";
  let lastDate = "";

  filtered.forEach(r => {
    const { label, bg, col } = getGrade(r.total);

    // Date group header when sorting by date
    if (sortBy === "date-desc" || sortBy === "date-asc") {
      const d = r.date || "";
      if (d !== lastDate) {
        lastDate = d;
        const formatted = d ? new Date(d + "T00:00:00").toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" }) : "No date";
        html += `<div style="font-size:.72rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--border)">📅 ${formatted}</div>`;
      }
    }

    // Voice group header when sorting by voice
    if (sortBy === "voice") {
      const v = r.voice || "Unspecified";
      if (v !== lastDate) {
        lastDate = v;
        html += `<div style="font-size:.72rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--border)">🎤 ${v}</div>`;
      }
    }

    html += `
      <div class="record-card" onclick="openRecordDetail('${r.id}')">
        <div class="record-header">
          <div>
            <div class="record-name">${escapeHtml(r.name)}</div>
            <div class="record-meta">
              📅 ${r.date || "N/A"}
              ${r.voice    ? ` &nbsp;·&nbsp; 🎤 ${escapeHtml(r.voice)}`   : ""}
              ${r.event    ? ` &nbsp;·&nbsp; 📌 ${escapeHtml(r.event)}`   : ""}
              ${r.assessor ? ` &nbsp;·&nbsp; 👤 ${escapeHtml(r.assessor)}`: ""}
            </div>
          </div>
          <div class="record-score">
            <div class="big">${r.total}</div>
            <div class="sub">/100 pts</div>
          </div>
        </div>
        <div class="record-tags" style="margin-top:8px">
          <span class="tag" style="background:${bg};color:${col};border-color:${col}40">${label}</span>
          ${r.voice ? `<span class="tag">🎤 ${escapeHtml(r.voice)}</span>` : ""}
          ${(r.songComments||[]).map(s => `<span class="tag">🎵 ${escapeHtml(s.song)}</span>`).join("")}
          ${(r.photos||[]).length > 0  ? `<span class="tag">📷 ${r.photos.length}</span>` : ""}
          ${(r.songComments||[]).length > 0 ? `<span class="tag">💬 ${r.songComments.length} song comment${r.songComments.length > 1 ? "s" : ""}</span>` : ""}
          ${(r.notes||[]).length  > 0  ? `<span class="tag">💭 ${r.notes.length} note${r.notes.length > 1 ? "s" : ""}</span>` : ""}
        </div>
      </div>`;
  });

  list.innerHTML = html;
}

// ═══════════════════ RECORD DETAIL MODAL ═══════════════════
function openRecordDetail(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  const { label, bg, col } = getGrade(r.total);

  // Score breakdown bars
  let breakdownHtml = "";
  CRITERIA.forEach(c => {
    const score = (r.scores || {})[c.id] || 0;
    const pct   = (score / c.max) * 100;
    breakdownHtml += `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:.83rem">
        <div style="width:10px;text-align:center">${c.icon}</div>
        <div style="width:180px;flex-shrink:0;color:var(--text)">${c.label}</div>
        <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="width:44px;text-align:right;font-weight:700;color:var(--gold-light)">${score}/${c.max}</div>
      </div>`;
  });

  // Photos html
  const photosHtml = (r.photos||[]).length
    ? `<div class="photo-grid" style="margin-top:0">
         ${r.photos.map(p => `
           <div class="photo-item">
             <img src="${p.dataUrl}" alt="${escapeHtml(p.name)}">
             <div class="photo-overlay">
               <button class="btn btn-sm btn-danger" onclick="deletePhotoFromRecord('${r.id}','${p.id}')">🗑</button>
             </div>
             <div class="photo-caption">${escapeHtml(p.name)}</div>
           </div>`).join("")}
       </div>`
    : `<p style="color:var(--muted);font-size:.83rem">No photos attached.</p>`;

  // Notes html
  const notesHtml = (r.notes||[]).length
    ? (r.notes).map(n => `
        <div class="comment-item">
          <div class="comment-meta">
            <span>🕐 ${new Date(n.time).toLocaleString()}</span>
            <button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:.68rem"
                    onclick="deleteComment('${r.id}','${n.id}')">Delete</button>
          </div>
          <div class="comment-text" style="white-space:pre-wrap;word-break:break-word">${escapeHtml(n.text)}</div>
        </div>`).join("")
    : `<p style="color:var(--muted);font-size:.83rem;margin-bottom:8px">No notes yet.</p>`;

  const html = `
    <!-- Info summary -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;
                margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:1.2rem;font-family:'Playfair Display',serif;color:var(--text)">${escapeHtml(r.name)}</div>
        <div style="font-size:.76rem;color:var(--muted);margin-top:4px;line-height:1.7">
          📅 ${r.date || "N/A"}<br>
          ${r.voice    ? `🎤 ${escapeHtml(r.voice)}<br>`   : ""}
          ${r.event    ? `📌 ${escapeHtml(r.event)}<br>`   : ""}
          ${r.assessor ? `👤 ${escapeHtml(r.assessor)}`    : ""}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Playfair Display',serif;font-size:2.2rem;color:var(--gold);line-height:1">
          ${r.total}<span style="font-size:1rem;color:var(--muted)">/100</span>
        </div>
        <div style="background:${bg};color:${col};padding:4px 14px;border-radius:20px;font-size:.8rem;font-weight:700;display:inline-block;margin-top:4px">${label}</div>
      </div>
    </div>

    <!-- Score breakdown -->
    <div style="background:var(--surface);border-radius:10px;padding:14px;margin-bottom:14px;border:1px solid var(--border)">
      <div style="font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Score Breakdown</div>
      ${breakdownHtml}
    </div>

    <!-- Song Comments -->
    <div style="margin-bottom:14px">
      <div style="font-size:.7rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">🎵 Songs &amp; Assessor Comments</div>
      ${(r.songComments||[]).length === 0
        ? `<p style="color:var(--muted);font-size:.83rem">No song comments recorded.</p>`
        : (r.songComments).map(s => `
          <div style="background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:13px;margin-bottom:9px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;gap:8px">
              <div style="font-size:.95rem;font-weight:700;color:var(--gold-light)">🎵 ${escapeHtml(s.song)}</div>
              ${s.assessor ? `<div style="font-size:.74rem;color:var(--muted);white-space:nowrap">👤 ${escapeHtml(s.assessor)}</div>` : ""}
            </div>
            <div style="font-size:.86rem;line-height:1.6;color:var(--text);border-top:1px solid var(--border);padding-top:7px;white-space:pre-wrap;word-break:break-word">${escapeHtml(s.comment)}</div>
          </div>`).join("")
      }
    </div>

    <!-- Photos -->
    <div style="margin-bottom:14px">
      <div style="font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">📷 Photos</div>
      <label style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;
                    border:1px dashed var(--border2);border-radius:7px;cursor:pointer;
                    font-size:.78rem;color:var(--gold);margin-bottom:9px">
        <input type="file" accept="image/*" multiple style="display:none"
               onchange="addPhotoToRecord('${r.id}', event)">
        ＋ Add Photo
      </label>
      ${photosHtml}
    </div>

    <!-- Notes -->
    <div style="margin-bottom:14px">
      <div style="font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">💭 Notes</div>
      ${notesHtml}
      <div style="display:flex;gap:8px;margin-top:8px">
        <textarea id="new-comment-${r.id}" placeholder="Add a note or observation…" style="flex:1;min-height:55px"></textarea>
        <button class="btn btn-gold" style="align-self:flex-end" onclick="addComment('${r.id}')">Add</button>
      </div>
    </div>

    <hr class="divider">
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button class="btn btn-danger" onclick="deleteRecord('${r.id}')">🗑 Delete for All</button>
    </div>
  `;

  openModal("📋 " + r.name, html);
}

// ═══════════════════ MODAL ═══════════════════
function openModal(title, body) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML    = body;
  document.getElementById("detail-modal").classList.add("open");
}

function closeModal() {
  document.getElementById("detail-modal").classList.remove("open");
}

// ═══════════════════ TABS ═══════════════════
function switchTab(name) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById("panel-" + name).classList.add("active");
  document.getElementById("tab-"   + name).classList.add("active");
  if (name === "records") loadRecords();
}

// ═══════════════════ INIT ═══════════════════
document.addEventListener("DOMContentLoaded", () => {
  buildCriteriaRows();
  document.getElementById("inp-date").value = new Date().toISOString().split("T")[0];
  initDragDrop();
  document.getElementById("detail-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("detail-modal")) closeModal();
  });

  // Prevent Enter key from accidentally submitting on text inputs inside song form
  // (Enter should only work freely inside textareas)
  ["inp-song-title", "inp-song-assessor", "inp-name", "inp-assessor", "inp-event"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("keydown", e => {
      if (e.key === "Enter") e.preventDefault();
    });
  });
});

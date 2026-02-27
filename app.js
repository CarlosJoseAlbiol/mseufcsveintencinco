/* ═══════════════════════════════════════════════════
   MSEUF Concert Singers – Audition Rating Sheet
   app.js  —  powered by Supabase (shared database)
═══════════════════════════════════════════════════ */

// ── Supabase connection ──
const SUPABASE_URL = "https://brpmjziododrlsmttcss.supabase.co";
const SUPABASE_KEY = "sb_publishable_av-lxhsq54_6MTYULxIuiw_pPtP5yuk";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════ CRITERIA DATA ═══════════════════
const CRITERIA = [
  { id:"voice_quality",   group:"Voice",             label:"Quality",                     max:30, excellent:30, verySat:24, sat:18, fair:12, poor:6  },
  { id:"voice_tone",      group:"Voice",             label:"Tone",                        max:30, excellent:30, verySat:24, sat:18, fair:12, poor:6  },
  { id:"music_interp",    group:"Musicality",        label:"Interpretation",              max:30, excellent:30, verySat:24, sat:18, fair:12, poor:6  },
  { id:"music_dynamics",  group:"Musicality",        label:"Dynamics",                    max:30, excellent:30, verySat:24, sat:18, fair:12, poor:6  },
  { id:"pronunc_enunc",   group:"Pronunciation",     label:"Enunciation",                 max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
  { id:"pronunc_clarity", group:"Pronunciation",     label:"Clarity",                     max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
  { id:"timing_sync",     group:"Timing/Rhythm",     label:"Synchronization with music",  max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
  { id:"timing_pace",     group:"Timing/Rhythm",     label:"Pace",                        max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
  { id:"stage_conf",      group:"Stage Presence",    label:"Confidence",                  max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
  { id:"stage_expr",      group:"Stage Presence",    label:"Expression",                  max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
  { id:"mastery_no_err",  group:"Mastery of Lyrics", label:"No error or lapses in memory",max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
];

const LEVELS       = ["excellent", "verySat", "sat", "fair", "poor"];
const GROUP_ICONS  = {
  "Voice":             "🎙",
  "Musicality":        "🎵",
  "Pronunciation":     "💬",
  "Timing/Rhythm":     "🥁",
  "Stage Presence":    "🌟",
  "Mastery of Lyrics": "📖"
};

// Runtime state
let records  = [];
let photos   = [];   // temp photos before saving { id, dataUrl, name }

// ═══════════════════ HELPERS ═══════════════════
function groupIcon(g) { return GROUP_ICONS[g] || "•"; }

function escapeHtml(s) {
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}

function getGrade(total) {
  if (total >= 90) return { label:"Outstanding", bg:"rgba(63,185,80,.15)",   col:"#3fb950" };
  if (total >= 75) return { label:"Very Good",   bg:"rgba(201,168,76,.15)",  col:"#c9a84c" };
  if (total >= 60) return { label:"Good",        bg:"rgba(88,166,255,.15)",  col:"#58a6ff" };
  if (total >= 45) return { label:"Fair",        bg:"rgba(248,81,73,.15)",   col:"#f85149" };
  return                  { label:"Needs Work",  bg:"rgba(110,118,129,.15)", col:"#6e7681" };
}

// Toast
let toastTimer;
function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent       = msg;
  t.style.background  = isError ? "#f85149" : "#c9a84c";
  t.style.color       = isError ? "#fff"    : "#0d1117";
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

// ═══════════════════ SUPABASE: LOAD RECORDS ═══════════════════
async function loadRecords() {
  const list = document.getElementById("records-list");
  list.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><p>Loading shared records…</p></div>`;

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
    list.innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>Failed to load records. Check your connection.</p></div>`;
  }
}

// ═══════════════════ SUPABASE: SAVE RECORD ═══════════════════
async function saveRecord() {
  const name = document.getElementById("inp-name").value.trim();
  if (!name) { showToast("⚠ Please enter the student name", true); return; }

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
    id:         "r" + Date.now(),
    name,
    date:       document.getElementById("inp-date").value || new Date().toISOString().split("T")[0],
    program:    document.getElementById("inp-program").value.trim(),
    apply_for:  document.getElementById("inp-apply").value,
    scores,
    total,
    comment:    document.getElementById("inp-comment").value.trim(),
    photos:     photos.map(p => ({ ...p })),
    notes:      [],
    created_at: new Date().toISOString()
  };

  try {
    const { error } = await db.from("records").insert([record]);
    if (error) throw error;

    showToast("✅ Record saved and shared with everyone!");
    resetForm();
    switchTab("records");
    await loadRecords();
  } catch (err) {
    console.error(err);
    showToast("❌ Failed to save. Try again.", true);
  } finally {
    btn.textContent = "💾 Save & Share Record";
    btn.disabled    = false;
  }
}

// ═══════════════════ SUPABASE: UPDATE RECORD ═══════════════════
async function updateRecord(id, changes) {
  try {
    const { error } = await db.from("records").update(changes).eq("id", id);
    if (error) throw error;
    // update local copy
    records = records.map(r => r.id === id ? { ...r, ...changes } : r);
  } catch (err) {
    console.error(err);
    showToast("❌ Update failed.", true);
  }
}

// ═══════════════════ SUPABASE: DELETE RECORD ═══════════════════
async function deleteRecord(id) {
  if (!confirm("Delete this record for ALL users permanently?")) return;
  try {
    const { error } = await db.from("records").delete().eq("id", id);
    if (error) throw error;
    records = records.filter(r => r.id !== id);
    closeModal();
    renderRecords();
    showToast("Record deleted");
  } catch (err) {
    console.error(err);
    showToast("❌ Delete failed.", true);
  }
}

// ═══════════════════ NOTES ═══════════════════
async function addComment(recordId) {
  const inp  = document.getElementById("new-comment-" + recordId);
  const text = inp ? inp.value.trim() : "";
  if (!text) return;

  const r = records.find(x => x.id === recordId);
  if (!r) return;

  const updatedNotes = [...(r.notes || []), {
    id:   "n" + Date.now(),
    text,
    time: new Date().toISOString()
  }];

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

// ═══════════════════ PHOTOS INSIDE SAVED RECORD ═══════════════════
function addPhotoToRecord(recordId, event) {
  const r = records.find(x => x.id === recordId);
  if (!r) return;

  Array.from(event.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = async ev => {
      const updatedPhotos = [...(r.photos || []), {
        id:      "p" + Date.now() + Math.random().toString(36).slice(2),
        dataUrl: ev.target.result,
        name:    file.name
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

// ═══════════════════ PHOTO UPLOAD (NEW FORM) ═══════════════════
function handlePhotoUpload(e) {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      photos.push({
        id:      "p" + Date.now() + Math.random().toString(36).slice(2),
        dataUrl: ev.target.result,
        name:    file.name
      });
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
      <img src="${p.dataUrl}" alt="${p.name}">
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

// Drag & drop
function initDragDrop() {
  const zone = document.getElementById("upload-zone");
  zone.addEventListener("dragover",  e => { e.preventDefault(); zone.classList.add("drag"); });
  zone.addEventListener("dragleave", ()  => zone.classList.remove("drag"));
  zone.addEventListener("drop",      e  => {
    e.preventDefault();
    zone.classList.remove("drag");
    const files   = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    handlePhotoUpload({ target: { files, value:"" } });
  });
}

// ═══════════════════ RESET FORM ═══════════════════
function resetForm() {
  ["inp-name","inp-program","inp-comment"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("inp-date").value   = new Date().toISOString().split("T")[0];
  document.getElementById("inp-apply").value  = "";

  CRITERIA.forEach(c => {
    document.querySelectorAll(`input[name="${c.id}"]`).forEach(r => r.checked = false);
    const el = document.getElementById(`score-${c.id}`);
    if (el) el.textContent = "–";
  });

  photos = [];
  renderPhotoGrid();
  updateTotal();
}

// ═══════════════════ CRITERIA ROWS ═══════════════════
function buildCriteriaRows() {
  const container  = document.getElementById("criteria-rows");
  let currentGroup = "";
  let html         = "";

  CRITERIA.forEach(c => {
    if (c.group !== currentGroup) {
      currentGroup = c.group;
      html += `<div class="section-label" style="margin-top:16px;margin-bottom:4px">
                 ${groupIcon(c.group)} ${c.group}
               </div>`;
    }
    html += `
      <div class="criteria-row" id="row-${c.id}">
        <div class="criteria-name">
          ${c.label}
          <small>Max: ${c.max} pts</small>
        </div>
        ${LEVELS.map(lvl => `
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
  const pct = Math.min(total, 100);
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-pct").textContent  = pct + "%";

  const { label, bg, col } = getGrade(total);
  const badge              = document.getElementById("grade-badge");
  badge.textContent        = label;
  badge.style.background   = bg;
  badge.style.color        = col;
}

// ═══════════════════ RENDER RECORDS LIST ═══════════════════
function renderRecords() {
  const query    = (document.getElementById("search-input").value || "").toLowerCase();
  const list     = document.getElementById("records-list");
  const filtered = records.filter(r =>
    r.name.toLowerCase().includes(query) ||
    (r.program   || "").toLowerCase().includes(query) ||
    (r.apply_for || "").toLowerCase().includes(query)
  );

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>${query ? `No results for "${query}"` : "No records yet. Create the first one!"}</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(r => {
    const { label, bg, col } = getGrade(r.total);
    return `
      <div class="record-card" onclick="openRecordDetail('${r.id}')">
        <div class="record-header">
          <div>
            <div class="record-name">${escapeHtml(r.name)}</div>
            <div class="record-meta">📅 ${r.date} · ${r.program||"N/A"} · ${r.apply_for||"N/A"}</div>
          </div>
          <div class="record-score">
            <div class="big">${r.total}</div>
            <div class="sub">/100 pts</div>
          </div>
        </div>
        <div class="record-tags" style="margin-top:10px">
          <span class="tag" style="background:${bg};color:${col};border-color:${col}40">${label}</span>
          ${(r.photos||[]).length   > 0 ? `<span class="tag">📷 ${r.photos.length} photo${r.photos.length   > 1 ? "s" : ""}</span>` : ""}
          ${r.comment                   ? `<span class="tag">💬 Comment</span>`                                                       : ""}
          ${(r.notes||[]).length    > 0 ? `<span class="tag">💭 ${r.notes.length} note${r.notes.length    > 1 ? "s" : ""}</span>`  : ""}
        </div>
      </div>`;
  }).join("");
}

// ═══════════════════ RECORD DETAIL MODAL ═══════════════════
function openRecordDetail(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  const { label, bg, col } = getGrade(r.total);

  // Score breakdown
  let criteriaHtml = "";
  let currentGroup = "";
  CRITERIA.forEach(c => {
    if (c.group !== currentGroup) {
      currentGroup = c.group;
      criteriaHtml += `
        <div style="font-size:.72rem;font-weight:600;color:var(--gold);text-transform:uppercase;
                    letter-spacing:.08em;margin:12px 0 5px">
          ${groupIcon(c.group)} ${c.group}
        </div>`;
    }
    const score = (r.scores || {})[c.id] || 0;
    const pct   = (score / c.max) * 100;
    criteriaHtml += `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;font-size:.84rem">
        <div style="width:160px;color:var(--text);flex-shrink:0">${c.label}</div>
        <div style="flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--gold),var(--gold-light));border-radius:3px"></div>
        </div>
        <div style="width:48px;text-align:right;font-weight:600;color:var(--gold-light)">${score}/${c.max}</div>
      </div>`;
  });

  // Photos
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
    : `<p style="color:var(--muted);font-size:.85rem">No photos attached.</p>`;

  // Notes
  const notesHtml = (r.notes||[]).length
    ? (r.notes||[]).map(n => `
        <div class="comment-item">
          <div class="comment-meta">
            <span>🕐 ${new Date(n.time).toLocaleString()}</span>
            <button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:.7rem"
                    onclick="deleteComment('${r.id}','${n.id}')">Delete</button>
          </div>
          <div class="comment-text">${escapeHtml(n.text)}</div>
        </div>`).join("")
    : `<p style="color:var(--muted);font-size:.85rem;margin-bottom:8px">No notes yet.</p>`;

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:center;
                margin-bottom:18px;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:1.2rem;font-family:'Playfair Display',serif">${escapeHtml(r.name)}</div>
        <div style="font-size:.78rem;color:var(--muted);margin-top:3px">
          📅 ${r.date} · ${r.program||"N/A"} · ${r.apply_for||"N/A"}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Playfair Display',serif;font-size:2rem;color:var(--gold)">
          ${r.total}<span style="font-size:1rem;color:var(--muted)">/100</span>
        </div>
        <span style="background:${bg};color:${col};padding:4px 14px;border-radius:20px;font-size:.8rem;font-weight:600">${label}</span>
      </div>
    </div>

    <div style="background:var(--surface);border-radius:10px;padding:14px;margin-bottom:16px;border:1px solid var(--border)">
      <div style="font-size:.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;
                  letter-spacing:.07em;margin-bottom:8px">Score Breakdown</div>
      ${criteriaHtml}
    </div>

    ${r.comment ? `
    <div style="background:var(--surface);border-radius:10px;padding:14px;margin-bottom:16px;border:1px solid var(--border)">
      <div style="font-size:.72rem;color:var(--gold);font-weight:600;margin-bottom:5px">JUDGE'S COMMENT</div>
      <div style="font-size:.88rem;line-height:1.6">${escapeHtml(r.comment)}</div>
    </div>` : ""}

    <div style="margin-bottom:16px">
      <div style="font-size:.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;
                  letter-spacing:.07em;margin-bottom:8px">📷 Photos</div>
      <label style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;
                    border:1px dashed var(--border);border-radius:8px;cursor:pointer;
                    font-size:.8rem;color:var(--gold);margin-bottom:10px">
        <input type="file" accept="image/*" multiple style="display:none"
               onchange="addPhotoToRecord('${r.id}', event)">
        ＋ Add Photo
      </label>
      ${photosHtml}
    </div>

    <div style="margin-bottom:16px">
      <div style="font-size:.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;
                  letter-spacing:.07em;margin-bottom:8px">💭 Notes</div>
      ${notesHtml}
      <div style="display:flex;gap:8px;margin-top:8px">
        <textarea id="new-comment-${r.id}" placeholder="Add a note or comment…"
                  style="flex:1;min-height:58px"></textarea>
        <button class="btn btn-gold" style="align-self:flex-end"
                onclick="addComment('${r.id}')">Add</button>
      </div>
    </div>

    <hr class="divider">
    <div style="display:flex;justify-content:flex-end;gap:10px">
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

  // Close modal when clicking backdrop
  document.getElementById("detail-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("detail-modal")) closeModal();
  });
});

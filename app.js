/* ═══════════════════════════════════════════════════
   MSEUF Concert Singers – Audition Rating Sheet
   app.js
═══════════════════════════════════════════════════ */

// ═══════════════════ DATA DEFINITIONS ═══════════════════
const CRITERIA = [
    { id:'voice_quality',   group:'Voice',            label:'Quality',                    max:30, excellent:30, verySat:24, sat:18, fair:12, poor:6  },
    { id:'voice_tone',      group:'Voice',            label:'Tone',                       max:30, excellent:30, verySat:24, sat:18, fair:12, poor:6  },
    { id:'music_interp',    group:'Musicality',       label:'Interpretation',             max:30, excellent:30, verySat:24, sat:18, fair:12, poor:6  },
    { id:'music_dynamics',  group:'Musicality',       label:'Dynamics',                   max:30, excellent:30, verySat:24, sat:18, fair:12, poor:6  },
    { id:'pronunc_enunc',   group:'Pronunciation',    label:'Enunciation',                max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
    { id:'pronunc_clarity', group:'Pronunciation',    label:'Clarity',                    max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
    { id:'timing_sync',     group:'Timing/Rhythm',    label:'Synchronization with music', max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
    { id:'timing_pace',     group:'Timing/Rhythm',    label:'Pace',                       max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
    { id:'stage_conf',      group:'Stage Presence',   label:'Confidence',                 max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
    { id:'stage_expr',      group:'Stage Presence',   label:'Expression',                 max:10, excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
    { id:'mastery_no_err',  group:'Mastery of Lyrics',label:'No error or lapses in memory',max:10,excellent:10, verySat:8,  sat:6,  fair:4,  poor:2  },
  ];
  
  const LEVELS       = ['excellent', 'verySat', 'sat', 'fair', 'poor'];
  const GROUP_ICONS  = {
    'Voice':            '🎙',
    'Musicality':       '🎵',
    'Pronunciation':    '💬',
    'Timing/Rhythm':    '🥁',
    'Stage Presence':   '🌟',
    'Mastery of Lyrics':'📖'
  };
  
  // ── Runtime state ──
  let photos  = [];                                                            // { id, dataUrl, name }
  let records = JSON.parse(localStorage.getItem('mseuf_records') || '[]');   // persisted array
  
  // ═══════════════════ HELPERS ═══════════════════
  function groupIcon(g) { return GROUP_ICONS[g] || '•'; }
  
  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  function saveToStorage() {
    localStorage.setItem('mseuf_records', JSON.stringify(records));
  }
  
  // ── Toast notification ──
  let toastTimer;
  function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = isError ? 'var(--danger)' : 'var(--gold)';
    t.style.color      = isError ? '#fff'           : '#0d1117';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }
  
  // ── Grade helper ──
  function getGrade(total) {
    if (total >= 90) return { label:'Outstanding', bg:'rgba(63,185,80,.12)',   col:'#3fb950' };
    if (total >= 75) return { label:'Very Good',   bg:'rgba(201,168,76,.12)',  col:'#c9a84c' };
    if (total >= 60) return { label:'Good',        bg:'rgba(88,166,255,.12)',  col:'#58a6ff' };
    if (total >= 45) return { label:'Fair',        bg:'rgba(248,81,73,.12)',   col:'#f85149' };
    return               { label:'Needs Work',  bg:'rgba(110,118,129,.12)', col:'#6e7681' };
  }
  
  // ═══════════════════ BUILD CRITERIA ROWS (DOM) ═══════════════════
  function buildCriteriaRows() {
    const container = document.getElementById('criteria-rows');
    let currentGroup = '';
    let html = '';
  
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
            </div>`).join('')}
          <div class="score-display" id="score-${c.id}">–</div>
        </div>`;
    });
  
    container.innerHTML = html;
  }
  
  // ═══════════════════ LIVE SCORE CALCULATION ═══════════════════
  function updateTotal() {
    let total = 0;
  
    CRITERIA.forEach(c => {
      const checked = document.querySelector(`input[name="${c.id}"]:checked`);
      const val     = checked ? parseInt(checked.value) : 0;
      const el      = document.getElementById(`score-${c.id}`);
      if (el) el.textContent = checked ? val : '–';
      total += val;
    });
  
    document.getElementById('total-score').textContent = total;
  
    const pct = Math.min(Math.round((total / 100) * 100), 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-pct').textContent  = pct + '%';
  
    const { label, bg, col } = getGrade(total);
    const badge = document.getElementById('grade-badge');
    badge.textContent    = label;
    badge.style.background = bg;
    badge.style.color      = col;
  }
  
  // ═══════════════════ PHOTO HANDLING (NEW FORM) ═══════════════════
  function handlePhotoUpload(e) {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        photos.push({
          id:      'p' + Date.now() + Math.random().toString(36).slice(2),
          dataUrl: ev.target.result,
          name:    file.name
        });
        renderPhotoGrid();
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';   // allow re-upload of same file
  }
  
  function renderPhotoGrid() {
    const grid = document.getElementById('photo-grid');
    if (!photos.length) { grid.innerHTML = ''; return; }
  
    grid.innerHTML = photos.map(p => `
      <div class="photo-item" id="photo-${p.id}">
        <img src="${p.dataUrl}" alt="${p.name}" onclick="viewPhoto('${p.id}')">
        <div class="photo-overlay">
          <button class="btn btn-sm btn-outline" onclick="viewPhoto('${p.id}')">👁</button>
          <button class="btn btn-sm btn-danger"  onclick="deletePhoto('${p.id}')">🗑</button>
        </div>
        <div class="photo-caption">${p.name}</div>
      </div>`).join('');
  }
  
  function deletePhoto(id) {
    photos = photos.filter(p => p.id !== id);
    renderPhotoGrid();
    showToast('Photo removed');
  }
  
  function viewPhoto(id) {
    const p = photos.find(x => x.id === id);
    if (!p) return;
    openModal('📷 ' + p.name, `
      <img src="${p.dataUrl}" style="width:100%;border-radius:8px;display:block">
      <p style="margin-top:12px;font-size:.8rem;color:var(--muted);text-align:center">${p.name}</p>
    `);
  }
  
  // ── Drag-and-drop on upload zone ──
  function initDragDrop() {
    const zone = document.getElementById('upload-zone');
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', ()  => zone.classList.remove('drag'));
    zone.addEventListener('drop',      e  => {
      e.preventDefault();
      zone.classList.remove('drag');
      const files    = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      const fakeEvt  = { target: { files, value: '' } };
      handlePhotoUpload(fakeEvt);
    });
  }
  
  // ═══════════════════ SAVE / RESET ═══════════════════
  function saveRecord() {
    const name = document.getElementById('inp-name').value.trim();
    if (!name) { showToast('⚠ Please enter the student name', true); return; }
  
    const scores = {};
    let total    = 0;
    CRITERIA.forEach(c => {
      const checked  = document.querySelector(`input[name="${c.id}"]:checked`);
      scores[c.id]   = checked ? parseInt(checked.value) : 0;
      total         += scores[c.id];
    });
  
    const record = {
      id:        'r' + Date.now(),
      name,
      date:      document.getElementById('inp-date').value || new Date().toISOString().split('T')[0],
      program:   document.getElementById('inp-program').value.trim(),
      applyFor:  document.getElementById('inp-apply').value,
      scores,
      total,
      comment:   document.getElementById('inp-comment').value.trim(),
      photos:    photos.map(p => ({ ...p })),
      comments:  [],
      createdAt: new Date().toISOString()
    };
  
    records.unshift(record);
    saveToStorage();
    showToast('✅ Record saved successfully!');
    resetForm();
    switchTab('records');
  }
  
  function resetForm() {
    ['inp-name','inp-date','inp-program','inp-comment'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('inp-apply').value = '';
    document.getElementById('inp-date').value  = new Date().toISOString().split('T')[0];
  
    CRITERIA.forEach(c => {
      document.querySelectorAll(`input[name="${c.id}"]`).forEach(r => r.checked = false);
      const el = document.getElementById(`score-${c.id}`);
      if (el) el.textContent = '–';
    });
  
    photos = [];
    renderPhotoGrid();
    updateTotal();
  }
  
  // ═══════════════════ RECORDS LIST ═══════════════════
  function renderRecords() {
    const query    = (document.getElementById('search-input').value || '').toLowerCase();
    const list     = document.getElementById('records-list');
    const filtered = records.filter(r =>
      r.name.toLowerCase().includes(query) ||
      (r.program  || '').toLowerCase().includes(query) ||
      (r.applyFor || '').toLowerCase().includes(query)
    );
  
    if (!filtered.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">📭</div>
          <p>No records found${query ? ` for "${query}"` : ''}.</p>
        </div>`;
      return;
    }
  
    list.innerHTML = filtered.map(r => {
      const { label, bg, col } = getGrade(r.total);
      return `
        <div class="record-card" onclick="openRecordDetail('${r.id}')">
          <div class="record-header">
            <div>
              <div class="record-name">${r.name}</div>
              <div class="record-meta">📅 ${r.date} · ${r.program || 'N/A'} · ${r.applyFor || 'N/A'}</div>
            </div>
            <div class="record-score">
              <div class="big">${r.total}</div>
              <div class="sub">/100 pts</div>
            </div>
          </div>
          <div class="record-tags" style="margin-top:10px">
            <span class="tag" style="background:${bg};color:${col};border-color:${col}40">${label}</span>
            ${r.photos.length   > 0 ? `<span class="tag">📷 ${r.photos.length} photo${r.photos.length   > 1 ? 's' : ''}</span>` : ''}
            ${r.comment              ? `<span class="tag">💬 Comment</span>` : ''}
            ${r.comments.length > 0 ? `<span class="tag">💭 ${r.comments.length} note${r.comments.length > 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  }
  
  // ═══════════════════ RECORD DETAIL MODAL ═══════════════════
  function openRecordDetail(id) {
    const r = records.find(x => x.id === id);
    if (!r) return;
    const { label, bg, col } = getGrade(r.total);
  
    // Score breakdown
    let criteriaHtml = '';
    let currentGroup = '';
    CRITERIA.forEach(c => {
      if (c.group !== currentGroup) {
        currentGroup = c.group;
        criteriaHtml += `
          <div style="font-size:.72rem;font-weight:600;color:var(--gold);text-transform:uppercase;
                      letter-spacing:.08em;margin:14px 0 6px">
            ${groupIcon(c.group)} ${c.group}
          </div>`;
      }
      const score = r.scores[c.id] || 0;
      const pct   = (score / c.max) * 100;
      criteriaHtml += `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:.85rem">
          <div style="width:160px;color:var(--text);flex-shrink:0">${c.label}</div>
          <div style="flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--gold),var(--gold-light));border-radius:3px"></div>
          </div>
          <div style="width:50px;text-align:right;font-weight:600;color:var(--gold-light)">${score}/${c.max}</div>
        </div>`;
    });
  
    // Photos
    const photosHtml = r.photos.length
      ? `<div class="photo-grid" style="margin-top:0">
           ${r.photos.map(p => `
             <div class="photo-item">
               <img src="${p.dataUrl}" alt="${p.name}">
               <div class="photo-overlay">
                 <button class="btn btn-sm btn-danger" onclick="deletePhotoFromRecord('${id}','${p.id}')">🗑</button>
               </div>
               <div class="photo-caption">${p.name}</div>
             </div>`).join('')}
         </div>`
      : `<p style="color:var(--muted);font-size:.85rem">No photos attached.</p>`;
  
    // Notes/comments
    const commentsHtml = r.comments.length
      ? r.comments.map(cm => `
          <div class="comment-item" id="comment-${cm.id}">
            <div class="comment-meta">
              <span>🕐 ${new Date(cm.time).toLocaleString()}</span>
              <button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:.7rem"
                      onclick="deleteComment('${id}','${cm.id}')">Delete</button>
            </div>
            <div class="comment-text">${escapeHtml(cm.text)}</div>
          </div>`).join('')
      : `<p style="color:var(--muted);font-size:.85rem">No comments yet.</p>`;
  
    const html = `
      <!-- Summary -->
      <div style="display:flex;justify-content:space-between;align-items:center;
                  margin-bottom:20px;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-size:1.25rem;font-family:'Playfair Display',serif">${r.name}</div>
          <div style="font-size:.8rem;color:var(--muted);margin-top:4px">
            📅 ${r.date} · ${r.program || 'N/A'} · ${r.applyFor || 'N/A'}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Playfair Display',serif;font-size:2rem;color:var(--gold)">
            ${r.total}<span style="font-size:1rem;color:var(--muted)">/100</span>
          </div>
          <span class="grade-badge" style="background:${bg};color:${col}">${label}</span>
        </div>
      </div>
  
      <!-- Score breakdown -->
      <div style="background:var(--surface);border-radius:10px;padding:16px;
                  margin-bottom:18px;border:1px solid var(--border)">
        <div style="font-size:.78rem;font-weight:600;color:var(--muted);text-transform:uppercase;
                    letter-spacing:.07em;margin-bottom:10px">Score Breakdown</div>
        ${criteriaHtml}
      </div>
  
      <!-- Judge's comment -->
      ${r.comment ? `
      <div style="background:var(--surface);border-radius:10px;padding:14px;
                  margin-bottom:18px;border:1px solid var(--border)">
        <div style="font-size:.75rem;color:var(--gold);font-weight:600;margin-bottom:6px">JUDGE'S COMMENT</div>
        <div style="font-size:.9rem;line-height:1.6">${escapeHtml(r.comment)}</div>
      </div>` : ''}
  
      <!-- Photos section -->
      <div style="margin-bottom:18px">
        <div style="font-size:.78rem;font-weight:600;color:var(--muted);text-transform:uppercase;
                    letter-spacing:.07em;margin-bottom:10px">📷 Photos</div>
        <label style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;
                      border:1px dashed var(--border);border-radius:8px;cursor:pointer;
                      font-size:.82rem;color:var(--gold);margin-bottom:10px">
          <input type="file" accept="image/*" multiple style="display:none"
                 onchange="addPhotoToRecord('${id}', event)">
          ＋ Add Photo
        </label>
        ${photosHtml}
      </div>
  
      <!-- Notes section -->
      <div>
        <div style="font-size:.78rem;font-weight:600;color:var(--muted);text-transform:uppercase;
                    letter-spacing:.07em;margin-bottom:10px">💭 Notes</div>
        <div id="comments-list-${id}">${commentsHtml}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <textarea id="new-comment-${id}" placeholder="Add a note or comment…"
                    style="flex:1;min-height:60px"></textarea>
          <button class="btn btn-gold" style="align-self:flex-end"
                  onclick="addComment('${id}')">Add</button>
        </div>
      </div>
  
      <hr class="divider">
      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-danger"  onclick="deleteRecord('${id}')">🗑 Delete Record</button>
        <button class="btn btn-outline" onclick="printRecord('${id}')">🖨 Print</button>
      </div>
    `;
  
    openModal('📋 ' + r.name, html);
  }
  
  // ── Photo management inside saved records ──
  function addPhotoToRecord(recordId, event) {
    const r = records.find(x => x.id === recordId);
    if (!r) return;
    Array.from(event.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        r.photos.push({
          id:      'p' + Date.now() + Math.random().toString(36).slice(2),
          dataUrl: ev.target.result,
          name:    file.name
        });
        saveToStorage();
        openRecordDetail(recordId);   // re-render modal
      };
      reader.readAsDataURL(file);
    });
  }
  
  function deletePhotoFromRecord(recordId, photoId) {
    const r = records.find(x => x.id === recordId);
    if (!r) return;
    r.photos = r.photos.filter(p => p.id !== photoId);
    saveToStorage();
    showToast('Photo removed');
    openRecordDetail(recordId);
  }
  
  // ── Comment management ──
  function addComment(recordId) {
    const r   = records.find(x => x.id === recordId);
    const inp = document.getElementById('new-comment-' + recordId);
    const text = inp ? inp.value.trim() : '';
    if (!text || !r) return;
    r.comments.push({ id: 'c' + Date.now(), text, time: new Date().toISOString() });
    saveToStorage();
    showToast('Note added');
    openRecordDetail(recordId);
  }
  
  function deleteComment(recordId, commentId) {
    const r = records.find(x => x.id === recordId);
    if (!r) return;
    r.comments = r.comments.filter(c => c.id !== commentId);
    saveToStorage();
    showToast('Note deleted');
    openRecordDetail(recordId);
  }
  
  // ── Delete & print ──
  function deleteRecord(id) {
    if (!confirm('Delete this record permanently?')) return;
    records = records.filter(r => r.id !== id);
    saveToStorage();
    closeModal();
    renderRecords();
    showToast('Record deleted');
  }
  
  function printRecord(id) {
    const r = records.find(x => x.id === id);
    if (!r) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>${r.name} – Audition Rating</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 700px; margin: 0 auto; }
          h1   { font-size: 1.3rem; }
          table { width: 100%; border-collapse: collapse; margin: 14px 0; }
          th, td { border: 1px solid #ccc; padding: 8px 10px; font-size: .85rem; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>MSEUF Concert Singers – Student Audition Rating Sheet</h1>
        <p><strong>Name:</strong> ${r.name} &nbsp; <strong>Date:</strong> ${r.date}</p>
        <p><strong>Program & Year:</strong> ${r.program || 'N/A'} &nbsp;
           <strong>Applying for:</strong> ${r.applyFor || 'N/A'}</p>
        <table>
          <tr><th>Criteria</th><th>Score</th><th>Max</th></tr>
          ${CRITERIA.map(c => `
            <tr>
              <td>${c.group} – ${c.label}</td>
              <td>${r.scores[c.id] || 0}</td>
              <td>${c.max}</td>
            </tr>`).join('')}
          <tr>
            <td><strong>TOTAL</strong></td>
            <td><strong>${r.total}</strong></td>
            <td><strong>100</strong></td>
          </tr>
        </table>
        <p><strong>Comment:</strong> ${r.comment || '—'}</p>
      </body>
      </html>`);
    win.document.close();
    win.print();
  }
  
  // ═══════════════════ EXPORT ═══════════════════
  function exportAll() {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'mseuf_audition_records.json';
    a.click();
    showToast('Exported!');
  }
  
  // ═══════════════════ MODAL ═══════════════════
  function openModal(title, body) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML    = body;
    document.getElementById('detail-modal').classList.add('open');
  }
  
  function closeModal() {
    document.getElementById('detail-modal').classList.remove('open');
  }
  
  function initModal() {
    document.getElementById('detail-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('detail-modal')) closeModal();
    });
  }
  
  // ═══════════════════ TABS ═══════════════════
  function switchTab(name) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    document.getElementById('tab-'   + name).classList.add('active');
    if (name === 'records') renderRecords();
  }
  
  // ═══════════════════ INITIALISATION ═══════════════════
  document.addEventListener('DOMContentLoaded', () => {
    buildCriteriaRows();
    document.getElementById('inp-date').value = new Date().toISOString().split('T')[0];
    initDragDrop();
    initModal();
  });
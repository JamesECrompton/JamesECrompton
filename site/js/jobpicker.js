// jobpicker.js - simple job picker app
(function(){
  const people = [
    {id:'alice', name:'Alice'},
    {id:'lucy', name:'Lucy'},
    {id:'matilda', name:'Matilda'},
    {id:'eloise', name:'Eloise'}
  ];

  // Jobs with name, description and applicability
  const jobBank = [
    {id:'wash_windows', title:'Wash Windows', desc:'Windex windows near front door, art room exit and dining area overseeing pool.', applies:['alice','lucy','matilda']},
    {id:'laundry', title:'Laundry', desc:'Add a load to the washer, move to dryer and fold a load then put away.', applies:['alice','lucy', 'matilda']},
    {id:'scrub_walls', title:'Scrub Walls', desc:'Use Magic Eraser on Walls to clean marker.', applies:['eloise','matilda']},
      { id: 'take_out_trash', title: 'Take out trash', desc: 'Gather trash from all rooms and reline.', applies: ['matilda', 'alice'] },
      { id: 'purple_table_clean', title: 'Clean Purple Table', desc: 'Cleanup Purple Table and Area.', applies: ['matilda', 'eloise'] },
      { id: 'art_room_clean', title: 'Clean Art Room', desc: 'Cleanup art room.', applies: ['eloise', 'lucy'] },
      { id: 'gather_trash_outside', title: 'Gather Outside Trash', desc: 'Find 4 pieces of trash outside and throw away.', applies: ['eloise', 'matilda'] },
      { id: 'clean_sam_cars', title: 'Clean Sam Cars', desc: 'Scrub Play Cars outside washing with hose and scrubbing clean.', applies: ['alice', 'lucy'] },
      { id: 'organize_game_shelf', title: 'Organize Game Shelf', desc: 'Straighten One Shelf (4-8 games) on the Game Shelf.', applies: ['alice'] },
    {id:'pinecones', title:'Pinecones', desc:'Cleanup 25 pinecones.', applies:['alice','lucy','matilda','eloise']},
    { id: 'box_breakdown', title: 'Box Breakdown', desc: 'Break down 10 boxes and put in recycle.', applies: ['alice', 'lucy'] },
      { id: 'sweep_stairs', title: 'Sweep Stairs', desc: 'Sweep both sets of stairs.', applies: ['alice', 'lucy'] },
      { id: 'water_flowers', title: 'Water Flowers', desc: 'Water Flowers outside front and back.', applies: ['alice', 'lucy', 'matilda'] },
      { id: 'car_clean', title: 'Pickup Car Trash', desc: 'Pickup 10 pieces of trash from car.', applies: ['matilda', 'eloise'] },
      { id: 'trash_small', title: 'Empty Trash Can', desc: 'Empty 2 trash cans and reline.', applies: ['eloise'] },
      { id: 'trash_med', title: 'Empty Trash Can', desc: 'Empty 4 trash cans and reline.', applies: ['alice', 'lucy', 'matilda'] },
      { id: 'dishwasher', title: 'Dishwasher', desc: 'Unload and load the dishwasher.', applies: ['alice', 'lucy', 'matilda'] },
      { id: 'fridge_shelves', title: 'Fridge Shelves', desc: 'Wipe the fridge shelves.', applies: ['alice', 'lucy'] },
      { id: 'dinner', title: 'Help Make Dinner', desc: 'Help Mom Make Dinner.', applies: ['alice', 'lucy', 'matilda', 'eloise'] },
      { id: 'living_room', title: 'Living Room Floor', desc: 'Sweep and Swiffer the living room floor.', applies: ['alice', 'lucy'] },
      { id: 'toy_pickup', title: 'Pickup Toys', desc: 'Pick up and put away 20 toys.', applies: ['alice', 'lucy', 'matilda', 'eloise'] },
      { id: 'leafblow_pool', title: 'Leafblow Pool', desc: 'Leafblow around the pool and throw out yard waste.', applies: ['alice', 'lucy'] },
      { id: 'toilets', title: 'Clean Toilets', desc: 'Clean 2 toilets.', applies: ['alice', 'lucy', 'matilda'] },
    { id: 'piano', title: 'Wipe Piano', desc: 'Wipe and Dust Piano and put things away.', applies: ['lucy', 'matilda', 'eloise'] }
  ];

  const useLocalStorage = (function(){
    try { localStorage.setItem('__test','1'); localStorage.removeItem('__test'); return true; } catch(e){ return false }
  })();

  function saveHistory(history){
    const data = JSON.stringify(history||[]);
    // write to both localStorage (preferred) and cookie so a cookie view is possible
    try{ localStorage.setItem('jobpicker_history',data); }catch(e){}
    try{ document.cookie = 'jobpicker_history=' + encodeURIComponent(data) + ';path=/;max-age=' + (60*60*24*365); }catch(e){}
  }
  function loadHistory(){
    if(useLocalStorage){
      try{ return JSON.parse(localStorage.getItem('jobpicker_history')||'[]') }catch(e){return[]}
    }
    const m = document.cookie.match(/(?:^|; )jobpicker_history=([^;]+)/);
    if(m) try{ return JSON.parse(decodeURIComponent(m[1])) }catch(e){}
    return [];
  }

  // UI helpers
  const qs = (s,el) => (el||document).querySelector(s);
  const qsa = (s,el) => Array.from((el||document).querySelectorAll(s));

  function renderPeople(){
    const container = qs('#peopleGrid');
    container.innerHTML = '';
    people.forEach(p => {
      const d = document.createElement('div');
      d.className = 'person-tile';
      d.tabIndex = 0;
      // use an image from img/{id}.png - if not available the browser will show broken image, but CSS provides background
      // create image element to avoid complicated escaping in innerHTML
      const img = document.createElement('img');
      img.className = 'person-avatar';
      // prefer filename matching the display name (capitalized), e.g. Alice.png
      img.src = 'img/' + encodeURIComponent(p.name) + '.png';
      img.alt = p.name;
      img.onerror = function(){
        // try fallback to lowercase id filename once
        if(!this._triedFallback){
          this._triedFallback = true;
          this.src = 'img/' + p.id + '.png';
          return;
        }
        this.style.opacity = 0.6;
        this.style.background = '#ddd';
      };
      const nameDiv = document.createElement('div');
      nameDiv.className = 'person-name';
      nameDiv.textContent = p.name;
      d.appendChild(img);
      d.appendChild(nameDiv);
      d.onclick = () => openPickerFor(p.id);
      d.onkeypress = (e) => { if(e.key === 'Enter' || e.key === ' ') openPickerFor(p.id) };
      container.appendChild(d);
    })
  }

  function openPickerFor(personId){
    const panel = qs('#pickerPanel');
    panel.classList.remove('hidden');
    qs('#pickedPerson').textContent = people.find(p=>p.id===personId).name;
    panel.dataset.person = personId;
    qs('#resultArea').classList.add('hidden');
    qs('#singleResult').classList.add('hidden');
    qs('#dualResult').classList.add('hidden');
    qs('#bonusNotice').classList.add('hidden');
    const notice = qs('#assignmentNotice'); if(notice) notice.classList.add('hidden');
    const spinner = qs('#spinner'); if(spinner) spinner.textContent = 'Ready?';
    renderHistory();
    // move focus to the Get Random Job button and ensure it's visible on small screens
    const btn = qs('#chooseBtn');
    if(btn){
      // small delay to allow layout changes then focus and scroll into view
      setTimeout(()=>{
        try{ btn.focus(); btn.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){}
      }, 80);
    }
  }

  function filterJobsFor(personId){
    // Exclude jobs assigned within the last 24 hours (across all people)
    const allHistory = loadHistory();
    const cutoff = Date.now() - (24*60*60*1000);
    const recentAssigned = new Set(allHistory.filter(h => {
      try{ return new Date(h.ts).getTime() >= cutoff }catch(e){return false}
    }).map(h => h.id || h.job));
    return jobBank.filter(j => j.applies.includes(personId) && !recentAssigned.has(j.id));
  }

  function showNotice(html, isError){
    const notice = qs('#assignmentNotice');
    if(!notice) return;
    notice.innerHTML = html;
    if(isError){ notice.classList.add('notice-error'); } else { notice.classList.remove('notice-error'); }
    notice.classList.remove('hidden');
  }

  function spinAndPick(){
    const personId = qs('#pickerPanel').dataset.person;
    if(!personId) return;
    const jobs = filterJobsFor(personId);
    if(jobs.length===0){ const name = (people.find(p=>p.id===personId)||{name:personId}).name; showNotice('No available jobs for ' + escapeHtml(name) + ' right now (jobs already assigned today).', true); return }

    // animation: incremental text spinner
    const spinner = qs('#spinner');
    spinner.textContent = '';
    const duration = 2200; // ms
    const start = Date.now();
    let ticker = 0;
    const ran = () => Math.floor(Math.random()*jobs.length);

    // 1% chance to be lucky (no job) - handled separately from the job pool
    let chosenA = null;
    let chosenB = null;
    const isLucky = Math.random() < 0.01;
    if(isLucky){
      // show no bonus notice for lucky
      qs('#bonusNotice').classList.add('hidden');
      chosenA = {id:'lucky', title:'Lucky', desc:'Lucky no Job :-)'};
    } else {
      // Decide if bonus occurs (10%) - only if at least 2 jobs are available
      const bonusRoll = Math.random();
      const isBonus = (bonusRoll < 0.10) && jobs.length >= 2;
      if(isBonus) qs('#bonusNotice').classList.remove('hidden'); else qs('#bonusNotice').classList.add('hidden');

      if(isBonus){
        // pick two distinct random jobs from the available jobs
        const aIdx = Math.floor(Math.random()*jobs.length);
        let bIdx = Math.floor(Math.random()*(jobs.length-1));
        if(bIdx >= aIdx) bIdx += 1;
        chosenA = jobs[aIdx];
        chosenB = jobs[bIdx];
      } else {
        // single pick from available jobs
        chosenA = jobs[ran()];
      }
    }

    const tick = () => {
      const elapsed = Date.now()-start;
      if(elapsed >= duration){
        clearInterval(ticker);
        revealResults(isBonus, chosenA, chosenB);
        return;
      }
      // show random job title to create suspense
      spinner.textContent = jobs.length ? jobs[Math.floor(Math.random()*jobs.length)].title + '...' : 'Ready?';
    };
    tick();
    ticker = setInterval(tick, 80);
  }

  function revealResults(isBonus, a, b){
    const spinner = qs('#spinner');
    qs('#resultArea').classList.remove('hidden');
    if(isBonus){
      qs('#dualResult').classList.remove('hidden');
      qs('#singleResult').classList.add('hidden');
      qs('#jobA').innerHTML = '<strong>'+escapeHtml(a.title)+'</strong><p>'+escapeHtml(a.desc)+'</p>';
      qs('#jobB').innerHTML = '<strong>'+escapeHtml(b.title)+'</strong><p>'+escapeHtml(b.desc)+'</p>';
      qs('#jobA').onclick = () => acceptFinal(a);
      qs('#jobB').onclick = () => acceptFinal(b);
      if(spinner) spinner.textContent = 'Bonus Choice';
    } else {
      qs('#singleResult').classList.remove('hidden');
      qs('#dualResult').classList.add('hidden');
      qs('#singleJob').innerHTML = '<strong>'+escapeHtml(a.title)+'</strong><p>'+escapeHtml(a.desc)+'</p>';
      // auto-accept single result
      if(spinner) spinner.textContent = a.title;
      // accept after short pause so spinner shows final title briefly
      setTimeout(()=> acceptFinal(a), 250);
    }
  }

  function acceptFinal(job){
    const personId = qs('#pickerPanel').dataset.person;
    const history = loadHistory();
    history.unshift({person:personId, job:job.title, desc:job.desc, id:job.id, ts: new Date().toISOString()});
    saveHistory(history.slice(0,200));
    renderHistory();
    // show inline assignment notice instead of a popup
    const notice = qs('#assignmentNotice');
    if(notice){
      notice.innerHTML = '<strong>Assigned to ' + escapeHtml(job.title) + ' for ' + escapeHtml((people.find(p=>p.id===personId)||{name:personId}).name) + '</strong><div>' + escapeHtml(job.desc) + '</div>';
      notice.classList.remove('hidden');
    }
    // hide result area to show the assignment notice clearly
    qs('#resultArea').classList.add('hidden');
    // keep spinner showing the assigned job until user interacts (do not reset here)
  }

  function renderHistory(){
    const all = loadHistory();
    const target = qs('#history');
    target.innerHTML = '';
    // if a person is selected, filter history for that person
    const panel = qs('#pickerPanel');
    const personFilter = panel && panel.dataset && panel.dataset.person ? panel.dataset.person : null;
    const hist = personFilter ? all.filter(h => h.person === personFilter) : all;

    if(hist.length === 0){
      target.innerHTML = '<div class="small">No history yet.</div>';
      return;
    }

    // anchor week start: 2026-06-07
    const anchor = new Date(2026, 5, 7); // months are 0-based (5 = June)
    const weekMs = 7*24*60*60*1000;

    // group entries by week index (number of weeks since anchor)
    const weeks = new Map();
    hist.forEach(h => {
      let t = Date.parse(h.ts);
      if(isNaN(t)) return;
      // compute week index; allow negative indices if before anchor
      const idx = Math.floor((t - anchor.getTime()) / weekMs);
      if(!weeks.has(idx)) weeks.set(idx, []);
      weeks.get(idx).push(h);
    });

    // sort week indices newest-first
    const sortedIdx = Array.from(weeks.keys()).sort((a,b) => b - a);

    sortedIdx.forEach(idx => {
      const entries = weeks.get(idx);
      // compute week start and end display
      const startMs = anchor.getTime() + idx * weekMs;
      const endMs = startMs + (7*24*60*60*1000) - 1;
      const startDate = new Date(startMs);
      const endDate = new Date(endMs);
      const header = document.createElement('div'); header.className = 'week';
      const hdrInner = document.createElement('div'); hdrInner.className = 'week-header';
      const range = document.createElement('div'); range.className = 'range';
      range.textContent = startDate.toLocaleDateString('en-US') + ' → ' + endDate.toLocaleDateString('en-US');
      const totalDiv = document.createElement('div'); totalDiv.className = 'total';
      // compute total dollars for this week for the selected person (or overall if no filter)
      const total = entries.length; // $1 per job
      totalDiv.textContent = (personFilter ? ('$' + total) : ('$' + total));
      hdrInner.appendChild(range);
      hdrInner.appendChild(totalDiv);
      header.appendChild(hdrInner);

      // sort entries newest-first by timestamp
      entries.sort((a,b) => new Date(b.ts) - new Date(a.ts));
      entries.forEach(e => {
        const item = document.createElement('div'); item.className = 'history-entry';
        item.innerHTML = '<strong>'+escapeHtml((people.find(p=>p.id===e.person)||{name:e.person}).name) + '</strong> — ' + escapeHtml(new Date(e.ts).toLocaleString()) + ': <em>' + escapeHtml(e.job) + '</em>' + (e.desc ? '<div class="small">' + escapeHtml(e.desc) + '</div>' : '');
        header.appendChild(item);
      });

      target.appendChild(header);
    });
    // ensure newest week visible at top
    if(target.firstChild) target.scrollTop = 0;
  }

  // read history directly from cookie (if present)
  function loadHistoryFromCookie(){
    const m = document.cookie.match(/(?:^|; )jobpicker_history=([^;]+)/);
    if(!m) return [];
    try{ return JSON.parse(decodeURIComponent(m[1])); }catch(e){ return [] }
  }

  function renderCookieHistory(){
    // removed: cookie-backed history UI is no longer shown
  }

  function clearHistory(){
    if(!confirm('Clear all job history?')) return;
    try{ localStorage.removeItem('jobpicker_history'); }catch(e){}
    try{ document.cookie = 'jobpicker_history=;path=/;max-age=0'; }catch(e){}
    renderHistory();
    const cookieEl = qs('#cookieHistory'); if(cookieEl) cookieEl.innerHTML = '';
    const notice = qs('#assignmentNotice'); if(notice) notice.classList.add('hidden');
  }

  // small helper to avoid inserting unsafe HTML (we only escape text values)
  function escapeHtml(s){
    if(!s && s!==0) return '';
    return String(s).replace(/[&<>\"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }

  function init(){
    try{ renderPeople(); }catch(e){ console.error('init renderPeople error', e); }
    qs('#backBtn').onclick = () => { qs('#pickerPanel').classList.add('hidden'); };
    qs('#chooseBtn').onclick = () => spinAndPick();
    const clearBtn = qs('#clearHistoryBtn'); if(clearBtn) clearBtn.onclick = clearHistory;
  }

  // init on DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

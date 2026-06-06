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
    {id:'laundry', title:'Laundry', desc:'Add a load to the washer, move to dryer and fold a load then put away.', applies:['alice','lucy']},
    {id:'scrub_walls', title:'Scrub Walls', desc:'Use Magic Eraser on Walls to clean marker.', applies:['eloise','matilda']},
    {id:'take_out_trash', title:'Take out trash', desc:'Gather trash from all rooms and reline.', applies:['matilda','alice']},
    {id:'clean_sam_cars', title:'Clean Sam Cars', desc:'Scrub Play Cars outside washing with hose and scrubbing clean.', applies:['alice','lucy']},
    {id:'pinecones', title:'Pinecones', desc:'Cleanup 25 pinecones.', applies:['alice','lucy','matilda','eloise']},
    {id:'box_breakdown', title:'Box Breakdown', desc:'Break down 10 boxes and put in recycle.', applies:['alice','lucy']},
    {id:'lucky', title:'Lucky', desc:'Lucky no Job :-)', applies:['alice','lucy','matilda','eloise']},
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
  }

  function filterJobsFor(personId){
    return jobBank.filter(j => j.applies.includes(personId));
  }

  function spinAndPick(){
    const personId = qs('#pickerPanel').dataset.person;
    if(!personId) return;
    const jobs = filterJobsFor(personId);
    if(jobs.length===0){ const name = (people.find(p=>p.id===personId)||{name:personId}).name; alert('No jobs defined for ' + name); return }

    // animation: incremental text spinner
    const spinner = qs('#spinner');
    spinner.textContent = '';
    const duration = 2200; // ms
    const start = Date.now();
    let ticker = 0;
    const ran = () => Math.floor(Math.random()*jobs.length);

    // Decide if bonus occurs. Bonus choices must NOT include the 'lucky' job.
    const bonusRoll = Math.random();
    const eligibleForBonus = jobs.filter(j => j.id !== 'lucky');
    const isBonus = (bonusRoll < 0.10) && eligibleForBonus.length >= 2; // 10% chance but only if >=2 non-lucky jobs
    if(isBonus) qs('#bonusNotice').classList.remove('hidden'); else qs('#bonusNotice').classList.add('hidden');

    // choose results in advance
    let chosenA = null;
    let chosenB = null;
    if(isBonus){
      // pick two distinct random jobs from eligibleForBonus
      const aIdx = Math.floor(Math.random()*eligibleForBonus.length);
      // pick b from remaining indices
      let bIdx = Math.floor(Math.random()*(eligibleForBonus.length-1));
      if(bIdx >= aIdx) bIdx += 1;
      chosenA = eligibleForBonus[aIdx];
      chosenB = eligibleForBonus[bIdx];
    } else {
      // single pick may include 'lucky'
      chosenA = jobs[ran()];
    }

    const tick = () => {
      const elapsed = Date.now()-start;
      if(elapsed >= duration){
        clearInterval(ticker);
        revealResults(isBonus, chosenA, chosenB);
        return;
      }
      // show random job title to create suspense
      spinner.textContent = jobs[Math.floor(Math.random()*jobs.length)].title + '...';
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
    // newest first
    hist.forEach((h, idx) =>{
      const d = document.createElement('div');
      d.className = 'history-item' + (idx===0 ? ' assigned' : '');
      d.innerHTML = '<strong>'+escapeHtml((people.find(p=>p.id===h.person)||{name:h.person}).name) + '</strong> — ' + escapeHtml(new Date(h.ts).toLocaleString()) + ': <em>' + escapeHtml(h.job) + '</em>' + (h.desc ? '<div class="small">' + escapeHtml(h.desc) + '</div>' : '');
      target.appendChild(d);
    })
    // ensure newest is visible at top
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

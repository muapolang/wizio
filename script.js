// ---- Hero console log animation ----
  const logs = [
    { t:'12:04:01', tag:'OBSERVE', cls:'observe', text:'Pulled 214 invoices from NetSuite export' },
    { t:'12:04:03', tag:'PLAN',    cls:'plan',    text:'3 vendors flagged for mismatch, drafting reconciliation' },
    { t:'12:04:09', tag:'ACT',     cls:'act',     text:'Updated 211 line items, flagged 3 for review' },
    { t:'12:04:12', tag:'VERIFY',  cls:'verify',  text:'Totals match ledger within $0.00 — awaiting your sign-off' },
  ];
  const logEl = document.getElementById('log-lines');
  const chip = document.getElementById('chip');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderLine(l){
    const div = document.createElement('div');
    div.className = 'log-line';
    div.innerHTML = `<span class="t">${l.t}</span><span class="tag ${l.cls}">${l.tag}</span><span>${l.text}</span>`;
    logEl.appendChild(div);
    requestAnimationFrame(()=> div.classList.add('show'));
  }

  function playLog(){
    logEl.innerHTML = '';
    if(reduced){
      logs.forEach(renderLine);
      const cur = document.createElement('span'); cur.className='cursor'; logEl.appendChild(cur);
      chip.textContent = 'DONE'; chip.classList.remove('running'); chip.classList.add('done');
      return;
    }
    logs.forEach((l,i)=>{
      setTimeout(()=> renderLine(l), i*950);
    });
    setTimeout(()=>{
      const cur = document.createElement('span'); cur.className='cursor'; logEl.appendChild(cur);
      chip.textContent = 'DONE';
      chip.classList.remove('running'); chip.classList.add('done');
    }, logs.length*950 + 300);
  }
  window.addEventListener('load', ()=>{ if(logEl && chip) setTimeout(playLog, 300); });

  // ---- Tabs ----
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.solution-panel');
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.solution-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });

  // ---- Scroll reveal (degrades gracefully if IO is unavailable) ----
  try{
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold:0.12 });
      document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach(el=> el.classList.add('in'));
    }
  } catch(err){
    document.querySelectorAll('.reveal').forEach(el=> el.classList.add('in'));
  }

  // ---- Modal system ----
  const overlay = document.getElementById('modal-overlay');
  const modalEl = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  const modalClose = document.getElementById('modal-close');
  let lastFocused = null;

  const RECIPIENT_EMAIL = 'henrylimhy@gmail.com';

  const modalTemplates = {
    demo: {
      eyebrow: 'Book a demo',
      title: "See Wizio on your own workflow.",
      sub: "Tell us a bit about your team. We'll follow up with times that work.",
      endpoint:'https://formspree.io/f/mqpazreo',
      fields: [
        { id:'d-name', formKey:'name', label:'Full name', type:'text', placeholder:'Jordan Lee', required:true },
        { id:'d-email', formKey:'email', label:'Work email', type:'email', placeholder:'jordan@company.com', required:true },
        { id:'d-company', formKey:'company', label:'Company', type:'text', placeholder:'Company name', required:true },
        { id:'d-size', formKey:'team_size', label:'Team size', type:'select', options:['1–10','11–50','51–200','201–1000','1000+'], required:true },
      ],
      cta:'Request demo',
      mailSubject: 'New demo request — Wizio site',
      success:{ title:'Request received.', body:"Thanks — we'll email you within one business day to find a time that works." },
      error:"Something went wrong sending your request. Please try again."
    },
    start: {
      eyebrow:'Start building',
      title:'Create your Wizio workspace.',
      sub:'No credit card needed — deploy your first agent in an afternoon.',
      endpoint:'https://formspree.io/f/mzezbdoa',
      fields:[
        { id:'s-email', formKey:'email', label:'Work email', type:'email', placeholder:'you@company.com', required:true },
        { id:'s-company', formKey:'company', label:'Company', type:'text', placeholder:'Company name', required:true },
        { id:'s-password', label:'Password', type:'password', placeholder:'At least 8 characters', required:true, minlength:8 },
      ],
      cta:'Create workspace',
      mailSubject: 'New workspace signup — Wizio site',
      success:{ title:"You're in.", body:"Thanks — we've received your details and will email you shortly to finish setting up your workspace." },
      error:"Something went wrong creating your workspace. Please try again."
    },
    contact: {
      eyebrow:'Contact',
      title:'Get in touch.',
      sub:"Questions about Wizio? Send a message and we'll route it to the right person.",
      endpoint:'https://formspree.io/f/xeaojyqq',
      fields:[
        { id:'c-name', formKey:'name', label:'Full name', type:'text', placeholder:'Jordan Lee', required:true },
        { id:'c-email', formKey:'email', label:'Email', type:'email', placeholder:'you@company.com', required:true },
        { id:'c-message', formKey:'message', label:'Message', type:'textarea', placeholder:'How can we help?', required:true },
      ],
      cta:'Send message',
      mailSubject: 'New contact message — Wizio site',
      success:{ title:'Message sent.', body:"Thanks for reaching out — we'll get back to you shortly." },
      error:"Something went wrong sending your message. Please try again."
    }
  };

  function fieldHTML(f){
    const req = f.required ? 'required' : '';
    if(f.type === 'select'){
      const opts = f.options.map(o=>`<option value="${o}">${o}</option>`).join('');
      return `<div class="field" data-field="${f.id}">
        <label for="${f.id}">${f.label}</label>
        <select id="${f.id}" name="${f.id}" ${req}><option value="" disabled selected>Choose one</option>${opts}</select>
        <div class="field-error">Please make a selection.</div>
      </div>`;
    }
    if(f.type === 'textarea'){
      return `<div class="field" data-field="${f.id}">
        <label for="${f.id}">${f.label}</label>
        <textarea id="${f.id}" name="${f.id}" placeholder="${f.placeholder||''}" ${req}></textarea>
        <div class="field-error">This field is required.</div>
      </div>`;
    }
    return `<div class="field" data-field="${f.id}">
      <label for="${f.id}">${f.label}</label>
      <input id="${f.id}" name="${f.id}" type="${f.type}" placeholder="${f.placeholder||''}" ${req} ${f.minlength?`minlength="${f.minlength}"`:''}>
      <div class="field-error">${f.type==='email' ? 'Enter a valid email address.' : 'This field is required.'}</div>
    </div>`;
  }

  function renderModal(type){
    const t = modalTemplates[type];
    if(!t) return;
    modalContent.innerHTML = `
      <div class="modal-eyebrow">${t.eyebrow}</div>
      <h3 id="modal-heading">${t.title}</h3>
      <p class="modal-sub">${t.sub}</p>
      <form id="modal-form" novalidate>
        ${t.fields.map(fieldHTML).join('')}
        <p class="form-error" id="modal-form-error" hidden></p>
        <button type="submit" class="btn btn-primary">${t.cta}</button>
      </form>
    `;
    const form = document.getElementById('modal-form');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      let valid = true;
      t.fields.forEach(f=>{
        const el = document.getElementById(f.id);
        const wrap = form.querySelector(`[data-field="${f.id}"]`);
        let ok = true;
        if(f.required && !el.value.trim()) ok = false;
        if(f.type === 'email' && el.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) ok = false;
        if(f.minlength && el.value.length < f.minlength) ok = false;
        wrap.classList.toggle('invalid', !ok);
        if(!ok) valid = false;
      });
      if(!valid){
        const firstInvalid = form.querySelector('.invalid input, .invalid select, .invalid textarea');
        if(firstInvalid) firstInvalid.focus();
        return;
      }

      if(t.endpoint){
        submitToFormspree(t, form);
      } else {
        submitViaMailto(t, form);
      }
    });
  }

  function showSuccess(t){
    modalContent.innerHTML = `
      <div class="modal-success">
        <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
        <h3>${t.success.title}</h3>
        <p>${t.success.body}</p>
        <button type="button" class="btn btn-outline" id="modal-success-close" style="width:100%;justify-content:center;">Close</button>
      </div>
    `;
    document.getElementById('modal-success-close').addEventListener('click', closeModal);
  }

  function submitViaMailto(t, form){
    // Build a mailto link so the visitor's own email client sends this to us —
    // a static site has no server to deliver mail silently on its own.
    const bodyLines = [];
    let hasPassword = false;
    t.fields.forEach(f=>{
      if(f.type === 'password'){ hasPassword = true; return; }
      const el = document.getElementById(f.id);
      bodyLines.push(`${f.label}: ${el.value.trim()}`);
    });
    if(hasPassword) bodyLines.push('Password: (not included in email for security)');
    const mailto = `mailto:${RECIPIENT_EMAIL}`
      + `?subject=${encodeURIComponent(t.mailSubject || t.title)}`
      + `&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
    showSuccess(t);
  }

  function submitToFormspree(t, form){
    const button = form.querySelector('button[type="submit"]');
    const errorEl = form.querySelector('#modal-form-error');
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    if(errorEl){ errorEl.hidden = true; errorEl.textContent = ''; }

    const payload = {};
    t.fields.forEach(f=>{
      if(f.type === 'password') return; // never transmit passwords to a third-party form service
      const el = document.getElementById(f.id);
      payload[f.formKey || f.id] = el.value.trim();
    });
    payload._subject = t.mailSubject || t.title;

    fetch(t.endpoint, {
      method:'POST',
      headers:{ 'Accept':'application/json', 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    })
    .then(response=>{
      if(response.ok){
        showSuccess(t);
        return;
      }
      return response.json().catch(()=>({})).then(data=>{
        throw new Error((data && data.errors && data.errors.map(e=>e.message).join(', ')) || 'Request failed');
      });
    })
    .catch(()=>{
      button.disabled = false;
      button.textContent = originalLabel;
      if(errorEl){
        errorEl.hidden = false;
        errorEl.textContent = t.error || 'Something went wrong. Please try again.';
      }
    });
  }

  function openModal(type){
    lastFocused = document.activeElement;
    renderModal(type);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    setTimeout(()=>{
      const firstField = modalContent.querySelector('input,select,textarea');
      if(firstField) firstField.focus();
    }, 60);
  }

  function closeModal(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if(lastFocused) lastFocused.focus();
  }

  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    if(e.key === 'Tab' && overlay.classList.contains('open')){
      const focusables = modalEl.querySelectorAll('button, input, select, textarea, a[href]');
      if(!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  document.querySelectorAll('[data-modal]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      openModal(el.getAttribute('data-modal'));
    });
  });

  // ---- Toast system ----
  const toastStack = document.getElementById('toast-stack');
  function showToast(msg){
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastStack.appendChild(el);
    requestAnimationFrame(()=> el.classList.add('show'));
    setTimeout(()=>{
      el.classList.remove('show');
      setTimeout(()=> el.remove(), 300);
    }, 3200);
  }
  document.querySelectorAll('[data-toast]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      showToast(el.getAttribute('data-toast'));
    });
  });

// ---- Pricing: billing toggle ----
(function(){
  const toggle = document.querySelector('.billing-toggle');
  if(!toggle) return;
  const buttons = toggle.querySelectorAll('button[data-cycle]');
  const amounts = document.querySelectorAll('[data-monthly]');
  const notes = document.querySelectorAll('[data-note-monthly]');

  function setCycle(cycle){
    buttons.forEach(b=> b.classList.toggle('active', b.getAttribute('data-cycle') === cycle));
    amounts.forEach(el=>{
      const val = cycle === 'annual' ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
      el.textContent = val;
    });
    notes.forEach(el=>{
      const val = cycle === 'annual' ? el.getAttribute('data-note-annual') : el.getAttribute('data-note-monthly');
      el.textContent = val;
    });
  }

  buttons.forEach(b=>{
    b.addEventListener('click', ()=> setCycle(b.getAttribute('data-cycle')));
  });

  setCycle('monthly');
})();

(function(){
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  function syncHeaderHeight(){
    const header = qs('.site-header');
    if(!header) return;
    const h = Math.round(header.getBoundingClientRect().height);
    if(h > 0) document.documentElement.style.setProperty('--header-h', h + 'px');
  }

  function setupMobileMenu(){
    const btn = qs('[data-menu-btn]');
    const drawer = qs('[data-mobile-drawer]');
    if(!btn || !drawer) return;

    const closeOnScroll = () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if(expanded) close();
    };

    function close(){
      drawer.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      window.removeEventListener('scroll', closeOnScroll);
      window.removeEventListener('touchmove', closeOnScroll);
    }
    function open(){
      drawer.style.display = 'block';
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      // Close the menu when the user scrolls the page (common mobile expectation)
      window.addEventListener('scroll', closeOnScroll, { passive: true });
      window.addEventListener('touchmove', closeOnScroll, { passive: true });
    }

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      expanded ? close() : open();
    });

    drawer.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if(a) close();
    });

    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') close();
    });
  }

  function setupLangToggle(){
    const en = qs('#lang-en');
    const es = qs('#lang-es');
    if(!en || !es) return;

    const path = window.location.pathname || '';
    const file = path.split('/').pop() || 'index.html';
    const inEs = path.includes('/es/');
    const hash = window.location.hash || '';

    if(inEs){
      es.classList.add('active');
      en.classList.remove('active');
      en.setAttribute('href', '../' + file + hash);
      es.setAttribute('href', file + hash);
    }else{
      en.classList.add('active');
      es.classList.remove('active');
      en.setAttribute('href', file + hash);
      es.setAttribute('href', 'es/' + file + hash);
    }
  }

  function ensureTelegramModal(){
    if(qs('#telegram-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'telegram-modal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="modal-backdrop" data-tg-close></div>
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="tg-modal-title">
        <div class="modal-header">
          <h2 class="modal-title" id="tg-modal-title">Get Started</h2>
          <button class="modal-close" type="button" data-tg-close aria-label="Close">×</button>
        </div>

        <div class="modal-lang" aria-label="Language in modal">
          <button type="button" data-tg-lang="en">English</button>
          <button type="button" data-tg-lang="es">Spanish</button>
        </div>

        <div class="modal-body">
          <p class="modal-lead" id="tg-modal-lead"></p>
          <p id="tg-modal-body"></p>
          <ul class="modal-list" id="tg-modal-list"></ul>
          <p id="tg-modal-steps"></p>
          <p class="modal-small" id="tg-modal-note"></p>

          <div class="modal-actions">
            <a class="btn btn-primary" id="tg-modal-cta" href="https://t.me/kwikclaimsinc" target="_blank" rel="noopener">Open Telegram Chat</a>
            <button class="btn btn-outline" type="button" data-tg-close>Close</button>
          </div>

          <div class="modal-small" id="tg-modal-foot"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function setupTelegramModal(){
    ensureTelegramModal();

    const modal = qs('#telegram-modal');
    if(!modal) return;

    const titleEl = qs('#tg-modal-title', modal);
    const leadEl = qs('#tg-modal-lead', modal);
    const bodyEl = qs('#tg-modal-body', modal);
    const listEl = qs('#tg-modal-list', modal);
    const stepsEl = qs('#tg-modal-steps', modal);
    const noteEl = qs('#tg-modal-note', modal);
    const footEl = qs('#tg-modal-foot', modal);
    const ctaEl = qs('#tg-modal-cta', modal);
    const langBtns = qsa('[data-tg-lang]', modal);

    const TG_LINK = 'https://t.me/kwikclaimsinc';
    let currentContext = 'general';
    let currentLang = (document.documentElement.lang || '').toLowerCase().startsWith('es') ? 'es' : 'en';
    let lastFocus = null;
    const copy = {
      general: {
        en: {
          title: 'Join us on Telegram',
          lead: 'See results, ask questions, and get next steps — without committing today.',
          body: 'Telegram is where we share real approvals, scopes, and contractor wins. Joining is free.',
          bullets: [
            'See real approvals, scopes, and community wins',
            'Message us directly (photos, videos, voice/video calls)',
            'Get guidance on which service fits your situation',
          ],
          steps: 'To start: Download Telegram → Tap “Join” → Send a quick message: what you do + your city/state + what you need.',
          note: 'Spots are limited. Joining Telegram is free — no pressure to buy today.',
          cta: 'Open Telegram',
          foot: 'Telegram keeps everything in one thread, so photos, updates, and next steps don’t get lost.'
        },
        es: {
          title: 'Únete a Telegram',
          lead: 'Ver resultados, hacer preguntas y recibir próximos pasos — sin compromiso hoy.',
          body: 'En Telegram compartimos aprobaciones reales, alcances y resultados de contratistas. Unirse es gratis.',
          bullets: [
            'Aprobaciones y resultados reales',
            'Escríbenos (fotos, videos, llamadas dentro de Telegram)',
            'Te guiamos al servicio correcto',
          ],
          steps: 'Para empezar: Descarga Telegram → Toca “Join” → Envíanos: qué haces + ciudad/estado + qué necesitas.',
          note: 'Cupos limitados. Unirse es gratis — sin presión para comprar hoy.',
          cta: 'Abrir Telegram',
          foot: 'Telegram mantiene todo en un solo chat para que no se pierdan fotos, actualizaciones y próximos pasos.'
        }
      },

      claim: {
        en: {
          title: 'Insurance Claim Management ($599/mo)',
          lead: 'Do you want to start doing insurance restoration jobs that pay $10,000 to $100,000 per project?',
          body: 'We do it for you: carrier‑ready loss assessment/estimate + documentation package, and adjuster follow‑up — so you stay on production.',
          bullets: [
            'Unlimited current claims — flat $599/month',
            'We handle estimating, documentation, and adjuster follow‑up',
            'You keep 100% of insurance proceeds (we take 0%)',
            '97% approval rate (internal tracking) + included lead‑gen training',
          ],
          steps: 'To start: Download Telegram → Tap “Join” → Message: your trade + city/state + how many claims you want to start with.',
          note: 'First step: join our Telegram channel (free) to see results before spending anything. Spots are limited.',
          cta: 'Join Telegram for Claim Management',
          foot: 'Telegram is the fastest way to send photos/videos and get next steps.'
        },
        es: {
          title: 'Gestión de Reclamos de Seguro ($599/mes)',
          lead: '¿Quieres empezar a hacer trabajos de restauración con seguro que pagan entre $10,000 y $100,000 por proyecto?',
          body: 'Nosotros lo hacemos por ti: paquete listo para el ajustador + seguimiento con el ajustador — para que te enfoques en producción.',
          bullets: [
            'Reclamos ilimitados — tarifa fija $599/mes',
            'Estimación + documentación + seguimiento con el ajustador',
            'Tú te quedas con el 100% del dinero del seguro (0% para nosotros)',
            '97% de aprobación (seguimiento interno) + capacitación incluida',
          ],
          steps: 'Para empezar: Descarga Telegram → Toca “Join” → Envíanos: tu oficio + ciudad/estado + cuántos reclamos quieres iniciar.',
          note: 'Primer paso: únete a nuestro Telegram (gratis) para ver resultados antes de gastar. Cupos limitados.',
          cta: 'Unirme a Telegram',
          foot: 'Telegram es la forma más rápida de enviar fotos/videos y recibir próximos pasos.'
        }
      },

      custom: {
        en: {
          title: 'Custom AI App for Your Company',
          lead: 'Replace spreadsheets, docs, and manual follow‑ups with a system built for your workflow.',
          body: 'Starting at $15,000. We build a custom AI‑integrated web app: estimate + document generation, DocuSigns, AI photo analysis, project tracking, and more.',
          bullets: [
            'Estimate + document generation tailored to your templates',
            'DocuSign workflows + approvals',
            'AI photo analysis + missing‑item flags',
            'Project tracking, dashboards, and integrations',
            'Optional AI phone receptionist for booking calls',
          ],
          steps: 'To start: Download Telegram → Tap “Join” → Message: company type + current workflow + must‑have features.',
          note: 'First step: join Telegram (free) to see demos and request a build quote. Spots are limited.',
          cta: 'Request a Build Quote on Telegram',
          foot: 'Telegram makes it easy to share examples of your current docs and workflows.'
        },
        es: {
          title: 'App de IA Personalizada para tu Empresa',
          lead: 'Reemplaza hojas de cálculo, documentos y seguimientos manuales con un sistema hecho para tu flujo.',
          body: 'Desde $15,000. Construimos una app web con IA: estimaciones y documentos, DocuSigns, análisis de fotos con IA, seguimiento de proyectos y más.',
          bullets: [
            'Estimaciones y documentos según tus plantillas',
            'Flujos de DocuSign y aprobaciones',
            'Análisis de fotos con IA y alertas de faltantes',
            'Seguimiento de proyectos, paneles e integraciones',
            'Recepcionista telefónica con IA (opcional) para agendar',
          ],
          steps: 'Para empezar: Descarga Telegram → Toca “Join” → Envíanos: tipo de empresa + flujo actual + funciones necesarias.',
          note: 'Primer paso: únete a Telegram (gratis) para ver demos y solicitar cotización. Cupos limitados.',
          cta: 'Solicitar cotización en Telegram',
          foot: 'Telegram facilita compartir ejemplos de tus documentos y procesos actuales.'
        }
      },

      emergency: {
        en: {
          title: 'Emergency Loss Mitigation & Restoration Management',
          lead: 'Commercial‑only on‑call emergency response.',
          body: 'Subscription pricing tailored to your building. We can dispatch a trained contractor (typically within 48 hours, based on availability) to mitigate and document the problem and support insurance‑covered vs. retail decisions.',
          bullets: [
            'Commercial properties only',
            'Dispatch + on‑site documentation',
            'Claim workflow support + contractor coordination',
            'Network of 500+ contractors (scaling to thousands by end of 2026)',
          ],
          steps: 'To start: Download Telegram → Tap “Join” → Message: building type + city/state + what “emergency” looks like for you (water, fire, storm, etc.).',
          note: 'First step: join Telegram (free) to request subscription pricing and see commercial results. Spots are limited.',
          cta: 'Request Subscription Pricing on Telegram',
          foot: 'Telegram is ideal for fast photos/videos during an emergency.'
        },
        es: {
          title: 'Mitigación y Gestión de Restauración de Emergencia',
          lead: 'Respuesta de emergencia bajo demanda (solo comercial).',
          body: 'Precio por suscripción según tu edificio. Podemos enviar un contratista capacitado (normalmente dentro de 48 horas, según disponibilidad) para mitigar y documentar el problema y apoyar decisiones de seguro vs. retail.',
          bullets: [
            'Solo propiedades comerciales',
            'Despacho + documentación en sitio',
            'Apoyo en reclamo + coordinación de contratistas',
            'Red de 500+ contratistas (creciendo a miles para finales de 2026)',
          ],
          steps: 'Para empezar: Descarga Telegram → Toca “Join” → Envíanos: tipo de edificio + ciudad/estado + qué significa “emergencia” para ti (agua, fuego, tormenta, etc.).',
          note: 'Primer paso: únete a Telegram (gratis) para solicitar precio y ver resultados. Cupos limitados.',
          cta: 'Solicitar precio en Telegram',
          foot: 'Telegram es ideal para enviar fotos/videos rápido durante una emergencia.'
        }
      },

      commercial: {
        en: {
          title: 'Commercial Building Assessments',
          lead: 'Millions being recovered starts with a thorough building assessment.',
          body: 'Commercial-only. $4,500 inspection fee — waived if one of our contracting partners is selected for the scope of work (insurance‑covered or retail). We tailor the checklist and report to your building type and age.',
          bullets: [
            'Tailored checklist based on building type & age',
            'Thorough report package with priorities + photos',
            'Clarify insurance‑covered vs. retail scope',
            '$4,500 fee can be waived with partner selection',
          ],
          steps: 'To start: Download Telegram → Tap “Join” → Message: building type + city/state + approximate size + age.',
          note: 'First step: join Telegram (free) to see examples and book an assessment. Spots are limited.',
          cta: 'Book Assessment on Telegram',
          foot: 'Telegram makes it easy to share inspection photos and receive updates.'
        },
        es: {
          title: 'Evaluaciones de Edificios Comerciales',
          lead: 'La recuperación de millones comienza con una evaluación completa.',
          body: 'Solo comercial. Tarifa de $4,500 — se exenta si se selecciona uno de nuestros socios contratistas para el trabajo (seguro o retail). Adaptamos el checklist y el informe al tipo y edad del edificio.',
          bullets: [
            'Checklist a medida según tipo y edad del edificio',
            'Informe detallado con prioridades y fotos',
            'Aclarar alcance seguro vs. retail',
            'La tarifa de $4,500 se puede exentar con la selección de socio',
          ],
          steps: 'Para empezar: Descarga Telegram → Toca “Join” → Envíanos: tipo de edificio + ciudad/estado + tamaño aproximado + edad.',
          note: 'Primer paso: únete a Telegram (gratis) para ver ejemplos y reservar. Cupos limitados.',
          cta: 'Reservar evaluación en Telegram',
          foot: 'Telegram facilita compartir fotos de inspección y recibir actualizaciones.'
        }
      }
    };


    function setLang(lang){
      currentLang = (lang === 'es') ? 'es' : 'en';
      langBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-tg-lang') === currentLang));
      render();
    }

    function render(){
      const ctx = copy[currentContext] || copy.general;
      const text = ctx[currentLang] || copy.general[currentLang];

      titleEl.textContent = text.title;
      leadEl.textContent = text.lead;
      bodyEl.textContent = text.body;

      listEl.innerHTML = '';
      (text.bullets || []).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        listEl.appendChild(li);
      });

      stepsEl.textContent = text.steps || '';
      noteEl.textContent = text.note || '';
      footEl.textContent = text.foot || '';

      ctaEl.textContent = text.cta || (currentLang === 'es' ? 'Abrir Telegram' : 'Open Telegram');
      ctaEl.setAttribute('href', TG_LINK);
    }

    function open(context){
      currentContext = context || 'general';
      lastFocus = document.activeElement;
      render();

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      syncHeaderHeight();

      const closeBtn = qs('.modal-close', modal);
      if(closeBtn) closeBtn.focus();
    }

    function close(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if(lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    // Default language based on page; allow user to switch
    setLang(currentLang);

    // Open / close handlers
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-tg-open]');
      if(opener){
        e.preventDefault();
        open(opener.getAttribute('data-tg-open') || 'general');
        return;
      }
      const closer = e.target.closest('[data-tg-close]');
      if(closer){
        e.preventDefault();
        close();
      }
    });

    // Language buttons inside modal
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setLang(btn.getAttribute('data-tg-lang') || 'en');
      });
    });

    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }

  function setupYear(){
    const el = qs('[data-year]');
    if(el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncHeaderHeight();
    setupMobileMenu();
    setupLangToggle();
    setupTelegramModal();
    setupYear();
  });

  window.addEventListener('resize', syncHeaderHeight);
})();
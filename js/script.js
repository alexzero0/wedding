(function () {
  'use strict';

  /* ---------- Стартовый экран ---------- */
  var startScreen = document.getElementById('startScreen');
  var openBtn = document.getElementById('openInvite');
  var music = document.getElementById('bgMusic');
  var musicBtn = document.getElementById('musicBtn');
  var opened = false;

  function openInvite() {
    if (opened) return;
    opened = true;
    document.body.classList.add('is-open');
    startScreen.classList.add('hidden');
    setTimeout(function () { startScreen.remove(); }, 1000);
    // музыка стартует по жесту пользователя
    music.play().then(function () {
      musicBtn.classList.add('playing');
    }).catch(function () { /* без звука — не страшно */ });
  }

  openBtn.addEventListener('click', openInvite);
  startScreen.addEventListener('click', openInvite);

  // авто-открытие для проверки и при повторном визите в рамках сессии
  if (/[?#&]open/.test(location.search + location.hash) ||
      sessionStorage.getItem('inviteOpened')) {
    startScreen.remove();
    document.body.classList.add('is-open');
    opened = true;
  } else {
    sessionStorage.setItem('inviteOpened', '1');
  }

  /* ---------- Музыка ---------- */
  musicBtn.addEventListener('click', function () {
    if (music.paused) {
      music.play();
      musicBtn.classList.add('playing');
    } else {
      music.pause();
      musicBtn.classList.remove('playing');
    }
  });

  /* ---------- Таймер до свадьбы ---------- */
  // 10 октября 2026, 09:50 — начало торжественной регистрации
  var WEDDING_DATE = new Date(2026, 9, 10, 9, 50, 0);

  var cd = {
    weeks: document.getElementById('cdWeeks'),
    days: document.getElementById('cdDays'),
    hours: document.getElementById('cdHours'),
    minutes: document.getElementById('cdMinutes'),
    seconds: document.getElementById('cdSeconds')
  };

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function setNum(el, val) {
    var str = pad(val);
    if (el.textContent !== str) {
      el.classList.remove('tick');
      // перезапуск анимации смены цифры
      void el.offsetWidth;
      el.classList.add('tick');
      el.textContent = str;
    }
  }

  function countdown() {
    var diff = WEDDING_DATE - new Date();
    if (diff <= 0) {
      document.getElementById('countdown').classList.add('countdown--done');
      return;
    }
    var min = Math.floor(diff / 60000);
    setNum(cd.weeks, Math.floor(min / 10080));
    setNum(cd.days, Math.floor((min % 10080) / 1440));
    setNum(cd.hours, Math.floor((min % 1440) / 60));
    setNum(cd.minutes, min % 60);
    setNum(cd.seconds, Math.floor(diff / 1000) % 60);
  }

  countdown();
  setInterval(countdown, 1000);

  /* ---------- Отправка на Formspree ---------- */
  var FORMSPREE = 'https://formspree.io/f/xljepoqy';

  function sendToFormspree(data) {
    return fetch(FORMSPREE, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Модальное окно с именем ---------- */
  var nameModal = document.getElementById('nameModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalSub = document.getElementById('modalSub');
  var modalForm = document.getElementById('modalForm');
  var modalName = document.getElementById('modalName');
  var modalError = document.getElementById('modalError');
  var modalCancel = document.getElementById('modalCancel');
  var modalSend = document.getElementById('modalSend');
  var modalCallback = null;

  function setSending(on) {
    modalSend.disabled = on;
    modalSend.textContent = on ? 'Отправляем…' : 'Отправить';
  }

  function closeNameModal() {
    nameModal.hidden = true;
    modalCallback = null;
    setSending(false);
  }

  function openNameModal(title, sub, onOk) {
    modalTitle.textContent = title;
    modalSub.textContent = sub || '';
    modalSub.hidden = !sub;
    modalError.hidden = true;
    modalName.value = localStorage.getItem('guestName') || '';
    modalCallback = onOk;
    setSending(false);
    nameModal.hidden = false;
    setTimeout(function () { modalName.focus(); }, 60);
  }

  modalForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = modalName.value.trim();
    if (!name) {
      modalError.textContent = 'Пожалуйста, введите имя.';
      modalError.hidden = false;
      return;
    }
    if (!modalCallback) { closeNameModal(); return; }
    setSending(true);
    modalCallback(name, function (err) {
      if (err) {
        setSending(false);
        modalError.textContent = 'Не удалось отправить. Проверьте интернет и попробуйте ещё раз.';
        modalError.hidden = false;
      } else {
        localStorage.setItem('guestName', name);
        closeNameModal();
      }
    });
  });

  modalCancel.addEventListener('click', closeNameModal);
  nameModal.addEventListener('click', function (e) {
    if (e.target === nameModal) closeNameModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !nameModal.hidden) closeNameModal();
  });

  /* ---------- Подтверждение присутствия ---------- */
  var rsvpBtn = document.getElementById('rsvpBtn');
  var rsvpCancel = document.getElementById('rsvpCancel');
  var rsvpActions = document.getElementById('rsvpActions');
  var rsvpDone = document.getElementById('rsvpDone');
  var rsvpThanks = document.querySelector('.rsvp-thanks');

  function showRsvpState() {
    var ok = localStorage.getItem('rsvpConfirmed') === '1';
    rsvpActions.hidden = ok;
    rsvpDone.hidden = !ok;
    if (ok) {
      var name = localStorage.getItem('guestName');
      rsvpThanks.innerHTML = (name ? 'Спасибо, <b>' + esc(name) + '</b>! В' : 'В') +
        'аше подтверждение отправлено — <b>Александр</b> и <b>Антонина</b> уже оповещены об этом ;)';
    }
  }

  if (rsvpBtn) {
    showRsvpState();
    rsvpBtn.addEventListener('click', function () {
      openNameModal('Подтверждение присутствия',
        'Рады, что вы будете с нами! Как обращаться к вам?',
        function (name, done) {
          sendToFormspree({ form: 'rsvp', name: name, message: 'Подтверждение присутствия' })
            .then(function () {
              localStorage.setItem('rsvpConfirmed', '1');
              localStorage.setItem('guestName', name);
              showRsvpState();
              done();
            })
            .catch(function () { done(true); });
        });
    });
    rsvpCancel.addEventListener('click', function () {
      var name = localStorage.getItem('guestName');
      localStorage.removeItem('rsvpConfirmed');
      showRsvpState();
      if (name) {
        sendToFormspree({ form: 'rsvp-cancel', name: name, message: 'Отмена подтверждения' }).catch(function () {});
      }
    });
  }

  /* ---------- Опрос ---------- */
  var oprosForm = document.getElementById('oprosForm');
  var oprosSubmit = document.getElementById('oprosSubmit');
  var oprosDone = document.getElementById('oprosDone');
  var OPROS_FIELDS = ['food', 'alco', 'plus', 'child'];

  if (oprosForm) {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('oprosAnswers') || '{}'); } catch (e) { saved = {}; }
    oprosForm.querySelectorAll('input[type="radio"]').forEach(function (r) {
      if (saved[r.name] === r.value) { r.checked = true; }
    });

    function showOprosDone() {
      var name = localStorage.getItem('guestName');
      oprosDone.innerHTML = (name ? 'Спасибо за ответы, <b>' + esc(name) + '</b>! ' : 'Спасибо за ответы! ') +
        '<b>Александр</b> и <b>Антонина</b> учтут ваши пожелания ;)';
      oprosSubmit.hidden = true;
      oprosDone.hidden = false;
    }
    if (Object.keys(saved).length > 0) showOprosDone();

    // снять подсветку незаполненного вопроса при выборе
    oprosForm.addEventListener('change', function (e) {
      var q = e.target.closest('.q');
      if (q) q.classList.remove('q-missing');
    });

    oprosForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var answers = {};
      var missing = null;
      OPROS_FIELDS.forEach(function (f) {
        var c = oprosForm.querySelector('input[name="' + f + '"]:checked');
        if (c) { answers[f] = c.value; }
        else if (!missing) { missing = oprosForm.querySelector('input[name="' + f + '"]').closest('.q'); }
      });
      if (missing) {
        missing.classList.add('q-missing');
        missing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      openNameModal('Опрос',
        'Ответы передадут молодым — представьтесь, пожалуйста',
        function (name, done) {
          var data = { form: 'opros', name: name };
          OPROS_FIELDS.forEach(function (f) { data[f] = answers[f] || '—'; });
          sendToFormspree(data)
            .then(function () {
              localStorage.setItem('oprosAnswers', JSON.stringify(answers));
              localStorage.setItem('guestName', name);
              showOprosDone();
              done();
            })
            .catch(function () { done(true); });
        });
    });
  }

  /* ---------- Бесконечный канат: движение привязано к скроллу ---------- */
  (function () {
    var wraps = Array.prototype.slice.call(document.querySelectorAll('.divider'));
    if (!wraps.length) return;

    var SPEED = 0.5;   // пикселей каната на пиксель скролла
    var EASE = 0.09;   // плавность (коэффициент lerp)

    var ropes = wraps.map(function (wrap) {
      var track = wrap.querySelector('.divider-track');
      var base = track ? track.querySelector('img') : null;
      return {
        track: track,
        base: base,
        dir: wrap.getAttribute('data-dir') === '-1' ? -1 : 1,
        period: 0,
        pos: 0
      };
    }).filter(function (r) { return r.track && r.base; });

    // период узора = ширина двух картинок (оригинал + зеркало)
    function build(r) {
      r.track.querySelectorAll('img:not(:first-child)').forEach(function (n) { n.remove(); });
      var w = r.base.getBoundingClientRect().width;
      if (w < 10) w = 300;
      var need = Math.ceil((window.innerWidth + w * 2) / w) + 2;
      var count = Math.max(4, need + (need % 2)); // только чётное число копий
      for (var i = 1; i < count; i++) {
        var c = r.base.cloneNode(false);
        c.removeAttribute('alt');
        r.track.appendChild(c);
      }
      r.period = w * 2;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ropes.forEach(build); // статичная лента без анимации
      return;
    }

    ropes.forEach(build);

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        ropes.forEach(function (r) {
          var x = ((r.pos % r.period) + r.period) % r.period;
          build(r);
          r.pos = x; // сохраняем видимую фазу после пересчёта
        });
      }, 150);
    });

    (function loop() {
      var y = window.scrollY * SPEED;
      ropes.forEach(function (r) {
        r.pos += (y - r.pos) * EASE;
        var x = ((r.pos % r.period) + r.period) % r.period;
        // dir=1  — канат едет влево (от 0 до -period)
        // dir=-1 — канат едет вправо (от -period до 0)
        var shift = r.dir === 1 ? -x : x - r.period;
        r.track.style.transform = 'translate3d(' + shift + 'px,0,0)';
      });
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------- Появление секций при скролле ---------- */
  var revealed = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ---------- Бургер-меню ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');

  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Активный пункт меню при скролле ---------- */
  var links = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function highlight() {
    var y = window.scrollY + window.innerHeight * 0.35;
    var current = sections[0];
    sections.forEach(function (s) {
      if (s.offsetTop <= y) current = s;
    });
    links.forEach(function (a) {
      a.classList.toggle('active', current && a.getAttribute('href') === '#' + current.id);
    });
  }
  window.addEventListener('scroll', highlight, { passive: true });
  highlight();

  /* ---------- Лёгкий параллакс фона в шапке ---------- */
  var hero = document.querySelector('.hero');
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y < window.innerHeight) {
      hero.style.backgroundPosition = 'center calc(50% + ' + y * 0.25 + 'px)';
    }
  }, { passive: true });

  /* ---------- Салют из сердечек по тапу на кольца ---------- */
  var rings = document.querySelector('.footer-rings');
  var COLORS = ['#d4af61', '#c96f6f', '#7fa180', '#e8d9b5', '#a5885f'];

  rings.addEventListener('click', function (e) {
    var rect = rings.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    for (var i = 0; i < 24; i++) burst(x, y);
  });

  function burst(x, y) {
    var heart = document.createElement('span');
    heart.className = 'heart-burst';
    heart.textContent = '\u2665';
    heart.style.left = x + 'px';
    heart.style.top = y + 'px';
    heart.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    heart.style.setProperty('--dx', (Math.random() * 220 - 110) + 'px');
    heart.style.setProperty('--dy', (-80 - Math.random() * 160) + 'px');
    heart.style.setProperty('--rot', (Math.random() * 90 - 45) + 'deg');
    heart.style.fontSize = (14 + Math.random() * 18) + 'px';
    document.body.appendChild(heart);
    heart.addEventListener('animationend', function () { heart.remove(); });
  }

  /* ---------- Мерцающие сердечки в расписании ---------- */
  var timetable = document.querySelector('.timetable');
  if (timetable && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (var i = 0; i < 14; i++) {
      var tw = document.createElement('span');
      tw.className = 'tt-heart';
      tw.textContent = '\u2665';
      tw.style.left = (4 + Math.random() * 92) + '%';
      tw.style.top = (3 + Math.random() * 92) + '%';
      tw.style.color = ['#fff', '#c96f6f', '#d4af61'][Math.floor(Math.random() * 3)];
      tw.style.fontSize = (10 + Math.random() * 14) + 'px';
      tw.style.animationDelay = (Math.random() * 4) + 's';
      tw.style.animationDuration = (2.6 + Math.random() * 2.6) + 's';
      timetable.appendChild(tw);
    }
  }
})();

(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap,
    ST = window.ScrollTrigger;
  var can = !!(G && ST) && !reduce;
  var pre = document.getElementById('pre');
  var progress = document.getElementById('progress');
  var nav = document.getElementById('nav');
  var menu = document.getElementById('menu');
  var menuBtn = document.getElementById('menu-btn');
  var lenis = null;
  var heroCta = document.querySelector('.hero .cta-row');
  var heroCtaSpacer = null;
  var heroCtaSticky = false;

  if (heroCta) {
    heroCtaSpacer = document.createElement('div');
    heroCtaSpacer.className = 'hero-cta-spacer';
    heroCtaSpacer.setAttribute('aria-hidden', 'true');
    heroCta.parentNode.insertBefore(heroCtaSpacer, heroCta);
  }

  var faqItems = document.querySelectorAll('#faq details');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  function killPre() {
    if (pre) {
      pre.remove();
      pre = null;
    }
  }
  if (!can) killPre();

  /* scroll suave */
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    if (can) {
      G.registerPlugin(ST);
      lenis.on('scroll', ST.update);
      G.ticker.add(function (t) {
        lenis.raf(t * 1000);
      });
      G.ticker.lagSmoothing(0);
    } else {
      (function raf(t) {
        lenis.raf(t);
        requestAnimationFrame(raf);
      })(0);
    }
    if (pre) lenis.stop();
  } else if (can) {
    G.registerPlugin(ST);
  }
  if (lenis) {
    lenis.on('scroll', function () {
      window.dispatchEvent(new Event('scroll-world-update'));
    });
  }

  /* barra de progreso y cabecera */
  var lastY = 0;
  function updateHeroCtaSticky() {
    if (!heroCta || !heroCtaSpacer) return;
    var stickyTop = parseFloat(getComputedStyle(heroCta).getPropertyValue('--hero-cta-sticky-top')) || 0;
    var naturalTop = heroCtaSticky ? heroCtaSpacer.getBoundingClientRect().top : heroCta.getBoundingClientRect().top;

    if (!heroCtaSticky && naturalTop <= stickyTop) {
      var rect = heroCta.getBoundingClientRect();
      heroCtaSpacer.style.width = '100%';
      heroCtaSpacer.style.height = rect.height + 'px';
      heroCtaSpacer.style.display = 'block';
      heroCta.classList.add('is-sticky');
      heroCtaSticky = true;
    } else if (heroCtaSticky && naturalTop > stickyTop + 2) {
      heroCta.classList.remove('is-sticky');
      heroCtaSpacer.removeAttribute('style');
      heroCtaSticky = false;
    }
  }
  function onScroll() {
    var y = window.scrollY,
      h = root.scrollHeight - window.innerHeight;
    updateHeroCtaSticky();
    progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (!menu.classList.contains('open')) nav.classList.toggle('hide', y > 160 && y > lastY);
    lastY = y;
  }
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* menú */
  function setMenu(open) {
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.textContent = open ? 'Cerrar' : 'Menú';
    nav.classList.remove('hide');
    if (lenis) {
      open ? lenis.stop() : lenis.start();
    } else document.body.classList.toggle('no-scroll', open);
  }
  menuBtn.addEventListener('click', function () {
    setMenu(!menu.classList.contains('open'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* anclas */
  function goTo(id) {
    var t = id === '#top' ? 0 : document.querySelector(id);
    if (t === null) return;
    if (lenis) lenis.scrollTo(t, { offset: -70, duration: 1.5 });
    else if (t === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var wasOpen = menu.classList.contains('open');
      if (wasOpen) setMenu(false);
      var id = a.getAttribute('href');
      setTimeout(
        function () {
          goTo(id);
        },
        wasOpen ? 60 : 0
      );
    });
  });
  document.getElementById('up').addEventListener('click', function () {
    goTo('#top');
  });

  /* carrusel de proyectos */
  var projectsTrack = document.getElementById('projects-track');
  var projectsPrev = document.getElementById('projects-prev');
  var projectsNext = document.getElementById('projects-next');
  if (projectsTrack && projectsPrev && projectsNext) {
    function updateProjectControls() {
      var maxScroll = projectsTrack.scrollWidth - projectsTrack.clientWidth;
      projectsPrev.disabled = projectsTrack.scrollLeft <= 1;
      projectsNext.disabled = projectsTrack.scrollLeft >= maxScroll - 1;
    }
    projectsPrev.addEventListener('click', function () {
      projectsTrack.scrollBy({ left: -projectsTrack.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    });
    projectsNext.addEventListener('click', function () {
      projectsTrack.scrollBy({ left: projectsTrack.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    });
    projectsTrack.addEventListener('scroll', updateProjectControls, { passive: true });
    window.addEventListener('resize', updateProjectControls);
    updateProjectControls();
  }

  /* copiar correo */
  var copy = document.getElementById('copy');
  copy.addEventListener('click', function () {
    var mail = document.getElementById('mail');
    function select() {
      var r = document.createRange();
      r.selectNodeContents(mail);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
    function done() {
      copy.textContent = '¡Copiado!';
      setTimeout(function () {
        copy.textContent = 'Copia mi email';
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(mail.textContent).then(done, select);
    } else {
      select();
    }
  });

  if (!can) return;

  /* palabras para el texto con scrub */
  document.querySelectorAll('.scrub').forEach(function (p) {
    var words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words
      .map(function (w) {
        return '<span class="w">' + w + '</span>';
      })
      .join(' ');
  });

  /* estado inicial del hero (queda tapado por el preloader) */
  G.set('.hero h1 .ln > span', { yPercent: 110 });
  G.set('.hero-rise', { y: 30, opacity: 0 });

  /* preloader y entrada */
  var c = { v: 0 };
  var n = document.getElementById('pre-n');
  var bar = document.getElementById('pre-bar');
  var tl = G.timeline();
  tl.to(
    c,
    {
      v: 100,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate: function () {
        n.textContent = Math.round(c.v);
      },
    },
    0
  )
    .to(bar, { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
    .to(pre, { yPercent: -100, duration: 1, ease: 'power4.inOut' }, 1.6)
    .add(function () {
      if (lenis) lenis.start();
    }, 2.0)
    .to('.hero h1 .ln > span', { yPercent: 0, duration: 1.2, stagger: 0.12, ease: 'power4.out' }, 2.0)
    .to('.hero-rise', { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out' }, 2.5)
    .add(killPre, 2.8);

  /* imagen del hero: se abre con el scroll */
  G.fromTo(
    '#hero-media',
    { clipPath: 'inset(0% 16% 0% 16% round 32px)' },
    {
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      ease: 'none',
      scrollTrigger: { trigger: '#hero-media', start: 'top 92%', end: 'top 12%', scrub: true },
    }
  );
  G.fromTo(
    '.hero-art',
    { yPercent: -8 },
    {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: '#hero-media', start: 'top bottom', end: 'bottom top', scrub: true },
    }
  );
  /* texto que se ilumina palabra a palabra */
  G.utils.toArray('.scrub').forEach(function (p) {
    G.fromTo(
      p.querySelectorAll('.w'),
      { opacity: 0.2 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 48%', scrub: true },
      }
    );
  });

  /* titulares con máscara */
  G.utils.toArray('.sec-title').forEach(function (t) {
    G.from(t.querySelectorAll('.ln > span'), {
      yPercent: 110,
      duration: 1.2,
      stagger: 0.12,
      ease: 'power4.out',
      scrollTrigger: { trigger: t, start: 'top 88%' },
    });
  });

  /* bloques que suben */
  G.utils.toArray('[data-rv]').forEach(function (el) {
    G.from(el, { y: 56, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  /* proyectos: máscara que se abre y parallax interno */
  G.utils.toArray('.proj').forEach(function (p) {
    G.fromTo(
      p.querySelector('.project-media'),
      { clipPath: 'inset(16% 12% 16% 12% round 28px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 6px)',
        ease: 'none',
        scrollTrigger: { trigger: p, start: 'top 94%', end: 'top 40%', scrub: 0.6 },
      }
    );
    G.from(p.querySelector('.proj-meta'), {
      y: 40,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: p.querySelector('.proj-meta'), start: 'top 95%' },
    });
  });

  /* contadores */
  G.utils.toArray('.count').forEach(function (el) {
    var to = parseFloat(el.dataset.to),
      dec = parseInt(el.dataset.dec, 10) || 0;
    var o = { v: 0 };
    function fmt(v) {
      return v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    ST.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: function () {
        G.to(o, {
          v: to,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: function () {
            el.textContent = fmt(o.v);
          },
          onComplete: function () {
            el.textContent = fmt(to);
          },
        });
      },
    });
  });

  /* anillos del cierre */
  G.fromTo(
    '.orb',
    { yPercent: 20 },
    {
      yPercent: -60,
      ease: 'none',
      scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'bottom top', scrub: true },
    }
  );

  /* cursor y botones magnéticos */
  if (fine) {
    var cur = document.getElementById('cursor');
    var xTo = G.quickTo(cur, 'x', { duration: 0.4, ease: 'power3' });
    var yTo = G.quickTo(cur, 'y', { duration: 0.4, ease: 'power3' });
    window.addEventListener('mousemove', function (e) {
      xTo(e.clientX);
      yTo(e.clientY);
    });
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cur.classList.add('on');
      });
      el.addEventListener('mouseleave', function () {
        cur.classList.remove('on');
      });
    });
    document.querySelectorAll('.mag').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        G.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.25,
          y: (e.clientY - r.top - r.height / 2) * 0.35,
          duration: 0.4,
          ease: 'power3.out',
        });
      });
      el.addEventListener('mouseleave', function () {
        G.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(function () {
      ST.refresh();
    });
  window.addEventListener('load', function () {
    ST.refresh();
  });
})();

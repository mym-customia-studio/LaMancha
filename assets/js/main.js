/* La Mancha — demo MyM. JS mínimo: menú, header, aparición al scroll y avisos de demo. */
(function () {
  'use strict';
  var html = document.documentElement;
  html.classList.add('js');

  /* Header: oculto sobre la portada, aparece al empezar a bajar */
  var top = document.getElementById('top');
  var marcado = false;
  function alScroll() {
    if (marcado) return;
    marcado = true;
    requestAnimationFrame(function () {
      top.classList.toggle('solido', window.scrollY > 40);
      marcado = false;
    });
  }
  window.addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  /* Menú del celular */
  var boton = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  function cerrarMenu() {
    top.classList.remove('abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir menú');
  }
  boton.addEventListener('click', function () {
    var abierto = top.classList.toggle('abierto');
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) cerrarMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrarMenu();
  });

  /* Carruseles de fondo (portada y "El lugar"): una foto a pantalla completa por vez, con fundido.
     La primera foto viene en el HTML; las demás se agregan acá, según sea PC o celular.
     Avanza solo cada "ms" milisegundos y, si la sección tiene flechas, también a mano. */
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function carrusel(seccion, ms) {
    var fondo = seccion ? seccion.querySelector('[data-pc]') : null;
    if (!fondo) return;
    var fotos = [fondo.querySelector('img')];
    var actual = 0, visible = false, cargado = false, reloj = null;
    function cargar() {
      if (cargado) return;
      cargado = true;
      var movil = window.matchMedia('(max-width:900px)').matches;
      (fondo.getAttribute(movil ? 'data-movil' : 'data-pc') || '').split(',').forEach(function (n) {
        if (!n) return;
        var img = new Image();
        img.alt = '';
        img.decoding = 'async';
        img.src = 'assets/img/' + n + '.webp';
        fondo.appendChild(img);
        fotos.push(img);
      });
    }
    function ir(dir) {
      if (fotos.length < 2) return;
      var sig = (actual + dir + fotos.length) % fotos.length;
      if (!fotos[sig].complete) return;
      fotos[actual].classList.remove('activa');
      fotos[sig].classList.add('activa');
      actual = sig;
    }
    function marcha() {
      clearInterval(reloj);
      if (quieto) return;
      reloj = setInterval(function () {
        if (visible && !document.hidden) ir(1);
      }, ms);
    }
    seccion.querySelectorAll('[data-carrusel]').forEach(function (b) {
      b.addEventListener('click', function () {
        cargar();
        ir(Number(b.getAttribute('data-carrusel')));
        marcha();
      });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible && !quieto) cargar();
      }, { rootMargin: '300px 0px' }).observe(seccion);
    } else {
      visible = true;
    }
    marcha();
  }
  window.addEventListener('load', function () {
    carrusel(document.getElementById('inicio'), 5500);
    carrusel(document.getElementById('lugar'), 6000);
  });

  /* Cinta de platos: se duplican las fotos para que la vuelta no tenga corte; el movimiento lo hace el CSS.
     Se pausa cuando la sección no está en pantalla. */
  document.querySelectorAll('.tira').forEach(function (tira) {
    var pista = tira.querySelector('.tira-pista');
    if (!pista || quieto) return;
    Array.prototype.slice.call(pista.children).forEach(function (fig) {
      var copia = fig.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      pista.appendChild(copia);
    });
    tira.classList.add('corre', 'pausa');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        tira.classList.toggle('pausa', !e[0].isIntersecting);
      }).observe(tira);
    } else {
      tira.classList.remove('pausa');
    }
  });

  /* Retrato vivo: el video se carga recién cuando se acerca a la pantalla y se pausa cuando sale */
  var retrato = document.querySelector('video.cita-retrato');
  if (retrato && !quieto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) {
        var fuentes = retrato.querySelectorAll('source[data-src]');
        if (fuentes.length) {
          fuentes.forEach(function (f) {
            f.src = f.getAttribute('data-src');
            f.removeAttribute('data-src');
          });
          retrato.load();
        }
        var p = retrato.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        retrato.pause();
      }
    }, { rootMargin: '200px 0px' }).observe(retrato);
  }

  /* Aparición al hacer scroll */
  var revs = document.querySelectorAll('.rev');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      var n = 0;
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          /* las piezas que entran juntas se escalonan: 120 ms entre una y otra */
          en.target.style.setProperty('--ret', (n * 120) + 'ms');
          n++;
          en.target.classList.add('visto');
          obs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revs.forEach(function (el) { obs.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add('visto'); });
  }

  /* Avisos de demo: los botones que en el sitio real abren WhatsApp o un formulario */
  var aviso = document.querySelector('.aviso');
  var reloj;
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-demo]');
    if (!el) return;
    e.preventDefault();
    aviso.textContent = el.getAttribute('data-demo');
    aviso.hidden = false;
    requestAnimationFrame(function () { aviso.classList.add('ver'); });
    clearTimeout(reloj);
    reloj = setTimeout(function () {
      aviso.classList.remove('ver');
      setTimeout(function () { aviso.hidden = true; }, 320);
    }, 4200);
  });
})();

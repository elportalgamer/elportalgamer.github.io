(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-menu');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) {
      menu.setAttribute('aria-expanded','false');
      nav.classList.remove('is-open');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      menu.setAttribute('aria-expanded','false');
      menu.focus();
    }
  });
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const search = document.querySelector('#buscador');
  if (document.querySelector('#mini-grid') && search) {
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const status = document.createElement('p');
    status.className = 'search-status';
    status.setAttribute('role','status');
    status.hidden = true;
    search.closest('header').after(status);
    search.addEventListener('input', () => {
      const query = normalize(search.value.trim());
      let count = 0;
      document.querySelectorAll('.filterable').forEach(card => {
        const match = !query || normalize(card.textContent).includes(query);
        card.style.display = match ? '' : 'none';
        if (match) count++;
      });
      status.hidden = !query;
      status.textContent = count ? `${count} resultados para «${search.value.trim()}» en las reseñas y noticias.` : `No encontramos «${search.value.trim()}». Probá con otro juego.`;
    });
  }
})();

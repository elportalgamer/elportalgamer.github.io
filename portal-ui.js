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


/* Random video bubbles live in the desktop margins, away from the reading column. */
(() => {
  if (!document.querySelector('.editorial-hero')) return;
  const media=matchMedia('(min-width:1500px)');
  let mounted=false;
  function mount(items){
    if(mounted||!media.matches||!Array.isArray(items))return;
    const pool=[...new Map(items.filter(v=>v.id&&v.title).map(v=>[v.id,v])).values()];
    if(pool.length<2)return;
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    mounted=true;
    const layer=document.createElement('aside');layer.className='review-orbits';layer.setAttribute('aria-label','Descubrí una reseña al azar');
    for(let side=0;side<2;side++){
      const rail=document.createElement('div');rail.className='review-orbit '+(side?'orbit-right':'orbit-left');
      pool.slice(side*3,side*3+3).forEach((video,i)=>{
        const link=document.createElement('a');link.className='review-bubble';link.href='https://www.youtube.com/watch?v='+encodeURIComponent(video.id);link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Ver reseña: '+video.title);link.style.setProperty('--delay',(-8-i*17-side*5)+'s');link.style.setProperty('--slot',i);
        const image=document.createElement('img');image.src='https://i.ytimg.com/vi/'+encodeURIComponent(video.id)+'/mqdefault.jpg';image.alt='';image.width=160;image.height=90;image.decoding='async';
        const caption=document.createElement('span');caption.className='bubble-caption';caption.textContent=video.title;
        const play=document.createElement('span');play.className='bubble-play';play.textContent='▶';play.setAttribute('aria-hidden','true');
        link.append(image,play,caption);rail.append(link);
      });
      layer.append(rail);
    }
    document.body.append(layer);
    const toggle=document.createElement('button');toggle.className='orbit-toggle';toggle.type='button';toggle.setAttribute('aria-pressed','false');toggle.textContent='Pausar burbujas';
    toggle.onclick=()=>{const paused=layer.classList.toggle('is-paused');toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'Animar burbujas':'Pausar burbujas';};
    layer.append(toggle);
    document.addEventListener('visibilitychange',()=>layer.classList.toggle('tab-hidden',document.hidden));
  }
  let available=[];
  window.addEventListener('portal:reviews',event=>{available=event.detail;mount(available);});
  media.addEventListener('change',()=>mount(available));
  setTimeout(async()=>{if(mounted||!media.matches)return;try{const data=await fetch('reviews-snapshot.json').then(r=>r.json());available=(data.items||[]).map(v=>({id:v.snippet?.resourceId?.videoId,title:v.snippet?.title}));mount(available);}catch{}},7000);
})();

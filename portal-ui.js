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


/* Random review bubbles: combine the archive and live feed, rotate without recent repeats. */
(() => {
  if(!document.querySelector('.editorial-hero'))return;
  const media=matchMedia('(min-width:1500px)'),pool=new Map(),active=new Set();
  let layer=null,recent=[],archiveReady=false;
  try{recent=JSON.parse(localStorage.getItem('portal-bubble-history')||'[]');if(!Array.isArray(recent))recent=[];}catch{}
  function pick(){
    let candidates=[...pool.values()].filter(v=>!active.has(v.id));
    const fresh=candidates.filter(v=>!recent.includes(v.id));
    if(fresh.length)candidates=fresh;
    if(!candidates.length)return null;
    const video=candidates[Math.floor(Math.random()*candidates.length)];
    recent=[...recent.filter(id=>id!==video.id),video.id].slice(-Math.min(18,Math.max(0,pool.size-6)));
    try{localStorage.setItem('portal-bubble-history',JSON.stringify(recent));}catch{}
    return video;
  }
  function paint(link){
    const previous=link.dataset.videoId;
    const video=pick();if(!video)return;
    if(previous)active.delete(previous);
    active.add(video.id);link.dataset.videoId=video.id;
    link.href='https://www.youtube.com/watch?v='+encodeURIComponent(video.id);
    link.setAttribute('aria-label','Ver reseña: '+video.title);
    link.querySelector('img').src='https://i.ytimg.com/vi/'+encodeURIComponent(video.id)+'/mqdefault.jpg';
    link.querySelector('.bubble-caption').textContent=video.title;
  }
  function merge(items){
    if(!Array.isArray(items))return;
    for(const v of items)if(v.id&&v.title&&!/^(private|deleted) video$/i.test(v.title))pool.set(v.id,v);
    if(layer)layer.dataset.poolSize=String(pool.size);
    mount();
  }
  function mount(){
    if(layer||!archiveReady||!media.matches||pool.size<6)return;
    layer=document.createElement('aside');layer.className='review-orbits';layer.dataset.poolSize=String(pool.size);layer.setAttribute('aria-label','Descubrí una reseña al azar');
    for(let side=0;side<2;side++){
      const rail=document.createElement('div');rail.className='review-orbit '+(side?'orbit-right':'orbit-left');
      for(let i=0;i<3;i++){
        const link=document.createElement('a');link.className='review-bubble';link.target='_blank';link.rel='noopener noreferrer';
        const duration=46+Math.random()*24;
        link.style.setProperty('--duration',duration+'s');link.style.setProperty('--delay',(-duration*(i+Math.random())/3)+'s');
        link.style.setProperty('--x',([18,79,46][(i+side)%3]+Math.random()*16-8)+'%');link.style.setProperty('--size',(72+Math.random()*20)+'px');link.style.setProperty('--drift',(Math.random()*10-5)+'px');link.style.setProperty('--slot',i);
        const image=document.createElement('img');image.alt='';image.width=160;image.height=90;image.decoding='async';
        const play=document.createElement('span');play.className='bubble-play';play.textContent='▶';play.setAttribute('aria-hidden','true');
        const caption=document.createElement('span');caption.className='bubble-caption';link.append(image,play,caption);paint(link);
        link.addEventListener('animationiteration',()=>paint(link));rail.append(link);
      }
      layer.append(rail);
    }
    const toggle=document.createElement('button');toggle.className='orbit-toggle';toggle.type='button';toggle.setAttribute('aria-pressed','false');toggle.textContent='Pausar burbujas';
    toggle.onclick=()=>{const paused=layer.classList.toggle('is-paused');toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'Animar burbujas':'Pausar burbujas';};
    layer.append(toggle);document.body.append(layer);
    document.addEventListener('visibilitychange',()=>layer.classList.toggle('tab-hidden',document.hidden));
  }
  window.addEventListener('portal:reviews',event=>merge(event.detail));media.addEventListener('change',mount);
  fetch('reviews-snapshot.json',{signal:AbortSignal.timeout(6000)}).then(r=>{if(!r.ok)throw Error('Archive unavailable');return r.json();}).then(data=>{archiveReady=true;merge((data.items||[]).map(v=>({id:v.snippet?.resourceId?.videoId,title:v.snippet?.title})));}).catch(()=>{archiveReady=true;mount();});
})();

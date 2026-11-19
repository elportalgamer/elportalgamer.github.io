(() => {
  'use strict';
  const grid=document.getElementById('news-grid');if(!grid)return;
  const archive=document.body.hasAttribute('data-news-archive');
  const params=new URL(location.href).searchParams;
  const articleId=archive?params.get('id'):null;
  const state={page:1,query:'',month:'',api:'',seed:[],totalPages:1,request:0};
  const labels={lanzamientos:'Lanzamientos',actualizaciones:'Actualizaciones',industria:'Industria',retro:'Retro',hardware:'Hardware',juegos:'Videojuegos'};
  const $=id=>document.getElementById(id);
  const dateFormat=new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',year:'numeric',timeZone:'America/Lima'});
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function safeURL(value,base=location.href){try{const url=new URL(value,base);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}}
  function expiresAt(item){if(item.expiresAt)return Date.parse(item.expiresAt);const d=new Date(item.publishedAt||item.date);const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+6);d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));return d.getTime();}
  function current(item){const time=Date.parse(item.publishedAt||item.date);return item.id&&item.title&&time<=Date.now()&&expiresAt(item)>Date.now();}
  function element(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;}
  async function json(url){const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('News unavailable');return r.json();}
  function imageURL(story){return story.image?safeURL(story.image):state.api?state.api+'/image/'+encodeURIComponent(story.id):null;}
  function image(story,cls){const box=element('div',cls);const url=imageURL(story);if(url){const img=element('img');img.src=url;img.alt=story.imageAlt||('Collage dadaísta: '+story.title);img.loading='lazy';img.width=800;img.height=800;img.addEventListener('error',()=>{img.remove();box.classList.add('news-image-fallback');box.append(element('span','','El Portal Gamer'));},{once:true});box.append(img);}else{box.classList.add('news-image-fallback');box.append(element('span','','El Portal Gamer'));}return box;}
  function storyURL(story){const url=new URL('news.html',location.href);url.searchParams.set('id',story.id);return url.href;}
  async function share(story,button){const url=storyURL(story);try{if(navigator.share)await navigator.share({title:story.title,url});else{await navigator.clipboard.writeText(url);button.textContent='Enlace copiado';}}catch(error){if(error.name!=='AbortError'){button.textContent='Copiá la dirección de esta noticia';}}}
  function card(story){
    const article=element('article','n-card filterable');article.dataset.title=story.title;article.dataset.desc=story.summary||'';
    const photoLink=element('a','news-image-link');photoLink.href=storyURL(story);photoLink.setAttribute('aria-label','Leer: '+story.title);photoLink.append(image(story,'news-thumb'));
    const content=element('div','n-content'),meta=element('div','news-meta');
    meta.append(element('span','badge',labels[story.category]||'Noticias'));
    const date=element('time','',dateFormat.format(new Date(story.publishedAt||story.date)));date.dateTime=story.publishedAt||story.date;meta.append(date);
    const title=element('h3','title'),link=element('a','',story.title);link.href=storyURL(story);title.append(link);
    const actions=element('div','n-actions'),read=element('a','btn brand','Leer noticia');read.href=storyURL(story);
    actions.append(read);content.append(meta,title,element('p','desc',(story.summary||story.body||'').slice(0,210)+'…'),actions);article.append(photoLink,content);return article;
  }
  function fallback(){const list=state.seed.filter(current).filter(x=>(!state.month||(x.publishedAt||x.date).startsWith(state.month))&&(!state.query||normalize(x.title+' '+x.summary).includes(normalize(state.query))));const size=archive?9:3;const pages=Math.max(1,Math.ceil(list.length/size));state.page=Math.min(state.page,pages);return {items:list.slice((state.page-1)*size,state.page*size),total:list.length,page:state.page,totalPages:pages,months:[...new Set(state.seed.filter(current).map(x=>(x.publishedAt||x.date).slice(0,7)))]};}
  function render(data){
    const items=(data.items||[]).filter(current);grid.replaceChildren();
    if(!items.length)grid.append(element('p','news-empty',state.query||state.month?'No hay noticias con esos filtros.':'Estamos preparando las próximas noticias del portal.'));
    else items.forEach(story=>grid.append(card(story)));
    if(archive){state.totalPages=data.totalPages||1;state.page=data.page||1;$('news-count').textContent=(data.total||0)+((data.total||0)===1?' noticia':' noticias');$('pageInfo').textContent='Página '+state.page+' de '+state.totalPages;$('prev').disabled=state.page<=1;$('next').disabled=state.page>=state.totalPages;
      const selected=$('news-month').value;const monthSelect=$('news-month');monthSelect.replaceChildren(new Option('Todos los meses',''));
      (data.months||[]).forEach(month=>{const [year,m]=month.split('-');const label=new Date(Number(year),Number(m)-1,1).toLocaleDateString('es',{month:'long',year:'numeric'});monthSelect.add(new Option(label,month));});monthSelect.value=selected;
    }
  }
  async function load(){const request=++state.request;render(fallback());if(!state.api)return;try{const url=new URL(state.api+'/news');url.searchParams.set('limit',archive?'9':'3');url.searchParams.set('page',state.page);if(state.query)url.searchParams.set('q',state.query);if(state.month)url.searchParams.set('month',state.month);const data=await json(url);if(request===state.request&&((data.items||[]).length||!state.seed.filter(current).length))render(data);}catch{}}
  function renderArticle(story){
    $('list-view').hidden=true;$('article-view').hidden=false;$('archive-heading').hidden=true;
    $('a-title').textContent=story.title;document.title=story.title+' — El Portal Gamer';
    const meta=$('a-meta');meta.replaceChildren(element('span','badge',labels[story.category]||'Noticias'),element('time','',dateFormat.format(new Date(story.publishedAt||story.date))));
    $('article-hero').replaceChildren(image(story,'article-square-image'));
    const body=$('a-body');body.replaceChildren();String(story.body||story.summary||'').split(/\n\s*\n/).filter(Boolean).forEach(text=>body.append(element('p','',text)));
    $('image-credit').textContent=story.imageKind==='illustration'?'Ilustración del portal inspirada en el juego.':'';
    $('share-article').onclick=()=>share(story,$('share-article'));
  }
  async function article(){let story=state.seed.find(x=>x.id===articleId&&current(x));if(story)renderArticle(story);if(state.api)try{const data=await json(state.api+'/article/'+encodeURIComponent(articleId));if(current(data))story=data;}catch{}if(story){renderArticle(story);return;}$('list-view').hidden=true;$('article-view').hidden=false;$('a-title').textContent='Esta noticia ya no está en el archivo';$('a-body').textContent='El archivo conserva las publicaciones de los últimos seis meses. Podés consultar las noticias vigentes desde el botón de abajo.';$('share-article').hidden=true;}
  async function init(){
    const results=await Promise.allSettled([json('news-config.json?v=20261119c'),json('news.json?v=20261119c')]);
    if(results[0].status==='fulfilled'){const api=results[0].value.apiBase;state.api=api?safeURL(api)?.replace(/\/$/,'')||'':'';}
    if(results[1].status==='fulfilled'){const data=results[1].value;state.seed=(Array.isArray(data)?data:data.items||[]).filter(current);}
    if(articleId){await article();return;}load();
    if(archive){let timer;$('q').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{state.query=$('q').value.trim();state.page=1;load();},250);});$('news-month').addEventListener('change',()=>{state.month=$('news-month').value;state.page=1;load();});$('prev').onclick=()=>{if(state.page>1){state.page--;load();}};$('next').onclick=()=>{if(state.page<state.totalPages){state.page++;load();}};}
  }
  init().catch(()=>render({items:[],total:0,totalPages:1,page:1}));
})();

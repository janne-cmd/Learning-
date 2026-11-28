/* offline cache: the app is cached at install; recordings are cached the first time they are played */
const V='aprende-2c18ffb307';
const CORE=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='aprende-audio').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(u.pathname.includes('/audio/')){
  /* every pack name contains a hash of its content, so a cached pack is always the right one: cache first */
  const rg=r.headers.get('range');
  if(rg){/* one clip: cut it out of a pack saved for offline use, else ask the network */
   e.respondWith(caches.open('aprende-audio').then(c=>c.match(u.href).then(hit=>{if(!hit)return fetch(r);return hit.arrayBuffer().then(buf=>{const m=/bytes=([0-9]+)-([0-9]+)/.exec(rg);const a=+m[1],b=Math.min(+m[2],buf.byteLength-1);
    return new Response(buf.slice(a,b+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Range':'bytes '+a+'-'+b+'/'+buf.byteLength,'Content-Length':String(b-a+1)}});});})));return;}
  e.respondWith(caches.open('aprende-audio').then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok&&res.status===200)c.put(r,res.clone());return res;}))));return;}
 if(r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html')){
  /* the app: newest version when online, the saved one when offline */
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put('index.html',cp));return res;}).catch(()=>caches.match('index.html')));return;}
 e.respondWith(caches.match(r).then(hit=>hit||fetch(r)));
});

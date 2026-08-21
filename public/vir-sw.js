const CACHE='kleo-vir-shell-v1';
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/vir-manifest.webmanifest'])));});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('/'))));});

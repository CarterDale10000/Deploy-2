const CACHE_NAME = 'game-cache-v1';

const injectedCSS = `
<style>
    a[href*="netlify.com"], 
    #netlify-logo, 
    .netlify-badge {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }
</style>
`;

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then(async (networkResponse) => {
                const cache = await caches.open(CACHE_NAME);
                
                if (networkResponse.headers.get('content-type')?.includes('text/html')) {
                    let html = await networkResponse.clone().text();
                    
                    if (html.includes('</head>')) {
                        html = html.replace('</head>', injectedCSS + '</head>');
                    } else {
                        html += injectedCSS;
                    }
                    
                    const modifiedResponse = new Response(html, {
                        status: networkResponse.status,
                        statusText: networkResponse.statusText,
                        headers: networkResponse.headers
                    });
                    
                    cache.put(event.request, modifiedResponse.clone());
                    return modifiedResponse;
                }

                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            }).catch(() => cachedResponse); 

            if (cachedResponse) {
                return cachedResponse; 
            }
            return fetchPromise;
        })
    );
});

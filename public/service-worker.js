// The pre-Vite build registered a Workbox service worker at this URL that
// precached the app shell. This replacement takes over that registration,
// deletes the old caches, unregisters itself, and reloads open clients so
// they load the current app from the network. IndexedDB (wallet data) is
// intentionally untouched.
self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil((async() => {
		// only remove the old Workbox caches in case the origin hosts more
		// than this app
		const keys = await caches.keys();
		await Promise.all(keys.filter(key => key.startsWith('workbox-')).map(key => caches.delete(key)));

		await self.registration.unregister();

		const clients = await self.clients.matchAll({ type: 'window' });
		await Promise.all(clients.map(client => client.navigate(client.url)));
	})());
});

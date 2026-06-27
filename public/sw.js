/* public/sw.js - Nexus service worker (push notifications) */

// Receive a push from the notify-push Edge Function and show it.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Nexus", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "New course material";
  const options = {
    body: data.body || "Tap to open Nexus.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    // Unique tag per notification (its row id) so multiple alerts for the SAME
    // course STACK instead of overwriting each other. Without this, a new
    // COS 101 push would replace an earlier unseen COS 101 push.
    tag: data.id || `nexus-${Date.now()}-${Math.random()}`,
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Focus an existing tab (or open one) and navigate to the course on tap.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        for (const win of wins) {
          if ("focus" in win) {
            win.focus();
            if ("navigate" in win) win.navigate(target).catch(() => {});
            return;
          }
        }
        return clients.openWindow(target);
      })
  );
});

// Activate immediately on update.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));

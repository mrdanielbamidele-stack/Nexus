# Notification system - setup

Two layers:

1. **In-app bell** (universal) - a `notifications` table + Supabase Realtime. Works
   on every device with no permissions and no install. Already wired in the app.
2. **Background OS push** (optional) - a service worker + the `notify-push` Edge
   Function. Reaches devices when Nexus is closed. iPhones must install the app to
   the Home Screen first (Apple requirement).

You only *need* step A for the bell to work. Steps B–D add background push.

---

## A. Database (required)

In the Supabase dashboard → **SQL Editor**, paste and run
[`notifications.sql`](./notifications.sql). This creates the `notifications` and
`push_subscriptions` tables, RLS policies, and the triggers that fire when a
material is published or a library resource is added.

That's it - the in-app bell works now.

---

## B. Generate VAPID keys (for background push)

```bash
npx web-push generate-vapid-keys
```

Copy the **public** key into `.env`:

```
VITE_VAPID_PUBLIC_KEY=<public key>
```

Rebuild/redeploy the frontend so the key ships. Keep the **private** key for step D.

---

## C. Deploy the Edge Function

```bash
supabase functions deploy notify-push --no-verify-jwt
```

(`--no-verify-jwt` lets the Database Webhook call it.)

Set its secrets:

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY=<public key> \
  VAPID_PRIVATE_KEY=<private key> \
  VAPID_SUBJECT=mailto:admin@topfaith.edu \
  SERVICE_ROLE_KEY=<project service-role key>
```

> `SUPABASE_URL` is injected automatically - don't set it.

---

## D. Wire the webhook

Dashboard → **Database → Webhooks → Create a new hook**:

- **Table:** `public.notifications`
- **Events:** `Insert`
- **Type:** Supabase Edge Function → `notify-push`

Now every new notification row fans out as a push to every subscribed device
taking that course.

---

## Test it

1. Open the student app on a phone and a laptop, signed in to a student taking
   `PHY 101` (or any course).
2. As a lecturer, upload a material to that course and **publish** it (or add a
   library resource).
3. The bell badge updates live on both devices. If background push is set up and
   enabled in **Settings → Notifications**, you also get an OS notification.

## Notes / limits

- Students aren't in the DB, so "unread" is tracked per-device in `localStorage`.
  A reinstall/clear resets the badge - by design.
- iPhone background push requires **Add to Home Screen** first (the app guides the
  user through this in Settings → Notifications).
- A device only gets pushed for courses in its localStorage list at the time it
  enabled push; the list re-syncs automatically whenever the student adds/removes
  a course.

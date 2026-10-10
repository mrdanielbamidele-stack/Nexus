// "New past questions" - a row in the notification bell plus a background push
// to every device whose owner takes that course.

import webpush from 'web-push'
import { Notification, PushSub } from '../models.js'
import { env } from './env.js'
import { titleOf, yearKeyOf } from './courses.js'

function vapid() {
  const publicKey = env('VITE_VAPID_PUBLIC_KEY') || env('VAPID_PUBLIC_KEY')
  const privateKey = env('VAPID_PRIVATE_KEY')
  const subject = env('VAPID_SUBJECT') || env('APP_URL')
  if (!publicKey || !privateKey || !subject) return null
  return { publicKey, privateKey, subject: subject.startsWith('http') || subject.startsWith('mailto:') ? subject : `mailto:${subject}` }
}

async function pushToCourse(courseKey, payload) {
  const keys = vapid()
  if (!keys) return 0

  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey)
  const subs = await PushSub.find({ courseKeys: courseKey })
  const body = JSON.stringify(payload)

  const results = await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 24 * 60 * 60 }
        )
      } catch (err) {
        // The device is gone (app uninstalled, permission revoked): forget it.
        if (err.statusCode === 404 || err.statusCode === 410) await PushSub.deleteOne({ _id: sub._id })
        else throw err
      }
    })
  )
  return results.filter(r => r.status === 'fulfilled').length
}

export async function announcePaper(paper) {
  const title = titleOf(paper)
  const url = `/pastquestions/${paper.courseKey}/${yearKeyOf(paper)}`

  const note = await Notification.create({
    courseId: paper.courseCode,
    kind: 'material',
    body: `New past questions added: ${title}`,
    url,
  })

  try {
    await pushToCourse(paper.courseKey, {
      id: String(note._id),
      title: paper.courseCode,
      body: `New past questions added: ${title}`,
      url,
    })
  } catch (err) {
    // The bell still has it; a failed push must never fail an approval.
    console.error('[push] announce failed:', err.message)
  }
}

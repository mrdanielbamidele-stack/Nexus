// "Continue with Google", done on the server so the client secret never reaches
// the browser. Nothing from Google is trusted until it has been checked here:
// the token's signature/audience, a verified email, and the school domain.

import { OAuth2Client } from 'google-auth-library'
import { checkSchoolEmail, SCHOOL_DOMAIN } from '../../src/lib/schoolEmail.js'
import { need } from './env.js'
import { fail } from './errors.js'
import { siteOrigin } from './session.js'

export const redirectUri = req => `${siteOrigin(req)}/api/auth/google/callback`

function client(req) {
  return new OAuth2Client(
    need('GOOGLE_CLIENT_ID', 'Continue with Google'),
    need('GOOGLE_CLIENT_SECRET', 'Continue with Google'),
    redirectUri(req)
  )
}

export function authUrl(req, { state, loginHint }) {
  return client(req).generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    // `hd` only pre-selects the school accounts in Google's picker. It is a
    // hint, not a security control - identity() below is the real check.
    hd: SCHOOL_DOMAIN,
    prompt: 'select_account',
    login_hint: loginHint || undefined,
  })
}

// Swap the one-time code for who the person is. Throws a friendly error when
// the account isn't a verified @topfaith.edu.ng one.
export async function identity(req, code) {
  const oauth = client(req)

  let payload
  try {
    const { tokens } = await oauth.getToken(code)
    const ticket = await oauth.verifyIdToken({
      idToken: tokens.id_token,
      audience: need('GOOGLE_CLIENT_ID', 'Continue with Google'),
    })
    payload = ticket.getPayload()
  } catch (err) {
    if (err?.code === 'NOT_CONFIGURED') throw err
    console.error('[google] token exchange failed:', err?.message)
    throw fail(
      400,
      'GOOGLE_FAILED',
      'Google didn\'t complete the sign-in. Please go back and tap "Continue with Google" again.'
    )
  }

  const checked = checkSchoolEmail(payload?.email)
  const fromSchool = checked.ok && payload.email_verified === true && payload.hd === SCHOOL_DOMAIN

  if (!fromSchool) {
    throw fail(
      403,
      'NOT_SCHOOL_GOOGLE',
      `You signed in with ${payload?.email || 'a Google account'}, which isn't a @${SCHOOL_DOMAIN} account. ` +
        'Tap "Continue with Google" again and choose your school account.'
    )
  }

  return { email: checked.email, kind: checked.kind, name: payload.name || '' }
}

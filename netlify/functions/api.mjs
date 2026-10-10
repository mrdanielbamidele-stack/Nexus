// Netlify Function: the whole Nexus API behind /api/*  (see public/_redirects).
import serverless from 'serverless-http'
import { createApp } from '../../server/app.js'

export const handler = serverless(createApp())

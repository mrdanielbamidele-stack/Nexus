// All collections in one place. Database: tos_portal.

import mongoose from 'mongoose'

const { Schema } = mongoose
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema)

/* --------------------------------- users ---------------------------------- */
// A person can hold a student account AND an admin account on the same email:
// they are two separate documents (and two separate passwords).

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['student', 'admin'], required: true },
    username: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    // 'unverified' until they have continued with Google once.
    status: { type: String, enum: ['unverified', 'verified'], default: 'unverified' },
    verifiedAt: Date,

    // student
    regNumber: String,
    programme: String,
    level: String,
    courses: [String], // every course they take - all of them removable

    // admin
    faculty: String,
    department: String,

    lastLoginAt: Date,
    lastSeenAt: Date,
  },
  { timestamps: true }
)
userSchema.index({ email: 1, role: 1 }, { unique: true })
export const User = model('User', userSchema)

/* --------------------------------- papers --------------------------------- */
// One document = one submission for a course + session (a "version").

const fileSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    resourceType: String,
    format: String,
    bytes: Number,
    name: String,
    kind: { type: String, enum: ['page', 'document'], default: 'document' },
    page: Number,
  },
  { _id: false }
)

const paperSchema = new Schema(
  {
    courseCode: { type: String, required: true }, // "PHY 101"
    courseKey: { type: String, required: true, index: true }, // "phy101"
    session: { type: String, required: true }, // "2023/2024"
    version: { type: Number, default: 1 }, // 1 = original, 2 = "v2" ...
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    files: [fileSchema],

    source: { type: String, enum: ['seed', 'student', 'admin', 'dele'], default: 'student' },
    // null user = nobody was signed in when it was sent.
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    uploaderRole: { type: String, default: null },
    uploaderName: { type: String, default: null },
    uploaderEmail: { type: String, default: null },

    reviewedAt: Date,
  },
  { timestamps: true }
)
paperSchema.index({ courseKey: 1, session: 1, version: 1 })
export const Paper = model('Paper', paperSchema)

/* -------------------------------- analytics ------------------------------- */

const eventSchema = new Schema(
  {
    type: { type: String, required: true }, // open | read | download | link | active
    at: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, default: null },
    role: String,
    name: String,
    email: String,
    anonId: String, // device id for people who aren't signed in
    paperId: { type: Schema.Types.ObjectId, default: null },
    courseKey: String,
    title: String,
    seconds: { type: Number, default: 0 },
    label: String,
    url: String,
    path: String,
  },
  { versionKey: false }
)
eventSchema.index({ type: 1, at: -1 })
eventSchema.index({ userId: 1, at: -1 })
export const Event = model('Event', eventSchema)

/* ------------------------------ notifications ----------------------------- */

const notificationSchema = new Schema(
  {
    courseId: { type: String, required: true }, // "PHY 101"
    kind: { type: String, default: 'material' },
    body: { type: String, required: true },
    url: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)
notificationSchema.index({ createdAt: -1 })
export const Notification = model('Notification', notificationSchema)

const pushSchema = new Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    p256dh: String,
    auth: String,
    courseKeys: [String],
    userAgent: String,
  },
  { timestamps: true }
)
export const PushSub = model('PushSub', pushSchema)

/* ---------------------------------- misc ---------------------------------- */

// Counters for rate limiting; Mongo deletes them itself once they expire.
const throttleSchema = new Schema(
  {
    _id: String,
    n: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { versionKey: false }
)
export const Throttle = model('Throttle', throttleSchema)

// One-off markers (e.g. "the original papers were imported").
const metaSchema = new Schema({ _id: String, at: { type: Date, default: Date.now } }, { versionKey: false })
export const Meta = model('Meta', metaSchema)

// Who used "log in as", and when.
const auditSchema = new Schema(
  {
    action: String,
    targetId: Schema.Types.ObjectId,
    targetEmail: String,
    targetRole: String,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)
export const Audit = model('Audit', auditSchema)

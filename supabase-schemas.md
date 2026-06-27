# Supabase Schemas -Topfaith Nexus

**Project URL:** `https://btxxmqskxvdnmfqtlwvb.supabase.co`

---

## Tables

### `public.profiles`
Extends `auth.users`. Auto-created by the `handle_new_user` trigger on sign-up.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK · references `auth.users(id)` on delete cascade |
| `full_name` | `text` | NOT NULL |
| `title` | `text` | Default `'Dr.'` -e.g. `"Dr."`, `"Prof."`, `"Mr."` |
| `role` | `text` | Default `'lecturer'` · check: `lecturer`, `admin`, or `library` |
| `avatar_url` | `text` | Optional profile picture URL |
| `created_at` | `timestamptz` | Default `now()` |

**RLS policies:**
- `Profiles: read own` -SELECT where `auth.uid() = id`
- `Profiles: insert own` -INSERT where `auth.uid() = id`
- `Profiles: update own` -UPDATE where `auth.uid() = id`

---

### `public.courses`
Course catalogue. The `code` column is the primary key (no UUID id).

| Column | Type | Notes |
|---|---|---|
| `code` | `text` | **PK** -e.g. `"PHY101"` |
| `title` | `text` | NOT NULL -e.g. `"Introduction to Physics"` |
| `lecturer_id` | `uuid` | FK → `profiles(id)` on delete cascade · NOT NULL |
| `description` | `text` | Optional course description |
| `created_at` | `timestamptz` | Default `now()` |

**RLS policies:**
- `Courses: lecturer owns` -ALL operations where `lecturer_id = auth.uid()`
- `Courses: public can read` -SELECT for everyone (needed by students to look up course by code)

---

### `public.course_sections`
Groups materials within a course (outline, modules, textbooks).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK · `gen_random_uuid()` |
| `course_id` | `text` | FK → `courses(code)` on delete cascade |
| `type` | `text` | check: `outline`, `module`, or `textbook` |
| `title` | `text` | NOT NULL -e.g. `"Week 1 – Kinematics"` |
| `sort_order` | `integer` | Default `0` |
| `created_at` | `timestamptz` | Default `now()` |

**RLS policies:**
- `Sections: via course owner` -ALL where `courses.code = course_id AND courses.lecturer_id = auth.uid()`
- `Sections: public can read` -SELECT for everyone

---

### `public.course_materials`
Files uploaded by lecturers and optionally published to students.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK · `gen_random_uuid()` |
| `section_id` | `uuid` | FK → `course_sections(id)` on delete cascade · nullable |
| `course_id` | `text` | FK → `courses(code)` on delete cascade · NOT NULL |
| `type` | `text` | check: `outline`, `module`, or `textbook` |
| `file_name` | `text` | NOT NULL -original uploaded filename |
| `file_url` | `text` | NOT NULL -Supabase Storage public URL |
| `file_type` | `text` | Default `'document'` · check: `document`, `video`, or `pdf` |
| `module_numbering` | `text` | Display label -auto-parsed from filename on upload, editable by lecturer. Used as the download filename (e.g. `"Module 1 Part 1"`) |
| `is_published` | `boolean` | Default `false` -only published materials are visible to students |
| `clone_key` | `text` | Auto-generated slug: `lesson/{id}@{type}@{file-name}` |
| `download_url` | `text` | Kept for backwards compat -not used directly for downloads |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

**RLS policies:**
- `Materials: via course owner` -ALL where `courses.code = course_id AND courses.lecturer_id = auth.uid()`
- `Materials: public can read published` -SELECT where `is_published = true`

---

### `public.library_resources`
School-wide materials uploaded by **library staff** (`role = 'library'`) and tied to a course. Visible to students on the course page. Only library staff and admins can manage them -lecturers have **no access** to the library portal.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK · `gen_random_uuid()` |
| `course_id` | `text` | FK → `courses(code)` on delete cascade · NOT NULL -resource surfaces on this course's page |
| `title` | `text` | NOT NULL -display label shown to students |
| `file_name` | `text` | NOT NULL -original uploaded filename |
| `file_url` | `text` | NOT NULL -Supabase Storage public URL (`library-resources` bucket) |
| `file_type` | `text` | Default `'document'` · check: `document`, `video`, or `pdf` |
| `category` | `text` | Optional grouping label -e.g. `"Textbook"`, `"Reference"`, `"Journal"` |
| `uploaded_by` | `uuid` | FK → `profiles(id)` on delete set null -the library staff member who uploaded it |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

**RLS policies:**
- `Library: public can read` -SELECT for everyone (students view on the course page)
- `Library: staff can insert` -INSERT where uploader's `profiles.role IN ('library','admin')`
- `Library: staff can update` -UPDATE where `profiles.role IN ('library','admin')`
- `Library: staff can delete` -DELETE where `profiles.role IN ('library','admin')`

> Note: all writes (insert/update/delete) are restricted to `library`/`admin`. Lecturers have no access -they are blocked at the `/library` route and by RLS.

---

## Storage Buckets

| Bucket | Public |
|---|---|
| `course-materials` | ✅ Yes |
| `library-resources` | ✅ Yes |

**Storage path convention:** `{courseCode}/{type}/{timestamp}-{index}-{filename}`
Example: `PHY101/module/1700000000000-0-Module1.pdf`

**Storage RLS policies:**
- `Storage: auth users can upload` -INSERT where `bucket_id = 'course-materials'` and authenticated
- `Storage: auth users can read` -SELECT where `bucket_id = 'course-materials'` and authenticated
- `Storage: auth users can delete` -DELETE where `bucket_id = 'course-materials'` and authenticated
- `Storage: public can read published files` -SELECT where `bucket_id = 'course-materials'` (no auth required)

**Library path convention (`library-resources` bucket):** `{courseCode}/{timestamp}-{index}-{filename}`
Example: `PHY101/1700000000000-0-Atkins-Physical-Chemistry.pdf`

**Library storage RLS policies:**
- `Library storage: public can read` -SELECT where `bucket_id = 'library-resources'` (no auth required)
- `Library storage: staff can upload` -INSERT where `bucket_id = 'library-resources'` and uploader's `role IN ('library','admin')`
- `Library storage: staff can delete` -DELETE where `bucket_id = 'library-resources'` and `role IN ('library','admin')`

---

## Functions

### `handle_new_user()` (trigger)
Auto-creates a `profiles` row whenever a new user signs up via `auth.users`.
- Reads `full_name`, `title`, `role` from `raw_user_meta_data`
- Trigger: `AFTER INSERT ON auth.users`

### `publish_material(material_id uuid)`
Sets `is_published = true` on the material and generates a `clone_key` slug.
- Slug format: `lesson/{id}@{type}@{lowercased-filename}`
- Also copies `file_url` into `download_url` for reference

### `unpublish_material(material_id uuid)`
Sets `is_published = false` and clears `clone_key` and `download_url`.

---

## Entity Relationships

```
auth.users
    │
    └── profiles (1:1)
            │
            └── courses (1:many, via lecturer_id)
                    │
                    ├── course_sections (1:many, via course_id)
                    │       │
                    │       └── course_materials (1:many, via section_id -optional)
                    │
                    ├── course_materials (1:many, via course_id -direct, no section)
                    │
                    └── library_resources (1:many, via course_id -uploaded by library staff)
```

---

## How the App Uses the Schema

| Feature | Tables involved |
|---|---|
| Lecturer sign-in | `auth.users` + `profiles` |
| Admin dashboard -course list | `courses` filtered by `lecturer_id` |
| Upload file | INSERT into `course_materials` + upload to `course-materials` bucket |
| Publish / unpublish | `publish_material()` / `unpublish_material()` RPC calls |
| Student course page (`/:courseCode`) | SELECT from `courses` + `course_materials` where `is_published = true` |
| Real-time updates on course page | Supabase Realtime channel on `course_materials` |
| Library portal -sign in (`/library`) | `auth.users` + `profiles` (role `library`/`admin` only) |
| Library upload / manage / delete | INSERT/UPDATE/DELETE on `library_resources` + `library-resources` bucket (library/admin only) |
| Student course page -library section | SELECT from `library_resources` where `course_id = courseCode` |

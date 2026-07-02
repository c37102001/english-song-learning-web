# Firebase setup

This project now stores all course data in Firebase Firestore.

## Required Firebase services

1. Create a Firebase project.
2. Add a Web App and copy its config.
3. Enable Authentication → Email/Password.
4. Create the teacher/admin user in Authentication.
5. Enable Firestore Database.
6. Publish the rules in `firestore.rules`.

## Local environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then fill in:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_EMAIL=
```

`VITE_ADMIN_EMAIL` is the Firebase Authentication user email. The admin login page will not ask for this email; it only asks for the username above and the Firebase Auth password.

Restart `npm run dev` after changing `.env.local`.

## GitHub Pages

Add the same `VITE_FIREBASE_*` and `VITE_ADMIN_*` values as GitHub repository variables.

Admin page:

```text
#/admin
```

Default admin UI login:

```text
Username: admin
Password: the password of the Firebase Auth user configured by VITE_ADMIN_EMAIL
```

## Firestore data model

Collection: `courses`

Each course document contains:

- `title`: required string
- `artist`: optional string
- `level`: `初級`, `中級`, or `高級`; required before publishing
- `youtubeUrl`: YouTube video URL
- `status`: `draft` or `published`
- `srtText`: full SRT content
- `translations`: optional array of Chinese lyric translations; one item per SRT lyric line
- `words`: array of word cards; each word can include `en`, `zh`, `part`, `example`, `exampleZh`, and optional `hint`

Before publishing a course, each word must include `en`, `zh`, `part`, and `exampleZh`. The three hints are optional.

Only `published` courses are visible on the student-facing site.

The admin page supports two editing modes:

- Form editing: edit fields one by one.
- JSON editing: edit `course.json`, `srt.json`, and `words.json` separately. These three JSON blocks are saved back into the same Firestore course document.

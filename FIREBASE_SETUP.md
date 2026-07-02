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
- `level`: optional string
- `duration`: optional string
- `youtubeId`: YouTube video ID
- `status`: `draft` or `published`
- `color`: UI color
- `srtText`: full SRT content
- `words`: array of word cards

Only `published` courses are visible on the student-facing site.

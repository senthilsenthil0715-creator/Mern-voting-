# Ballot - Online Voting System (MERN)

React + Express + MongoDB + Node.js with email OTP authentication.

## Features
- Email OTP verification when registering AND a one-time code on every sign-in (two-step login)
- OTPs: 6 digits, stored only as an HMAC hash, expire after 5 minutes, max 5 attempts, 30 s resend cooldown
- Roles: voter and admin (admin account is created automatically from server/.env)
- Admin: create, edit (before the first vote) and delete elections, 2-10 candidates each, live turnout, stats
- Voters: see open / upcoming / closed elections, vote once per election (enforced by a unique DB index)
- Results are hidden from voters until the election closes; the winner is highlighted
- Rate limiting on auth routes, bcrypt password hashing, JWT sessions (7 days)
- Responsive UI

## Requirements
- Node.js 18+
- MongoDB (local `mongodb://127.0.0.1:27017` or an Atlas URI)

## Run

    # Terminal 1 - API
    cd server
    npm install
    npm run dev          # or: npm start

    # Terminal 2 - React app
    cd client
    npm install
    npm run dev

Open http://localhost:5173

## Email (OTP) setup
Edit `server/.env`:

- Development: leave `SMTP_HOST` empty. OTP codes are printed in the server terminal.
- Real email, for example Gmail (enable 2-step verification, then create an App Password):

      SMTP_HOST=smtp.gmail.com
      SMTP_PORT=587
      SMTP_SECURE=false
      SMTP_USER=you@gmail.com
      SMTP_PASS=your_16_char_app_password
      MAIL_FROM="Ballot <you@gmail.com>"

  Any SMTP provider works (Brevo, SendGrid SMTP, Mailgun, Outlook).
  For port 465 set `SMTP_SECURE=true`.

## Default admin
Created on first start from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`
(default admin@example.com / Admin@12345). Change both. Admin sign-in also uses an email OTP,
so set `ADMIN_EMAIL` to an address you can read (or use the terminal OTP in development).

## Try it
1. Sign in as admin -> New election (set it to open now) -> publish.
2. In a private window register a voter, enter the OTP, and cast a vote.
3. When the election closes, voters see the results; the admin sees live totals at any time.

## API
    POST /api/auth/register | verify-register | login | verify-login | resend-otp
    GET  /api/elections            GET /api/elections/:id        POST /api/elections/:id/vote
    POST /api/elections (admin)    PUT/DELETE /api/elections/:id (admin)
    GET  /api/admin/stats (admin)

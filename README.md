# Apex Indoor Sports Academy — Registration Website

A simple Flask website to showcase indoor sports programs with **training days**, **batch timings**, **fee structure**, and an online **registration form** that saves submissions locally.

## Features

- 8 indoor sports (badminton, table tennis, basketball, volleyball, squash, futsal, boxing, chess)
- Per-sport schedule and fee tables
- Registration form with dynamic timing/fee dropdowns
- SQLite database for registrations
- Admin page to view recent sign-ups

## Quick start

```bash
cd sports-academy
pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5050** in your browser.

- **Admin (registrations):** http://127.0.0.1:5050/admin/registrations (shortcut: `/admin`)

## Customize your academy

1. **Sports, days, timings, fees** — Edit `data/sports.json`
2. **Academy name & contact** — Edit `templates/base.html` (logo, footer, phone, email)
3. **Branding colors** — Edit CSS variables at the top of `static/style.css`

## Production notes

- Set `app.secret_key` from an environment variable
- Consider adding authentication on `/admin/registrations`
- Use a production WSGI server (e.g. gunicorn) behind HTTPS

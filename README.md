# Central Florida Audiophile Society: Website

The CFAS club website: events calendar with RSVPs, news, the Reference Playlist listening guide, a members-only gear marketplace, member systems, a member directory, and admin tools. Data and logins are handled by [Supabase](https://supabase.com); the site itself is plain HTML, CSS and JavaScript with no build step.

**Live (demo data):** https://mrjeckyll.github.io/cfas-website/

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | Page layout and all static text (home, playlist, resources, join, sign in). |
| `css/site.css` | Colors, fonts and layout. Colors are named once at the top (`--red` is the logo red). |
| `js/config.js` | Supabase project address and publishable key. Safe to be public. |
| `js/app.js` | Sign-in, calendar, RSVPs, news, gear, systems, directory, admin. |
| `js/playlist.js` | Reference Playlist tracks and notes (the `PL` list). |
| `assets/cfas-logo.png` | Club logo. |
| `demo-static.html` | The original no-database demo, kept for reference. |
| `supabase/` | Database design, permission rules, demo data. See `supabase/README.md`. |

## Common edits

- **Home page text, Resources, Join wording:** `index.html`, find the section comment (`<!-- HOME -->`, `<!-- RESOURCES -->`, …).
- **Playlist tracks:** `js/playlist.js`.
- **Colors and fonts:** top of `css/site.css`.
- **Events, news, members, listings:** don't edit code. Sign in as an admin and use the site.

Changes pushed to the `main` branch go live on GitHub Pages within a minute or two.

## Trying it locally

Browsers block some sign-in features on `file://` pages, so serve the folder instead:

```
python3 -m http.server 8000
```

then open http://localhost:8000. Add `http://localhost:8000` to Supabase's redirect URLs (see `supabase/README.md`) if you want email links to come back to your machine.

## Who sees what

Public visitors see events (date, time, general area), news, the playlist and resources. Approved members also see session addresses, RSVPs, the directory, gear for sale and member systems. Admins add events and posts and approve members. These rules are enforced by the database, not just the page.

# CFAS database (Supabase)

The website stores members, events, RSVPs, news, gear listings and member systems in a free Supabase project. **No member data is ever stored in this repository**; only the table design and fictional demo data live here.

## Files

| File | Purpose |
| --- | --- |
| `migrations/20261015000000_initial_schema.sql` | Creates all tables and the permission rules. Run once per project. |
| `seed/demo_seed.sql` | Fictional demo content: 12 members, 10 events, RSVPs, 6 posts, 8 gear listings, 5 member systems. Every row is tagged `is_demo`. |
| `seed/remove_demo_data.sql` | Deletes every demo row and leaves real data alone. Run before launch. |

## Who can see what

| | Public | Pending member | Approved member | Admin |
| --- | :-: | :-: | :-: | :-: |
| Event titles, dates, general area, RSVP counts | ✓ | ✓ | ✓ | ✓ |
| Published news | ✓ | ✓ | ✓ | ✓ |
| Exact session addresses and host phone | | | ✓ | ✓ |
| Member directory, who's RSVP'd | | | ✓ | ✓ |
| Gear for sale (post and edit own listings) | | | ✓ | ✓ |
| Member systems (submit own; shown after approval) | | | ✓ | ✓ |
| Add or edit events and news, approve members and systems | | | | ✓ |

Members can edit their own name, city, bio and directory visibility, but only an admin can change anyone's role or approval status. These rules are enforced by the database, not just hidden in the page.

## One-time setup

1. **Create the project.** Sign up at supabase.com, create a new project named `cfas-demo`, and pick the **East US** region. Save the database password somewhere safe.
2. **Create the tables.** In the project, open **SQL Editor → New query**, paste the whole contents of `migrations/20261015000000_initial_schema.sql`, and click **Run**.
3. **Load the demo data.** New query again, paste `seed/demo_seed.sql`, and click **Run**.
4. **Get the connection details** from **Project Settings → API** (or **Connect**):
   - the **Project URL**
   - the **publishable** key (older projects call it the **anon** key)

   Both are designed to be public and are safe to put in the website code; the permission rules above are what protect the data.
   **Never share or commit the `secret` / `service_role` key.** It bypasses every rule.

## Making yourself the first admin

After you've signed up on the site with your email, run this once in the SQL Editor (replace the email):

```sql
update public.profiles
set role = 'admin', status = 'active'
where user_id = (select id from auth.users where email = 'you@example.com');
```

After that, approve and promote other members from the site's admin screens.

## Before launch

- Run `seed/remove_demo_data.sql` to clear the fictional content, or
- (recommended) create a second, clean free project called `cfas-live`, run only the schema file there, and point the live site at it. The demo project stays available for testing.

## Things to know about the free plan

- **Pausing:** free projects pause after about 7 days with little activity. Supabase emails a warning first; resume with one click from the dashboard and no data is lost. A small scheduled "keep-alive" check can prevent it.
- **Backups:** the free plan has no downloadable backups. Export the members table periodically (**Table Editor → profiles → Export to CSV**).

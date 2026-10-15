-- =====================================================================
-- Remove ALL demo data (rows tagged is_demo = true).
-- Real data you've added is left untouched.
-- Run in the Supabase SQL Editor before launching the real site.
-- =====================================================================
begin;
delete from public.rsvps                 where is_demo;
delete from public.event_private_details where is_demo;
delete from public.listings              where is_demo;
delete from public.systems               where is_demo;
delete from public.posts                 where is_demo;
delete from public.events                where is_demo;
delete from public.profiles              where is_demo;
commit;

-- Confirm everything demo is gone (all counts should be 0):
select 'profiles' as table_name, count(*) from public.profiles where is_demo
union all select 'events',   count(*) from public.events   where is_demo
union all select 'posts',    count(*) from public.posts    where is_demo
union all select 'listings', count(*) from public.listings where is_demo
union all select 'systems',  count(*) from public.systems  where is_demo
union all select 'rsvps',    count(*) from public.rsvps    where is_demo;

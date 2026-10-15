-- =====================================================================
-- CFAS demo data — ALL FICTIONAL
-- Every row is tagged is_demo = true. Remove it all with remove_demo_data.sql.
-- Names, addresses and phone numbers are invented (555 numbers are reserved
-- for fiction). Do not replace them with real member details in this file:
-- this repository may be public.
-- =====================================================================

-- ---------- Members (12) -------------------------------------------
insert into public.profiles (id, display_name, city, bio, role, status, show_in_directory, joined_on, is_demo) values
('00000000-0000-4000-8000-000000000101','Walt Brenner','Winter Park','Club president. Tubes, horns, and too many Blue Note reissues.','admin','active',true,'2019-03-02',true),
('00000000-0000-4000-8000-000000000102','Denise Okafor','Orlando','Events coordinator. Runs the calendar and the coffee.','admin','active',true,'2020-06-13',true),
('00000000-0000-4000-8000-000000000103','Marcus Leal','Lake Mary','Measures everything. Owns a calibrated mic and isn''t afraid to use it.','member','active',true,'2020-09-19',true),
('00000000-0000-4000-8000-000000000104','Priya Raman','Oviedo','Streaming-first, vinyl-curious. Favorite test track: Little Fly.','member','active',true,'2021-01-23',true),
('00000000-0000-4000-8000-000000000105','Gene Hollister','Sanford','Retired broadcast engineer. Restores vintage receivers.','member','active',true,'2018-11-10',true),
('00000000-0000-4000-8000-000000000106','Carla Mendez','Kissimmee','Jazz vocals and small-room acoustics.','member','active',true,'2022-04-09',true),
('00000000-0000-4000-8000-000000000107','Tom Asher','Lakeland','Building a pair of open-baffle speakers, slowly.','member','active',true,'2023-02-11',true),
('00000000-0000-4000-8000-000000000108','Renee Faulk','Daytona Beach','Turntable setup obsessive. Will level your platter.','member','active',true,'2021-08-14',true),
('00000000-0000-4000-8000-000000000109','Hank Delgado','Clermont','Home theater convert to two-channel.','member','active',false,'2024-05-18',true),
('00000000-0000-4000-8000-000000000110','Lena Vos','Altamonte Springs','Classical and choral. Listens for the room.','member','active',true,'2024-10-12',true),
('00000000-0000-4000-8000-000000000111','Jordan Pike','Apopka','New to the hobby. Asking all the questions.','member','active',true,'2026-09-13',true),
('00000000-0000-4000-8000-000000000112','Sam Whitley','Deltona','Waiting for approval.','member','pending',true,'2026-10-10',true);

-- ---------- Events (10: 3 past, 7 upcoming) ------------------------
-- Times are Eastern. EDT (-04) through Nov 1, 2026; EST (-05) after.
insert into public.events (id, title, event_type, starts_at, ends_at, public_location, description, capacity, host_id, created_by, is_demo) values
('00000000-0000-4000-8000-000000000201','Two-Way vs. Three-Way Shootout','Listening session','2026-09-12 14:00-04','2026-09-12 17:30-04','Member home, Lake Mary','Standmounts against floorstanders in the same room, level-matched to 0.5 dB.',14,'00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000102',true),
('00000000-0000-4000-8000-000000000202','Board Meeting','Board meeting','2026-09-24 19:00-04','2026-09-24 20:30-04','Online','Budget, website project, and the 2027 calendar.',null,null,'00000000-0000-4000-8000-000000000101',true),
('00000000-0000-4000-8000-000000000203','Vintage Receiver Night','Listening session','2026-10-03 15:00-04','2026-10-03 18:00-04','Member home, Sanford','Restored 1970s receivers driving modern speakers. Bring a record.',12,'00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000102',true),
('00000000-0000-4000-8000-000000000204','Floorstander Night: Reference Playlist Run','Listening session','2026-10-24 14:00-04','2026-10-24 17:30-04','Member home, Winter Park','Full Reference Playlist on a pair of three-way floorstanders. Bring questions for Section 9.',16,'00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102',true),
('00000000-0000-4000-8000-000000000205','Dealer Visit & Demo','Dealer visit','2026-11-07 11:00-05','2026-11-07 14:00-05','Local dealer, Orlando','Anchor tracks only, across three speaker pairs in the dealer''s main room.',20,null,'00000000-0000-4000-8000-000000000102',true),
('00000000-0000-4000-8000-000000000206','Workshop: Room Setup & Measurement','Workshop','2026-11-21 13:00-05','2026-11-21 16:00-05','Member home, Lake Mary','Speaker placement, toe-in, and basic in-room measurement with a calibrated mic.',10,'00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000102',true),
('00000000-0000-4000-8000-000000000207','Holiday Social & Gear Swap','Social','2026-12-12 17:00-05','2026-12-12 21:00-05','Member home, Sanford','Bring a dish, and bring the gear you''re ready to part with.',30,'00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000102',true),
('00000000-0000-4000-8000-000000000208','Turntable Clinic','Workshop','2027-01-16 13:00-05','2027-01-16 16:00-05','Member home, Daytona Beach','Cartridge alignment, VTA, and tracking force. Bring your arm and your protractor.',8,'00000000-0000-4000-8000-000000000108','00000000-0000-4000-8000-000000000102',true),
('00000000-0000-4000-8000-000000000209','Vocal Night: Midrange Realism','Listening session','2027-01-30 14:00-05','2027-01-30 17:00-05','Member home, Kissimmee','Section 6 of the Reference Playlist, plus members'' favorite vocal recordings.',12,'00000000-0000-4000-8000-000000000106','00000000-0000-4000-8000-000000000102',true),
('00000000-0000-4000-8000-000000000210','Road Trip: Regional Hi-Fi Show','Show / expo','2027-02-20 09:00-05','2027-02-20 18:00-05','Tampa area','Carpool from Orlando. Details and sign-up closer to the date.',null,null,'00000000-0000-4000-8000-000000000101',true);

insert into public.event_private_details (event_id, address, parking_notes, host_phone, is_demo) values
('00000000-0000-4000-8000-000000000201','1200 Example Ln, Lake Mary, FL','Driveway fits 4; street parking on the left side only.','407-555-0103',true),
('00000000-0000-4000-8000-000000000203','88 Sample St, Sanford, FL','Park on the grass, not the swale.','407-555-0105',true),
('00000000-0000-4000-8000-000000000204','450 Placeholder Ave, Winter Park, FL','Garage door code given at the door. Overflow at the church lot across the street.','407-555-0101',true),
('00000000-0000-4000-8000-000000000206','1200 Example Ln, Lake Mary, FL','Driveway fits 4; street parking on the left side only.','407-555-0103',true),
('00000000-0000-4000-8000-000000000207','88 Sample St, Sanford, FL','Park on the grass, not the swale.','407-555-0105',true),
('00000000-0000-4000-8000-000000000208','31 Fictional Way, Daytona Beach, FL','Visitor spots at the front of the complex.','386-555-0108',true),
('00000000-0000-4000-8000-000000000209','702 Demo Dr, Kissimmee, FL','Gated community: give the host''s name at the gate.','407-555-0106',true);

-- ---------- RSVPs --------------------------------------------------
insert into public.rsvps (event_id, profile_id, status, guests, is_demo) values
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000101','going',0,true),
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000102','going',0,true),
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000103','going',1,true),
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000104','going',0,true),
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000106','maybe',0,true),
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000110','going',0,true),
('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000111','going',0,true),
('00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000102','going',0,true),
('00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000107','going',0,true),
('00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000109','going',1,true),
('00000000-0000-4000-8000-000000000206','00000000-0000-4000-8000-000000000104','going',0,true),
('00000000-0000-4000-8000-000000000206','00000000-0000-4000-8000-000000000111','going',0,true),
('00000000-0000-4000-8000-000000000206','00000000-0000-4000-8000-000000000107','not_going',0,true),
('00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000101','going',1,true),
('00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000105','going',1,true),
('00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000108','going',0,true),
('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000101','going',0,true),
('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000105','going',0,true),
('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000106','going',0,true);

-- ---------- News / blog (6: 5 published, 1 draft) ------------------
insert into public.posts (title, slug, excerpt, body, category, author_id, is_published, published_at, is_demo) values
('The CFAS Reference Playlist is live','reference-playlist-live',
 'Thirty-eight tracks in nine sections, now the shared benchmark at every session.',
 E'Our new shared benchmark is ready for every session.\n\nThirty-eight tracks in nine sections take you from the audiophile warhorses through bass control, imaging, and midrange realism, ending with a diagnostic set built to expose a system''s weak spots.\n\nShort on time? Play only the nine anchor tracks for a complete 40-minute evaluation.',
 'Announcement','00000000-0000-4000-8000-000000000101',true,'2026-10-05 09:00-04',true),
('Recap: Vintage Receiver Night','recap-vintage-receiver-night',
 'Five restored 1970s receivers, one pair of modern standmounts, and a surprising winner.',
 E'Gene hosted eleven of us for an afternoon of restored receivers.\n\nThe surprise of the day: the smallest unit in the lineup had the tightest bass on Flight of the Cosmic Hippo. Full notes and scores are in the members area.',
 'Session recap','00000000-0000-4000-8000-000000000105',true,'2026-10-06 18:00-04',true),
('Recap: Two-Way vs. Three-Way Shootout','recap-two-way-vs-three-way',
 'Twelve members, two speaker pairs, level-matched to within 0.5 dB.',
 E'The room split down the middle on the bass section and came back together on imaging.\n\nThe standmounts won Section 4 outright; the floorstanders took Section 2 and Section 3.',
 'Session recap','00000000-0000-4000-8000-000000000103',true,'2026-09-14 10:00-04',true),
('Why we level-match every comparison','why-we-level-match',
 'A 1 dB difference is enough to make the louder system sound "better." Here''s how we avoid it.',
 E'Starting this season, every comparison is level-matched before listening begins.\n\nUse pink noise and an SPL meter at the listening position. Phone apps are fine; we calibrate them against the club meter at the start of each session.',
 'Tech talk','00000000-0000-4000-8000-000000000103',true,'2026-08-20 12:00-04',true),
('Welcome to our newest members','welcome-new-members-sep-2026',
 'Say hello to the members who joined us this fall.',
 E'Please welcome our newest members from Apopka, Altamonte Springs, and Clermont. Introduce yourself at the next session.',
 'News','00000000-0000-4000-8000-000000000102',true,'2026-09-20 09:00-04',true),
('Draft: 2027 meeting calendar','draft-2027-calendar',
 'Proposed dates for next year. Not published yet.',
 E'Draft for board review. Proposed second-Saturday cadence with a summer break in July.',
 'Announcement','00000000-0000-4000-8000-000000000101',false,null,true);

-- ---------- Gear for sale (8) --------------------------------------
insert into public.listings (seller_id, title, category, brand, model, condition, price_cents, trade_ok, description, status, is_demo, created_at) values
('00000000-0000-4000-8000-000000000105','Restored 1970s stereo receiver','Amplification','Marantz','2230','Very good',65000,true,'Fully recapped, new lamps, original wood case. Demo at the Holiday Social.','available',true,'2026-10-07 10:00-04'),
('00000000-0000-4000-8000-000000000103','Calibrated measurement mic + stand','Accessories','miniDSP','UMIK-1','Excellent',7500,false,'With calibration file and boom stand. Upgrading to a two-mic setup.','available',true,'2026-10-01 14:00-04'),
('00000000-0000-4000-8000-000000000108','Belt-drive turntable with arm','Turntable / analog','Rega','Planar 3','Excellent',72500,false,'Includes dust cover. Cartridge not included. Local pickup only.','pending',true,'2026-09-28 09:30-04'),
('00000000-0000-4000-8000-000000000104','Desktop DAC / headphone amp','DAC','Schiit','Modi + Magni stack','Very good',15000,true,'Both units, cables and power supplies included.','available',true,'2026-10-11 20:15-04'),
('00000000-0000-4000-8000-000000000107','Pair of 12" woofers (for DIY)','Speakers','Generic','12" paper cone, 8 Ω','Good',12000,true,'Pulled from my open-baffle prototype. Measured within 0.3 dB of each other.','available',true,'2026-10-12 11:00-04'),
('00000000-0000-4000-8000-000000000106','Acoustic panels, set of 6','Room treatment','Generic','2" fabric-wrapped','Very good',18000,false,'Light gray, 2 ft × 4 ft. Mounting hardware included.','available',true,'2026-10-09 16:40-04'),
('00000000-0000-4000-8000-000000000101','Speaker cables, 10 ft pair','Cables','Generic','12 AWG, banana terminated','Excellent',6000,false,'Used for one season. Selling because I moved my speakers closer.','sold',true,'2026-09-05 08:00-04'),
('00000000-0000-4000-8000-000000000109','Bookshelf speakers','Speakers','KEF','LS50 Meta','Excellent',90000,false,'Original box and grilles. Under two years old.','available',true,'2026-10-13 19:20-04');

-- ---------- Member systems (5: 4 approved, 1 awaiting review) -----
insert into public.systems (owner_id, name, speakers, amplification, source, dac, analog, room, notes, approved, is_demo) values
('00000000-0000-4000-8000-000000000101','Winter Park main room','Three-way floorstanders, 8" woofer','Tube integrated, 40 W/ch','Network streamer','Standalone R2R DAC','Belt-drive turntable, MC cartridge','16 × 22 ft, hardwood, rug, bass traps in front corners','Our usual Reference Playlist room.',true,true),
('00000000-0000-4000-8000-000000000103','Lake Mary measured room','Two-way standmounts + two subwoofers','Class D power amp, 250 W/ch','Laptop, Roon','Desktop DAC with balanced out','—','13 × 17 ft, carpet, six absorption panels','Subs integrated with measurement and DSP.',true,true),
('00000000-0000-4000-8000-000000000105','Sanford vintage den','Restored 1970s three-ways','Recapped 1970s receivers (rotating)','Cassette deck, CD transport','Built-in','Direct-drive turntable, MM cartridge','12 × 14 ft, wood paneling','Everything older than the owner''s car.',true,true),
('00000000-0000-4000-8000-000000000106','Kissimmee vocal room','Two-way standmounts, silk dome tweeter','Solid-state integrated, 80 W/ch','Network streamer','Built-in','—','11 × 13 ft, heavy drapes','Small room, near-field setup.',true,true),
('00000000-0000-4000-8000-000000000111','Apopka starter system','Powered bookshelf speakers','Built-in','Phone via Bluetooth, Spotify','Built-in','—','Bedroom, 10 × 12 ft','First system. Advice welcome!',false,true);

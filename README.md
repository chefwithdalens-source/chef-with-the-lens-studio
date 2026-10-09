# Chef with the Lens Studio: photography homepage

A simple, static website for wedding, event and portrait photography: a homepage plus one catalog page per service.
No installs, no build step. **To view it, just double-click `index.html`** (it opens in any web browser).

## The look

- Clean and minimal, inspired by Apple and Squarespace: lots of white space, large bold headlines,
  full-width section blocks and big, polished photos.
- One font everywhere: **Helvetica Neue** (falls back to Helvetica, then Arial). No web fonts to load.
- White and near-black palette with **one** blue accent for buttons and links.
- Gentle motion: sections fade and slide up as you scroll, and photos zoom slightly on hover.
  Visitors whose device asks for reduced motion get no animation.
- **Light / Dark appearance:** the gear icon in the header opens a small Settings panel.
  Light is the default. The site does **not** switch automatically with the device setting; it only changes
  when the visitor picks Dark. Their choice is remembered in their browser.

## Files

| File | What it is |
|------|------------|
| `index.html` | The homepage: hero, services, portfolio, about, booking form |
| `weddings.html` | Weddings catalog page |
| `events.html` | Events catalog page |
| `portraits.html` | Portraits catalog page |
| `styles.css` | Colors (light and dark), font, layout and animations |
| `script.js`  | Small helpers shared by all pages: Settings/Dark mode, phone menu, scroll fade-ins, footer year, booking-form email, photo viewer |
| `images/`    | Homepage photos |
| `images/catalog/weddings/`, `events/`, `portraits/` | Photos for each catalog page |
| `screenshots/` | Preview screenshots (homepage desktop light/dark and phone, plus each catalog page), not used by the site |

## Pages and navigation

- The menu (top) and footer link to **Weddings, Events, Portraits** (catalog pages), **Portfolio**, **About** and **Contact**.
- On the homepage, each service row is clickable (photo, title or "View the … catalog →") and opens its catalog page.
- Each catalog page has a big title, a one-line intro, a photo gallery (click a photo to view it large),
  a **Book a session** button (goes to the booking form on the homepage) and a link back to Home.
- The header and footer are repeated on all four pages. **If you change a menu link, the brand name
  or the footer, make the same change in all four `.html` files.**
- The Light/Dark choice is shared: pick Dark on one page and every page opens in Dark.

## Adding photos to a catalog page

1. Resize the photo to about **2000px on the long side** (under ~500 KB is ideal) and save it in the matching
   folder: `images/catalog/weddings/`, `images/catalog/events/` or `images/catalog/portraits/`.
   Use a simple descriptive name with no spaces, e.g. `garden-ceremony.jpg`.
2. Open the page (e.g. `weddings.html`) and find the **GALLERY** comment. Copy one `<li ...>` line and paste it where you want the photo.
3. In the copied line, change the file name in **both** `href="..."` and `src="..."`, and write a short description in `alt="..."`.
4. Use `class="reveal"` for **wide** photos and `class="reveal tall"` for **tall** photos (tall ones take two rows).
5. To remove a photo, delete its whole `<li ...>` line.

Tip: the grid fills best when the number of "cells" (wide = 1, tall = 2) is a multiple of 3. On phones, adding
`feature` to a wide photo's class (e.g. `class="reveal feature"`) makes it full width to even out the last row.
The Events page uses a 2-column gallery (`class="portfolio-grid cols-2"`); remove ` cols-2` once it has 3 or more photos.
The Portraits page uses a 4-across gallery (`class="portfolio-grid cols-4"`, 2-across on phones); it looks most even with 4, 8 or 12 tall photos.

## Editing the words (copy)

Open `index.html` in any text editor (TextEdit in plain-text mode, Notepad, VS Code...).
Look for comments that say **`EDIT ME`**; they mark every spot you're likely to change:

- **Page title / description** (top of the file, used by Google and browser tabs)
- **Hero line**: the single sentence over the big photo ("Weddings, events and portraits, beautifully framed.")
- **Services**: Weddings, Events, Portraits. Change the heading and short sentence in each.
- **Catalog pages**: the title, intro line and "Like what you see?" text at the top/bottom of each catalog page.
  If you rename a service, also update the matching option in the **Session type** dropdown of the form.
- **Portfolio intro**, **booking intro**
- **About** ("Hi, I'm Rayon."): the headline and the three first-person paragraphs, between the Portfolio and Booking sections
- **Contact details**: replace the placeholder `hello@example.com` (the location is set to Bay Area, California)
- **Footer**: add social links (an example is in the comment)

Only change the text *between* the tags, e.g. `<h3>Portraits</h3>` becomes `<h3>Headshots</h3>`.

## Swapping photos

The easiest way: **save your new photo into `images/` with the same file name** as the one you're replacing.
Then update that photo's `alt="..."` text in `index.html` with a short description (important for accessibility and Google).

| File | Where it appears |
|------|------------------|
| `images/hero.jpg` | Big full-screen photo at the top. Use a wide photo, about 2400×1600. A dark tint is added automatically so the white headline stays readable. |
| `images/about-rayon.jpg` | About section photo (shown tall beside the text on computers, wide on phones). Update its `alt="..."` if you change it. |
| `images/service-weddings.jpg` | Weddings row |
| `images/service-events.jpg` | Events row |
| `images/service-portraits.jpg` | Portraits row |
| `images/portfolio-01.jpg` … `portfolio-09.jpg` | Homepage portfolio gallery (clicking a photo opens it large) |
| `images/catalog/<service>/…` | Catalog page galleries (see "Adding photos to a catalog page") |

Portfolio tips:
- In each tile the photo name appears **twice** (`href="..."` opens it large, `src="..."` shows it in the grid); if you rename, change both.
- Wide photos use `<li class="reveal">`; tall photos use `<li class="reveal tall">` so they take two rows.
  3 tall + 6 wide (the current mix) makes a perfectly even gallery.
- Aim for photos 1400–2400px on the long side and under ~500 KB each so the page stays fast.

## Adding a Real Estate service later

The Real Estate service is switched off for now. A ready-made Real Estate row is already in `index.html`,
hidden inside a comment right after the Portraits row (look for **`OPTIONAL EXTRA SERVICE`**). To switch it on:

1. Save one of your property photos as `images/service-realestate.jpg`.
2. In `index.html`, delete the whole line containing `HIDDEN ROW START` and the whole line containing `HIDDEN ROW END`.
3. Change the row number `0X` to `04`, and write a short description of the photo in its `alt="..."`.
4. Add `<option>Real Estate</option>` to the **Session type** dropdown in the booking form.
5. Optionally mention real estate in the hero line, the page title/description and the services intro.

Rows alternate photo-left / photo-right automatically, so the layout stays balanced.
You can also add real estate photos to the portfolio gallery (see "Swapping photos" above).
For a Real Estate catalog page, copy `portraits.html` to `realestate.html`, change its title, intro and photos
(put them in a new `images/catalog/realestate/` folder), point the row's link to `realestate.html`,
and add a menu link to the header of all pages.

## Colors and dark mode

At the top of `styles.css`:
- the `:root` block holds the **Light** colors (the default),
- the `[data-theme="dark"]` block holds the **Dark** colors.

Change a color code there and it updates across the whole site. `--accent` is the single accent color (buttons and links).

## The booking form

There is no server, so by default pressing **Send request** opens the visitor's own email app
with a pre-filled message (name, email, session type, date, message) addressed to your email.
Replace `hello@example.com` in **both** places on the `<form>` line (`action="mailto:..."` and `data-mailto="..."`).

**Recommended upgrade:** use a free form service such as [Formspree](https://formspree.io) so visitors
don't need an email app. Step-by-step instructions are in the comment just above the booking section
in `index.html` (in short: paste your Formspree URL into `action`, delete `enctype="text/plain"` and `data-mailto`).

## Publishing

Upload the whole folder to any static host (Netlify Drop, GitHub Pages, Cloudflare Pages, or your web host's file manager).

## Image credits

**Owner's own photography (Chef with the Lens Studio, all rights reserved).** These come from the studio's
"MY CATOLOG" Google Drive folder and were resized for the web:

| Site file | Original (MY CATOLOG/…) |
|-----------|-------------------------|
| hero.jpg | WEDDINGS/IMG_7701.jpg |
| about-rayon.jpg | Rayon's own black-and-white self-portrait (provided directly by the owner) |
| service-weddings.jpg | WEDDINGS/IMG_3216-Enhanced-NR.jpg |
| service-events.jpg | WEDDINGS/IMG_6456.JPG |
| service-portraits.jpg | IMG_1353 2.jpg |
| portfolio-01.jpg | WEDDINGS/IMG_7911.JPG |
| portfolio-02.jpg | WEDDINGS/IMG_0137.jpg |
| portfolio-03.jpg | Engagement Shoots/bit d-6.jpg |
| portfolio-04.jpg | Engagement Shoots/IMG_6655.jpg |
| portfolio-05.jpg | 56230215-C02B-44EF-A9C1-052BB3EAA3A4.jpg |
| portfolio-06.jpg | WEDDINGS/IMG_7696.JPG |
| portfolio-07.jpg | WEDDINGS/IMG_6225.jpg |
| portfolio-08.jpg | WEDDINGS/IMG_7701.jpg (same photo as the hero) |
| portfolio-09.jpg | WEDDINGS/.JPG |

Catalog pages (resized from the original files to max 2000px, EXIF removed):

| Site file (images/catalog/…) | Original (MY CATOLOG/…) |
|------------------------------|-------------------------|
| weddings/church-ceremony.jpg | WEDDINGS/IMG_7701.jpg |
| weddings/arcade-couple.jpg | WEDDINGS/IMG_3216-Enhanced-NR.jpg |
| weddings/bouquet-tunnel-kiss.jpg | WEDDINGS/IMG_7911.JPG |
| weddings/vows-black-and-white.jpg | WEDDINGS/IMG_7696.JPG |
| weddings/park-bench-engagement.jpg | WEDDINGS/IMG_6225.jpg |
| weddings/lakeside-dock-engagement.jpg | Engagement Shoots/IMG_6655.jpg |
| weddings/forehead-embrace-engagement.jpg | Engagement Shoots/bit d-6.jpg |
| events/bridal-party-champagne.jpg | WEDDINGS/IMG_6456.JPG |
| events/bride-laughing-tunnel.jpg | WEDDINGS/.JPG |
| portraits/straw-hat-color.jpg | IMG_1353 2.jpg |
| portraits/straw-hat-black-and-white.jpg | IMG_1353.jpg |
| portraits/night-glam-rooftop.jpg | 56230215-C02B-44EF-A9C1-052BB3EAA3A4.jpg |
| portraits/rooftop-orange-coat.jpg | Portraits/5E1152F2-098C-43D9-9132-842665F71B81.jpg |
| portraits/ocean-arm-raised.jpg | Portraits/A9DD27CA-18C0-419D-B8D8-8B9B3AE3CACB.jpg |
| portraits/golden-hour-grass.jpg | Portraits/IMG_0957.jpeg |
| portraits/curls-round-glasses.jpg | Portraits/IMG_3836.jpg |
| portraits/white-blouse-natural-curls.jpg | Portraits/IMG_9466.jpg |

Not used: WEDDINGS/JPG (a low-res duplicate of the IMG_7911 bouquet-tunnel kiss).

# Central Florida Audiophile Society — Website

Demo website for the Central Florida Audiophile Society (CFAS), prepared for club review before going live on our domain.

## What's here

| File | What it is |
| --- | --- |
| `index.html` | The entire site: pages, styles, and scripts in one file. No build step. |
| `assets/cfas-logo.png` | The club logo (the same image is also embedded inside `index.html`). |

## Viewing it

Download or clone the repository and double-click `index.html` to open it in any browser.

## Editing it

Open `index.html` in a code editor such as [VS Code](https://code.visualstudio.com/) (free).

- **Colors and fonts:** the `<style>` section at the top. Colors are named once at the very top (`--red` is the logo red, `--paper` / `--ink` are background and text) and used everywhere.
- **Page content:** each page starts with a comment such as `<!-- HOME -->`, `<!-- NEWS -->`, `<!-- RESOURCES -->`, `<!-- JOIN -->`. Headlines, news posts, and the suggested-features list live here.
- **Sample events:** the `SAMPLE` list in the `<script>` section near the bottom.
- **Reference Playlist tracks:** the `PL` list in the same `<script>` section.
- **Logo:** the long line beginning `data:image/png;base64` is the embedded logo. Don't edit it by hand.

Save, then refresh the browser to see the change.

## Demo limitations

- **Admin view on the calendar** is a demonstration. Events added there are saved only in the viewer's own browser. The live site will need real administrator logins.
- **Forms** (Join, Add your system) show a confirmation but don't send anything yet.
- Content marked **Sample** or **Example** is placeholder text.

## Going live

The site can be published from this repository with GitHub Pages, Netlify, or Cloudflare Pages, and then the club's domain is pointed at it with a DNS setting at the domain registrar.

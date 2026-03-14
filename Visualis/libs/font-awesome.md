# Font Awesome (font-awesome/css + js + webfonts)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:FontAwesome />`
- Put it inside `<head>`.
- This placeholder injects both CSS and JavaScript assets for Font Awesome.

## What this library does
- Font Awesome provides icon fonts and optional JavaScript for SVG replacement.
- Icons are used via CSS classes (`fa-solid fa-<name>`, `fa-regular fa-<name>`, `fa-brands fa-<name>`).
- The **free** set includes Solid, Regular, and Brands; webfonts and CSS/JS are in `libs/font-awesome/`.

## Files in this repo
| Path | Purpose |
|------|--------|
| `libs/font-awesome/css/all.min.css` | All free styles (solid, regular, brands) |
| `libs/font-awesome/js/all.min.js` | Optional JS (e.g. SVG with JS) |
| `libs/font-awesome/webfonts/` | WOFF2/TTF fonts required by the CSS |
| `libs/font-awesome-icons.md` | **Full list of every icon and what each represents** |

## How to use
1. Include the CSS: `<link href="libs/font-awesome/css/all.min.css" rel="stylesheet">`
2. Use an icon: `<i class="fa-solid fa-heart"></i>` or `<span class="fa-brands fa-github"></span>`
3. For the complete icon reference and meanings, see **[font-awesome-icons.md](font-awesome-icons.md)**.

## Cheat sheet
| Task | Class pattern | What it does |
|------|----------------|---------------|
| Solid icon | `fa-solid fa-<name>` or `fas fa-<name>` | Filled icon |
| Regular icon | `fa-regular fa-<name>` or `far fa-<name>` | Outline icon (where available) |
| Brand icon | `fa-brands fa-<name>` or `fab fa-<name>` | Logo/brand (e.g. GitHub, Twitter) |
| Size | `fa-2x`, `fa-3x`, … | Scale icon |
| Fixed width | `fa-fw` | Equal width for alignment |

## Icon reference
See **[font-awesome-icons.md](font-awesome-icons.md)** for a table of every Font Awesome free icon with its class name, label, and what it represents (including search terms).

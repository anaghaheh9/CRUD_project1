# STOCKROOM — Inventory CRUD Project

STOCKROOM is a small inventory management app: an **Express.js REST API** backed by an **in-memory JavaScript array**, with a hand-built **HTML / CSS / vanilla JavaScript** front end. It performs real Create, Read, Update and Delete operations; nothing in the UI is a hardcoded demo value.

## Quick start

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Open http://localhost:3000. To use another port: `PORT=4000 npm start` (macOS/Linux) or `set PORT=4000 && npm start` (Windows cmd).

## Project structure

```
CRUD_Items_Project/
├── package.json        Dependencies and the start script (only express)
├── server.js           Express server, REST routes, validation, in-memory array
├── README.md
└── public/
    ├── index.html      App shell: sidebar, header, summary cards, drawer, modal
    ├── styles.css      Design tokens and all component styles
    └── app.js          State, REST client, rendering, drawer, toasts, events
```

## REST API

Base path: `/api/items`. Items look like `{ "id": 1, "name": "Book", "price": 250 }`.

| Method | Endpoint          | Purpose                              | Success | Errors   |
|--------|-------------------|--------------------------------------|---------|----------|
| GET    | `/api/items`      | List items; optional `?search=text`  | 200     | —        |
| GET    | `/api/items/:id`  | Get one item                         | 200     | 404      |
| POST   | `/api/items`      | Create (`name`, `price`)             | 201     | 400      |
| PUT    | `/api/items/:id`  | Update (`name`, `price`)             | 200     | 400, 404 |
| DELETE | `/api/items/:id`  | Delete; returns the removed item     | 200     | 404      |

Validation (server side): `name` is required and at most 60 characters; `price` must be a number between 0 and 10,000,000 (rounded to 2 decimals). Invalid input returns `400` with `{ "error": "...", "fields": { "name": "...", "price": "..." } }`.

Quick test with curl:

```bash
curl http://localhost:3000/api/items
curl -X POST http://localhost:3000/api/items -H "Content-Type: application/json" -d '{"name":"Notebook","price":120}'
curl -X PUT http://localhost:3000/api/items/3 -H "Content-Type: application/json" -d '{"name":"Notebook","price":135}'
curl -X DELETE http://localhost:3000/api/items/3
```

## Data

The store starts with two seeded items: **Book — ₹250** and **Pen — ₹25**. IDs auto-increment and are never reused. Because storage is an in-memory array, all changes reset when the server restarts. This is intentional for this project.

## Features

- **Summary cards**: Total Items, Total Inventory Value and Average Item Price are computed in the browser from the live item array on every change.
- **Items table**: custom `STK-001` ID badges, formatted rupee prices (en-IN), Edit and Delete controls, subtle row hover.
- **Add / Edit drawer**: a slide-out panel with a live tag preview, inline validation, and server-error display. Esc or the scrim closes it.
- **Search**: filters by name or ID (`pen`, `001`, `STK-001`) as you type; summary cards always reflect the full inventory.
- **States**: skeleton loading rows, empty inventory, no-search-results, and server-unreachable with retry.
- **Delete confirmation** dialog before anything is removed.
- **Toasts** for every success and error.
- **Responsive**: the sidebar becomes an off-canvas menu under 960px; under 720px the table reflows into stacked rows.
- **Accessibility**: visible focus rings, labelled icon buttons, `aria-live` regions, reduced-motion support.
- **Navigation**: Overview shows cards plus the table; Items shows the table only.

## Design notes

- Palette: charcoal `#151515`, warm off-white `#F3EEE6`, orange `#FF6B35`. The one fully orange element is the Total Inventory Value card.
- Type: Bricolage Grotesque (headings, prices) and Hanken Grotesk (interface text), loaded from Google Fonts. Without internet, system fonts take over and everything still works.
- Icons: inline Lucide-style SVGs inside `app.js`, so there are no icon dependencies and no emoji.
- All user text is HTML-escaped before rendering.

## Ideas for extending

Swap the array in `server.js` for SQLite or MongoDB (the routes stay the same), add a quantity field, or add sorting and pagination.

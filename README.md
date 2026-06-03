# Manchester Parking Map

Interactive map showing where you can park in Manchester city centre **right now** — with filters for time, cost, and how long you need to stay.

![Manchester Parking Map](https://github.com/SuhailHussain/manchester-parking-map/raw/main/docs/screenshot.png)

## What it shows

Manchester city centre is divided into four controlled parking zones, all operating **Mon–Sun 08:00–20:00** (free outside those hours and on bank holidays):

| Zone | Max stay | 30 min | 1 hr | 2 hr |
|------|----------|--------|------|------|
| Zone 1 | 2 hr | £2.00 | £4.00 | £7.00 |
| Zone 2 | 2 hr | £2.00 | £4.00 | £7.00 |
| Zone 3 | 3 hr | £1.00 | £2.00 | £3.50 |
| Zone 4 | 10 hr | £1.00 | £2.00 | £4.00 |

Zone 4 has a £10 flat rate on weekends with no time limit.

The map colours zones in real time:
- 🟢 **Green** — free right now
- 🟡 **Amber** — paid parking, within your budget
- ⚫ **Grey** — over budget or duration exceeds max stay

Zone boundaries are sourced from [Manchester City Council's official parking zone map](https://www.google.com/maps/d/viewer?mid=1G-fl2jXUBp8PYGUkIWkx6WPfh-4).

## Running locally

**Requirements:** Node.js 18+

```bash
git clone https://github.com/SuhailHussain/manchester-parking-map.git
cd manchester-parking-map
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Refreshing OSM street data

Street-level parking bay lines come from OpenStreetMap, pre-baked at build time. To refresh:

```bash
npm run bake-osm
```

This queries the [Overpass API](https://overpass-api.de) for parking-tagged roads within Manchester city centre and writes the result to `public/data/osm-parking.geojson`.

## Building for production

```bash
npm run build
```

Output goes to `dist/` — a fully static site, deployable to any web host (GitHub Pages, Netlify, Vercel, etc.).

## Running tests

```bash
npm test
```

18 unit tests covering the zone rules engine: pricing steps, bank holidays, Zone 4 weekend flat rate, max stay enforcement.

## Data sources

- **Zone boundaries** — [Manchester City Council KML](https://www.google.com/maps/d/kml?forcekml=1&mid=1G-fl2jXUBp8PYGUkIWkx6WPfh-4)
- **Pricing & rules** — [Manchester City Council parking pages](https://www.manchester.gov.uk/parking/city-centre-parking/pay-and-display-parking-bays)
- **Street parking data** — [OpenStreetMap](https://www.openstreetmap.org) via [Overpass API](https://overpass-api.de)
- **Map tiles** — [OpenFreeMap](https://openfreemap.org) Positron style

## Tech stack

- [Vite](https://vitejs.dev) + vanilla TypeScript
- [MapLibre GL JS](https://maplibre.org)
- [Vitest](https://vitest.dev)
- No framework, no backend — fully static

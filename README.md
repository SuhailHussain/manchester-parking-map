# Manchester Parking Map

Interactive map showing where you can park in Manchester city centre **right now**, with filters for time, cost, and how long you need to stay. The problem with this information on the Manchester council site is the map shows the zones but not the specific streets with bay parking. Tey list the streets with bays but on indivual pages meaning you have to click through dozens. Not the solution you want when you're in the city, trying to find where you can park.

**[View live →](https://suhailhussain.github.io/manchester-parking-map/)**

![Manchester Parking Map — overview](https://github.com/SuhailHussain/manchester-parking-map/raw/main/assets/mcr-parking.png)

![Manchester Parking Map — detail](https://github.com/SuhailHussain/manchester-parking-map/raw/main/assets/mcr-parking2.png)

## What it shows

Manchester city centre is divided into four controlled parking zones, all operating **Mon–Sun 08:00–20:00** (free outside those hours and on bank holidays):

| Zone | Max stay | 30 min | 1 hr | 2 hr |
|------|----------|--------|------|------|
| Zone 1 | 2 hr | £2.00 | £4.00 | £7.00 |
| Zone 2 | 2 hr | £2.00 | £4.00 | £7.00 |
| Zone 3 | 3 hr | £1.00 | £2.00 | £3.50 |
| Zone 4 | 10 hr | £1.00 | £2.00 | £4.00 |

Zone 4 has a £10 flat rate on weekends with no time limit.

The map colours streets in real time:
- 🟢 **Green** — free right now
- 🟡 **Amber** — paid parking, within your budget
- ⚫ **Grey** — over budget or duration exceeds max stay

Zone boundaries and street lists are sourced from [Manchester City Council's official parking zone map](https://www.google.com/maps/d/viewer?mid=1G-fl2jXUBp8PYGUkIWkx6WPfh-4) and [on-street parking bay directories](https://www.manchester.gov.uk/online-directories/parking-directories/city-centre-parking-directories/on-street-parking-bays/zone-1).

## Data sources

- **Zone boundaries** — [Manchester City Council KML](https://www.google.com/maps/d/kml?forcekml=1&mid=1G-fl2jXUBp8PYGUkIWkx6WPfh-4)
- **Pricing & rules** — [Manchester City Council parking pages](https://www.manchester.gov.uk/parking/city-centre-parking/pay-and-display-parking-bays)
- **Street lists** — [Manchester City Council on-street parking bay directories](https://www.manchester.gov.uk/online-directories/parking-directories/city-centre-parking-directories/on-street-parking-bays/zone-1)
- **Street geometry** — [OpenStreetMap](https://www.openstreetmap.org) via [Overpass API](https://overpass-api.de)
- **Map tiles** — [OpenFreeMap](https://openfreemap.org) Positron style

## Tech stack

- [Vite](https://vitejs.dev) + vanilla TypeScript
- [MapLibre GL JS](https://maplibre.org)
- [Vitest](https://vitest.dev)
- No framework, no backend — fully static, hosted on GitHub Pages

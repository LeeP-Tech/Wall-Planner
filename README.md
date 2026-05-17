# Wall Planner

A browser-based tool for planning picture and shelf layouts on a wall, and calculating exact drill hole positions.

Built with React + Vite + TypeScript + Tailwind CSS, deployed as an Azure Static Web App.

## Features

### Wall configuration
- Set wall width and height in metric (cm) or imperial (ft/in)
- Configure left and right margins, and the default gutter between items
- Set a centre height to align items to (measured from the bottom of the wall)
- Choose measurement accuracy: 10 mm, 5 mm, 2 mm, or 1 mm

### Items
- Add items with a name, width, height, number of holes, hole spacing, and vertical offset
- Per-item gutter override for fine-grained control
- Copy and reorder items via drag handles
- Overflow detection highlights items that don't fit

### Layout modes
Four automatic layout algorithms, each with its own parameter controls:

| Mode | Description |
|---|---|
| **Linear** | Evenly spaced row at the centre height |
| **Circular** | Items arranged around a circle |
| **Hub & Spoke** | One central item with others radiating outward |
| **Splat** | Organic scattered arrangement |

### Diagram
- SVG wall diagram showing item positions to scale
- Compact hole callouts with left/right and top/bottom distances
- Hole number badges on multi-hole items
- Save as PNG (2× retina resolution)
- Print-friendly layout

### Drill positions table
- Full measurement table per hole: from left, from right, from top, from bottom, from wall centre, gap to next hole
- Colour-coded by item
- Works in both metric and imperial

### Project history
- Save named snapshots of your current layout
- Load or delete any previous snapshot
- Up to 20 snapshots stored in browser local storage

## Getting Started

```
npm install
npm run dev       # http://localhost:5173
npm test          # unit tests
npm run build     # dist/
npm run preview
```

## Azure Static Web Apps deployment

Add your deployment token as GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN`.
The workflow in `.github/workflows/azure-static-web-apps.yml` builds and deploys on push to main.

Or use the SWA CLI:

```
swa deploy ./dist --deployment-token YOUR_TOKEN
```

## Dependency Automation

- Weekly dependency PRs are managed by `.github/dependabot.yml`
- Weekly dependency health checks run in `.github/workflows/dependency-health.yml`
- The dependency check currently ignores eslint and @eslint/js majors because eslint-plugin-react-hooks does not yet support ESLint 10 peer ranges

## Community

- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](SECURITY.md)

## Licence

MIT (c) Lee Pasifull

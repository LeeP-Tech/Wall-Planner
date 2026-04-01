# Wall Planner

A browser-based tool for calculating drill hole positions when hanging pictures, shelves, or any items on a wall.

Built with React + Vite + TypeScript + Tailwind CSS, deployed as an Azure Static Web App.

## Features

- Wall width, centred or left-aligned layout
- Items with configurable width, hole count, spacing, offset, per-item gutter override
- Copy and reorder items
- SVG diagram with crosshairs and fromLeft/fromRight distance labels
- Dimension ruler band showing margins, item widths, and gutters
- Measurement table: fromLeft, fromRight, fromCentre, gap-to-next-hole
- Save as PNG (2x retina resolution)
- Overflow detection, mobile-friendly, print-friendly

## Getting Started

    npm install
    npm run dev       # http://localhost:5173
    npm test          # unit tests
    npm run deps:check
    npm run build     # dist/
    npm run preview

## Azure Static Web Apps deployment

Add your deployment token as GitHub secret AZURE_STATIC_WEB_APPS_API_TOKEN.
The workflow in .github/workflows/azure-static-web-apps.yml builds and deploys on push to main.

Or use the SWA CLI:  swa deploy ./dist --deployment-token YOUR_TOKEN

## Dependency Automation

- Weekly dependency PRs are managed by .github/dependabot.yml
- Weekly dependency health checks run in .github/workflows/dependency-health.yml
- The dependency check currently ignores eslint and @eslint/js majors because eslint-plugin-react-hooks does not yet support ESLint 10 peer ranges

## Community

- Contribution guide: CONTRIBUTING.md
- Code of Conduct: CODE_OF_CONDUCT.md
- Security policy: SECURITY.md
- Bug reports: .github/ISSUE_TEMPLATE/bug_report.md
- Feature requests: .github/ISSUE_TEMPLATE/feature_request.md

## Licence

MIT (c) Lee Pasifull

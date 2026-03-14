/**
 * Standalone flapi mock server for development.
 * Simulates the flapi API that bolt.diy's proxy routes call.
 *
 * Usage:  node mocks/flapi-mock.cjs
 * Runs on port 4000 by default (matches VITE_FLAPI_URL).
 */

const http = require('http');

const PORT = Number(process.env.FLAPI_PORT) || 4000;

const packages = [
  { Id: 1, Logo: '', Name: 'Sample Sales Package', Type: 'Package' },
  { Id: 2, Logo: '', Name: 'User Analytics Package', Type: 'Package' },
  { Id: 3, Logo: '', Name: 'HR Dashboard Package', Type: 'Package' },
  { Id: 99, Logo: '', Name: 'Internal Template', Type: 'Template' },
];

const packageData = {
  1: {
    sales_cube: [
      { region: 'North', amount: 4200, product: 'Widget A', date: '2025-01' },
      { region: 'South', amount: 3150, product: 'Widget B', date: '2025-01' },
      { region: 'East', amount: 2800, product: 'Widget A', date: '2025-02' },
      { region: 'West', amount: 5200, product: 'Widget C', date: '2025-02' },
      { region: 'North', amount: 3900, product: 'Widget B', date: '2025-03' },
      { region: 'South', amount: 4600, product: 'Widget A', date: '2025-03' },
      { region: 'East', amount: 3100, product: 'Widget C', date: '2025-04' },
      { region: 'West', amount: 4800, product: 'Widget B', date: '2025-04' },
    ],
    customers_cube: [
      { id: 1, name: 'Acme Corp', region: 'North', revenue: 12500, active: true },
      { id: 2, name: 'Globex Inc', region: 'South', revenue: 8900, active: true },
      { id: 3, name: 'Initech', region: 'East', revenue: 6700, active: false },
      { id: 4, name: 'Umbrella Co', region: 'West', revenue: 15200, active: true },
      { id: 5, name: 'Stark Industries', region: 'North', revenue: 22000, active: true },
    ],
  },
  2: {
    users_cube: [
      { id: 1, name: 'Alice', role: 'admin', signups: 45, last_login: '2025-03-10' },
      { id: 2, name: 'Bob', role: 'user', signups: 12, last_login: '2025-03-12' },
      { id: 3, name: 'Carol', role: 'user', signups: 28, last_login: '2025-03-14' },
      { id: 4, name: 'Dave', role: 'manager', signups: 8, last_login: '2025-03-11' },
    ],
    sessions_cube: [
      { date: '2025-03-01', page_views: 1200, avg_duration: 4.5, bounce_rate: 0.32 },
      { date: '2025-03-02', page_views: 1450, avg_duration: 5.1, bounce_rate: 0.28 },
      { date: '2025-03-03', page_views: 980, avg_duration: 3.8, bounce_rate: 0.41 },
      { date: '2025-03-04', page_views: 1600, avg_duration: 5.5, bounce_rate: 0.25 },
      { date: '2025-03-05', page_views: 1320, avg_duration: 4.9, bounce_rate: 0.30 },
    ],
  },
  3: {
    employees_cube: [
      { id: 1, name: 'John', department: 'Engineering', salary: 95000, tenure_years: 3 },
      { id: 2, name: 'Jane', department: 'Marketing', salary: 78000, tenure_years: 5 },
      { id: 3, name: 'Mike', department: 'Engineering', salary: 105000, tenure_years: 7 },
      { id: 4, name: 'Sara', department: 'HR', salary: 72000, tenure_years: 2 },
      { id: 5, name: 'Tom', department: 'Sales', salary: 88000, tenure_years: 4 },
      { id: 6, name: 'Lisa', department: 'Engineering', salary: 112000, tenure_years: 8 },
    ],
    departments_cube: [
      { name: 'Engineering', headcount: 45, budget: 2500000, satisfaction: 4.2 },
      { name: 'Marketing', headcount: 18, budget: 900000, satisfaction: 3.8 },
      { name: 'HR', headcount: 8, budget: 400000, satisfaction: 4.0 },
      { name: 'Sales', headcount: 22, budget: 1200000, satisfaction: 3.5 },
    ],
  },
};

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /package/v1/search/:query — flapi search
  const searchMatch = url.pathname.match(/^\/package\/v1\/search\/(.+)$/);
  if (searchMatch && req.method === 'GET') {
    const query = decodeURIComponent(searchMatch[1]).toLowerCase();
    const results = packages.filter((p) => p.Name.toLowerCase().includes(query));
    res.writeHead(200);
    res.end(JSON.stringify(results));
    return;
  }

  // POST /package/:packageId — flapi run
  const runMatch = url.pathname.match(/^\/package\/([^/]+)$/);
  if (runMatch && req.method === 'POST') {
    const packageId = runMatch[1];
    const data = packageData[packageId];
    if (data) {
      res.writeHead(200);
      res.end(JSON.stringify({ results: data }));
    } else {
      // Return empty results for unknown packages
      res.writeHead(200);
      res.end(JSON.stringify({ results: {} }));
    }
    return;
  }

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, mock: true }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Flapi mock server running on http://localhost:${PORT}`);
  console.log(`Available packages: ${packages.filter((p) => p.Type === 'Package').map((p) => `${p.Id}: ${p.Name}`).join(', ')}`);
});

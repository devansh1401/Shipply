const http = require('http');
const httpProxy = require('http-proxy');

const servers = [
  { host: 'localhost', port: 3001 },
  { host: 'localhost', port: 3002 },
  { host: 'localhost', port: 3003 },
  { host: 'localhost', port: 3004 },
];

let current = 0;

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  const target = servers[current];
  current = (current + 1) % servers.length;

  proxy.web(req, res, { target: `http://${target.host}:${target.port}` });
});

server.listen(8080, () => {
  console.log('Load balancer running on port 8080');
});

const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

const db = require('./server/db.json');
const router = jsonServer.router(db);

server.use(middlewares);

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

server.use(
  jsonServer.rewriter({
    '/api/*': '/$1',
  }),
);

server.use(router);

module.exports = server;

// Both URLs use one Next.js server and database; no second dev build or lock.
import http from "node:http";
import net from "node:net";

const target = { hostname: "127.0.0.1", port: 3000 };
const server = http.createServer((request, response) => {
  const upstream = http.request(
    {
      ...target,
      method: request.method,
      path: request.url,
      headers: request.headers,
    },
    (result) => {
      response.writeHead(result.statusCode || 502, result.headers);
      result.pipe(response);
    },
  );
  upstream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(503, { "Content-Type": "text/html; charset=utf-8" });
      response.end(
        "<!doctype html><title>PPWM is starting</title><h1>PPWM is not running yet.</h1><p>Start the app with npm run local, then reload this page.</p>",
      );
    } else response.destroy();
  });
  request.on("aborted", () => upstream.destroy());
  response.on("close", () => upstream.destroy());
  request.pipe(upstream);
});

// Forward Next.js hot-reload WebSockets as well as normal streaming requests.
server.on("upgrade", (request, socket, head) => {
  const upstream = net.connect(target.port, target.hostname, () => {
    const headers = request.rawHeaders;
    let message = `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`;
    for (let index = 0; index < headers.length; index += 2)
      message += `${headers[index]}: ${headers[index + 1]}\r\n`;
    upstream.write(`${message}\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
  socket.on("close", () => upstream.destroy());
});
server.on("error", (error) => {
  console.error(`Could not open port 7000: ${error.message}`);
  process.exitCode = 1;
});
server.listen(7000, "127.0.0.1", () =>
  console.log("PPWM port 7000 forwards to http://localhost:3000"),
);

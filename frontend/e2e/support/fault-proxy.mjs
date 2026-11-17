// Test-only HTTP proxy that sits between the Next.js server and Laravel.
//
// Laravel is called from the Next server, not the browser, so Playwright
// can't intercept those requests. Tests point Next's API_URL at this proxy
// and switch faults on and off through its control endpoint:
//
//   PUT    /__faults   [{ method?, path, delayMs?, status? }]   (path is a regex)
//   DELETE /__faults
//
// status 0 drops the connection, simulating Laravel being unreachable.

import http from "node:http"

const port = Number(process.env.FAULT_PROXY_PORT ?? 8002)
const target = new URL(process.env.FAULT_PROXY_TARGET ?? "http://127.0.0.1:8001")
let faults = []

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks)))
  })
}

http
  .createServer(async (req, res) => {
    const body = await readBody(req)

    if (req.url === "/__faults") {
      faults = req.method === "PUT" ? JSON.parse(body.toString() || "[]") : []
      res.writeHead(204).end()
      return
    }

    const fault = faults.find((f) => (!f.method || f.method === req.method) && new RegExp(f.path).test(req.url))

    if (fault?.delayMs) await sleep(fault.delayMs)

    if (fault && fault.status === 0) {
      req.socket.destroy()
      return
    }

    if (fault?.status) {
      res.writeHead(fault.status, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "Injected failure" }))
      return
    }

    const upstream = http.request(
      new URL(req.url, target),
      { method: req.method, headers: { ...req.headers, host: target.host } },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
        upstreamRes.pipe(res)
      },
    )
    upstream.on("error", () => res.writeHead(502).end())
    upstream.end(body)
  })
  .listen(port, "127.0.0.1", () => console.log(`fault proxy :${port} → ${target.origin}`))

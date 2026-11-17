/** Ports and URLs shared by playwright.config.ts and the specs. */
export const API_PORT = 8001
export const PROXY_PORT = 8002
export const WEB_PORT = 3001

/** Laravel directly — for arranging data without going through Next. */
export const API_URL = `http://127.0.0.1:${API_PORT}/api`
/** The fault-injection proxy that Next talks to. */
export const FAULT_PROXY_URL = `http://127.0.0.1:${PROXY_PORT}`

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

export default defineConfig(() => {
  const proxyTarget = process.env.DEV_PROXY_TARGET
  const proxy = proxyTarget
    ? Object.fromEntries(
        ['/auth', '/stats', '/leaderboards', '/health', '/wallet', '/payments', '/socket.io'].map(path => [
          path,
          {
            target: proxyTarget,
            changeOrigin: true,
            secure: true,
            ws: path === '/socket.io',
            configure(proxyServer) {
              proxyServer.on('proxyReq', proxyRequest => proxyRequest.setHeader('Origin', proxyTarget))
              proxyServer.on('proxyReqWs', proxyRequest => proxyRequest.setHeader('Origin', proxyTarget))
            },
          } satisfies ProxyOptions,
        ]),
      )
    : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
  }
})

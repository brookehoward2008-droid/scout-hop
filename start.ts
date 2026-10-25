import { createApp } from './server.ts';

async function startServer() {
  const port = Number(process.env.PORT || 3000);
  const app = await createApp({ serveFrontend: true });
  const server = app.listen(port, '0.0.0.0', () => {
    const address = server.address();
    const listeningPort = address && typeof address !== 'string' ? address.port : port;
    console.log(`Block Explorer server running on http://0.0.0.0:${listeningPort}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exitCode = 1;
});

import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('App root element was not found.');
}

const appRoot = rootElement;

async function bootstrap() {
  try {
    const [{ StrictMode }, { createRoot }, { default: App }] = await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('./App.tsx'),
    ]);

    createRoot(appRoot).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to bootstrap the app:', error);

    const message = error instanceof Error ? error.message : 'Unknown startup error';

    appRoot.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;padding:24px;font-family:Inter,sans-serif;">
        <div style="max-width:640px;border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:24px;background:rgba(255,255,255,0.04);">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Startup Error</p>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;">The app could not start.</h1>
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.72);">A runtime error happened before the first screen rendered.</p>
          <pre style="margin:0;white-space:pre-wrap;word-break:break-word;color:#fca5a5;background:rgba(0,0,0,0.4);padding:16px;border-radius:16px;">${message}</pre>
        </div>
      </div>
    `;
  }
}

void bootstrap();

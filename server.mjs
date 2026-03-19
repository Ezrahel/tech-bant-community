import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import next from 'next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const indexFile = path.join(distDir, 'index.html');
const port = Number(process.env.PORT || 3000);

const mimeTypes = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'application/javascript; charset=utf-8'],
    ['.mjs', 'application/javascript; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.svg', 'image/svg+xml'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.webp', 'image/webp'],
    ['.gif', 'image/gif'],
    ['.ico', 'image/x-icon'],
    ['.woff', 'font/woff'],
    ['.woff2', 'font/woff2'],
    ['.txt', 'text/plain; charset=utf-8'],
]);

async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

function sendFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', mimeTypes.get(ext) || 'application/octet-stream');
    createReadStream(filePath).pipe(res);
}

const app = next({ dev: false, dir: rootDir });
const handle = app.getRequestHandler();

await app.prepare();

createServer(async (req, res) => {
    try {
        const requestURL = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = decodeURIComponent(requestURL.pathname);

        if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
            await handle(req, res);
            return;
        }

        const requestedPath = pathname === '/'
            ? indexFile
            : path.join(distDir, pathname.replace(/^\/+/, ''));

        const normalizedPath = path.normalize(requestedPath);
        if (normalizedPath.startsWith(distDir) && await fileExists(normalizedPath)) {
            const fileStats = await stat(normalizedPath);
            if (fileStats.isFile()) {
                sendFile(res, normalizedPath);
                return;
            }
        }

        if (await fileExists(indexFile)) {
            sendFile(res, indexFile);
            return;
        }

        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Frontend build output not found. Run `npm run build` first.');
    } catch (error) {
        console.error('Production server error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Internal server error');
    }
}).listen(port, () => {
    console.log(`Tech Bant Community running on http://localhost:${port}`);
});

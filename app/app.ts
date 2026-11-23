import express from 'express';
import { viteNodeApp as coreApp } from '@workadventure/map-starter-kit-core/dist/server.js';

// Local change to the upstream entry point (keep it when merging upstream):
// map-starter-kit-core 1.1.5 serves maps with `max-age=1d` and tilesets with `max-age=7d`,
// so a map saved in Tiled doesn't show up on refresh. This dev server is only used locally,
// so force `no-cache`: the browser still revalidates with ETag/Last-Modified (fast 304s).
const app = express();
app.use((_req, res, next) => {
    const setHeader = res.setHeader.bind(res);
    res.setHeader = ((name: string, value: number | string | readonly string[]) =>
        setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-cache' : value)) as typeof res.setHeader;
    next();
});
app.use(coreApp);

export const viteNodeApp = app;

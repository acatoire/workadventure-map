/// <reference types="@workadventure/iframe-api-typings" />
/// <reference types="vite/client" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.log('Scripting API ready');
    console.log('Player tags: ',WA.player.tags)

    // Team clocks (Manila, New York, Paris) on the office wall, always visible.
    if (WA.room.mapURL.includes('office.tmj')) {
        WA.room.website.create({
            name: 'teamClocks',
            // The build copies public/ to the root of dist/. The dev server serves it under /public
            // and bundles this script without Vite, so import.meta.env is undefined there.
            url: new URL(import.meta.env?.PROD ? 'clocks.html' : 'public/clocks.html', WA.room.mapURL).toString(),
            position: { x: 406, y: 36, width: 144, height: 48 },
            origin: 'map',
            scale: 0.5,
            visible: true,
            allowApi: false,
        });
    }

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

export {};

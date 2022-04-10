
import { events } from "bdsx/event";

console.log('[HSChest] allocated');

events.serverOpen.on(()=>{
    console.log('[HSChest] launching');
});

events.serverClose.on(()=>{
    console.log('[HSChest] closed');
});


import { events } from "bdsx/event";

console.log('[plugin:Chestui] allocated');

events.serverOpen.on(()=>{
    console.log('[plugin:Chestui] launching');
});

events.serverClose.on(()=>{
    console.log('[plugin:Chestui] closed');
});


/*
    __  _______ ________              __
   / / / / ___// ____/ /_  ___  _____/ /_
  / /_/ /\__ \/ /   / __ \/ _ \/ ___/ __/
 / __  /___/ / /___/ / / /  __(__  ) /_
/_/ /_//____/\____/_/ /_/\___/____/\__/

Credit: Rjlintkh (https://discord.com/channels/646456965983240212/814768666741964820/962398805167341618)

*/

import { events } from "bdsx/event";

console.log("[HSChest] allocated");

events.serverOpen.on(() => {
    console.log("[HSChest] launching");
});

events.serverClose.on(() => {
    console.log("[HSChest] closed");
});

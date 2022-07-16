
# chestui Plugin
The plugin for bdsx


# Example
```ts
import { HSDoubleChest, HSMenu } from "@bdsx/hsmenu";
import { ItemStack } from "bdsx/bds/inventory";
import { ServerPlayer } from "bdsx/bds/player";
import { events } from "bdsx/event";

events.playerJump.on((ev) => {
    // will be destructed by the library
    const diamond = ItemStack.constructWith("minecraft:diamond");
    diamond.setCustomName("§bDiamond");
    diamond.setCustomLore(["my precious"]);

    const menu = new HSMenu(
        ev.player as ServerPlayer,
        new HSDoubleChest(),
        {
            31: diamond,
        },
        function (menu, data) {
            if (data.slotInfo.openContainerNetId !== 7) return;
            menu.entity.sendMessage("You can't take my precious!");
            menu.close();
        },
    );
    menu.open();
});
```

# License
MIT

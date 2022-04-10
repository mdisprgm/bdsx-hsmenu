import { ItemStack } from "bdsx/bds/inventory";
import { InventorySlotPacket } from "bdsx/bds/packets";
import { pdb } from "bdsx/core";
import { uint32_t, uint8_t } from "bdsx/nativetype";
import { ProcHacker } from "bdsx/prochacker";

const hacker = new ProcHacker({
    ...pdb.getList("hacker.ini", {}, ["??0InventorySlotPacket@@QEAA@W4ContainerID@@IAEBVItemStack@@@Z"]),
});

export const InventorySlotPacket$InventorySlotPacket = hacker.js(
    "??0InventorySlotPacket@@QEAA@W4ContainerID@@IAEBVItemStack@@@Z",
    InventorySlotPacket,
    null,
    InventorySlotPacket,
    uint8_t,
    uint32_t,
    ItemStack,
);

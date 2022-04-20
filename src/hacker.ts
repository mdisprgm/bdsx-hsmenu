import { BlockPos } from "bdsx/bds/blockpos";
import { ItemStack } from "bdsx/bds/inventory";
import { InventorySlotPacket, UpdateBlockPacket } from "bdsx/bds/packets";
import { pdb } from "bdsx/core";
import { uint32_t, uint8_t } from "bdsx/nativetype";
import { ProcHacker } from "bdsx/prochacker";

const hacker = new ProcHacker({
    ...pdb.getList("hacker.ini", {}, ["??0InventorySlotPacket@@QEAA@W4ContainerID@@IAEBVItemStack@@@Z", "??0UpdateBlockPacket@@QEAA@AEBVBlockPos@@IIE@Z"]),
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

export const UpdateBlockPacket$UpdateBlockPacket = hacker.js(
    "??0UpdateBlockPacket@@QEAA@AEBVBlockPos@@IIE@Z",
    UpdateBlockPacket,
    null,
    UpdateBlockPacket,
    BlockPos,
    uint32_t,
    uint32_t,
    uint8_t,
);

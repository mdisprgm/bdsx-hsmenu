import { Block } from "bdsx/bds/block";
import { BlockPos } from "bdsx/bds/blockpos";
import { ContainerType, ItemStack } from "bdsx/bds/inventory";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import {
    ContainerClosePacket,
    ContainerOpenPacket,
    InventorySlotPacket,
    ItemStackRequestActionTransferBase,
    ItemStackRequestActionType,
    ItemStackRequestPacket,
    UpdateBlockPacket,
} from "bdsx/bds/packets";
import { ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { PlayerLeftEvent } from "bdsx/event_impl/entityevent";
import { bedrockServer } from "bdsx/launcher";
import { InventorySlotPacket$InventorySlotPacket } from "./hacker";

export class HSChest {
    static delay = 0;

    private block = Block.create("minecraft:chest")!;
    private ni: NetworkIdentifier;
    private blockPos: BlockPos;
    private id: number;
    private blockId: number;

    protected itemStackRequestCb: (pk: ItemStackRequestPacket, ni: NetworkIdentifier) => CANCEL | void;
    protected containerCloseCb: (pk: ContainerClosePacket, ni: NetworkIdentifier) => CANCEL | void;
    protected disonnectCb: (event: PlayerLeftEvent) => void;

    protected constructor(private entity: ServerPlayer, public slots: Record<number, ItemStack>, callback: (this: HSChest, slot: number, item: ItemStack) => void) {
        this.ni = entity.getNetworkIdentifier();
        this.blockPos = BlockPos.create(entity.getFeetPos());
        this.blockPos.y += 2;
        if (this.blockPos.x < 0) this.blockPos.x--;
        if (this.blockPos.z < 0) this.blockPos.z--;
        this.blockPos.y += 1;
        this.id = entity.nextContainerCounter();
        this.placeChest();

        bedrockServer.serverInstance.nextTick().then(async () => {
            await new Promise((resolve) => setTimeout(resolve, HSChest.delay));
            this.openChest();
            for (const [slot, item] of Object.entries(slots)) {
                this.setItem(+slot, item);
            }
        });

        events.packetBefore(MinecraftPacketIds.ItemStackRequest).on(
            (this.itemStackRequestCb = (pk, ni) => {
                if (ni.equals(this.ni)) {
                    const data = pk.getRequestBatch().data.get(0);
                    const action = data?.actions.get(0);
                    if (action?.type === ItemStackRequestActionType.Take && action instanceof ItemStackRequestActionTransferBase) {
                        const slotInfo = action.getSrc();
                        const slot = slotInfo.slot;
                        callback.call(this, slot, this.slots[slot]);
                    }
                }
            }),
        );
        events.packetBefore(MinecraftPacketIds.ContainerClose).on(
            (this.containerCloseCb = (pk, ni) => {
                if (ni.equals(this.ni)) this.destruct();
            }),
        );
        events.playerLeft.on((event) => {
            this.disonnectCb = (ev) => {
                if (event.player.getNetworkIdentifier().equals(this.ni)) this.destruct();
            };
        });
    }

    private destruct(): void {
        for (let [slot, item] of Object.entries(this.slots)) {
            item.destruct();
        }
        this.destroyChest();
        events.packetBefore(MinecraftPacketIds.ItemStackRequest).remove(this.itemStackRequestCb);
        events.packetBefore(MinecraftPacketIds.ContainerClose).remove(this.containerCloseCb);
        events.playerLeft.remove(this.disonnectCb);
    }

    private placeChest(): void {
        const region = this.entity.getRegion();
        this.blockId = region.getBlock(this.blockPos).getRuntimeId()!;

        const pk = UpdateBlockPacket.allocate();
        pk.blockPos.set(this.blockPos);
        pk.dataLayerId = 0;
        pk.flags = UpdateBlockPacket.Flags.NoGraphic;
        pk.blockRuntimeId = this.block.getRuntimeId();
        pk.sendTo(this.ni);
        pk.dispose();
    }

    private destroyChest(): void {
        const pk = UpdateBlockPacket.allocate();
        pk.blockPos.set(this.blockPos);
        pk.dataLayerId = 0;
        pk.flags = UpdateBlockPacket.Flags.NoGraphic;
        pk.blockRuntimeId = this.blockId;
        pk.sendTo(this.ni);
        pk.dispose();

        const region = this.entity.getRegion();
        const blockEntity = region.getBlockEntity(this.blockPos);
        if (blockEntity) {
            blockEntity.setChanged();
            blockEntity.updateClientSide(this.entity);
        }
    }

    private openChest(): void {
        const pk = ContainerOpenPacket.allocate();
        pk.containerId = this.id;
        pk.type = ContainerType.Container;
        pk.pos.set(this.blockPos);
        pk.sendTo(this.ni);
        pk.dispose();
    }
    close() {
        this.destruct();
    }
    setItem(slot: number, item: ItemStack) {
        if (!this.slots[slot]?.sameItem(item)) this.slots[slot].destruct();
        this.slots[slot] = item;
        const pk = new InventorySlotPacket(true);
        InventorySlotPacket$InventorySlotPacket(pk, this.id, slot, item);
        pk.sendTo(this.ni);
        pk.destruct();
    }

    static openTo(player: ServerPlayer, slots: Record<number, ItemStack>, callback: (this: HSChest, slot: number, item: ItemStack) => void) {
        new HSChest(player, slots, callback);
    }
}

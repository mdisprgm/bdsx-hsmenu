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
} from "bdsx/bds/packets";
import { ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { PlayerLeftEvent } from "bdsx/event_impl/entityevent";
import { bedrockServer } from "bdsx/launcher";
import { InventorySlotPacket$InventorySlotPacket } from "./hacker";
import { HSBlock } from "./hsblock";

type ContainerItems = Record<number, ItemStack>;

export class HSMenu {
    private static initInventorySlotPacket(packet: InventorySlotPacket, containerId: number, slot: number, ItemStack: ItemStack): void {
        InventorySlotPacket$InventorySlotPacket(packet, containerId, slot, ItemStack);
    }
    private hasOpen: boolean = false;
    private assertValidSize(slot: number): void {
        if (slot !== (slot | 0)) throw new Error("slot number must be an integer.");
        if (slot > this.size) throw new Error("slot number must be less than or equal to the size of the menu.");
    }
    private asserMenuNotOpen(): void {
        if (!this.hasOpen) throw new Error("Menu is not open for the player.");
    }
    private assertDefault(): void {
        this.asserMenuNotOpen();
    }
    /**
     *
     * @param slot slot n umber
     */
    setItem(slot: number, item: ItemStack): void {
        this.slots[slot] = item;
    }
    /**
     *
     * @param slot slot n umber
     * @returns DO NOT DESTRUCT. THEY MUST BE DESTRUTCTED BY LIBRARY.
     */
    getItem(slot: number): ItemStack {
        this.assertValidSize(slot);

        return this.slots[slot];
    }
    sendItem(slot: number, item: ItemStack): void {
        this.assertDefault();
        this.sendItem(slot, item);
        this.sendInventory();
    }
    constructor(player: ServerPlayer, block: HSBlock, slots: ContainerItems = {}, callback?: (this: HSMenu, slot: number, item: ItemStack) => void) {
        this.entity = player;
        this.netId = player.getNetworkIdentifier();
        this.block = block;
        this.size = this.block.size;

        this.blockPos.set(player.getFeetPos());
        this.blockPos.y += 4;
        if (this.blockPos.x < 0) this.blockPos.x--;
        if (this.blockPos.z < 0) this.blockPos.z--;

        this.slots = slots;

        this.containerId = this.entity.nextContainerCounter();

        // openChest
        bedrockServer.serverInstance.nextTick().then(async () => {
            // Sleep
            this.open();
            for (const [slot, item] of Object.entries(slots)) {
                this.setItem(+slot, item);
            }
            this.sendInventory();
        });

        events.packetBefore(MinecraftPacketIds.ItemStackRequest).on(
            (this.onItemStackRequest = (pk, ni) => {
                if (ni.equals(this.netId)) {
                    const data = pk.getRequestBatch().data.get(0);
                    const action = data?.actions.get(0);
                    if (action?.type === ItemStackRequestActionType.Take && action instanceof ItemStackRequestActionTransferBase) {
                        const slotInfo = action.getSrc();
                        const slot = slotInfo.slot;
                        if (callback) callback.call(this, slot, this.slots[slot]);
                    }
                }
            }),
        );
        events.packetBefore(MinecraftPacketIds.ContainerClose).on(
            (this.onContainerClose = (pk, ni) => {
                if (ni.equals(this.netId)) this.close();
            }),
        );
        events.playerLeft.on((event) => {
            this.onDisconnect = (ev) => {
                if (event.player.getNetworkIdentifier().equals(this.netId)) this.destruct();
            };
        });
    }

    private openChest(): void {
        const pk = ContainerOpenPacket.allocate();
        pk.containerId = this.containerId;
        pk.type = HSBlock.TypeToContainerType[this.block.type] ?? ContainerType.Container;
        pk.pos.set(this.blockPos);
        this.entity.sendPacket(pk);
        pk.dispose();
    }
    private placeChest(): void {
        this.block.place(this.entity);
    }
    private destroyChest(): void {
        this.assertDefault();
        this.block.destroy(this.entity);
    }
    private destruct(): void {
        this.assertDefault();
        for (let [slot, item] of Object.entries(this.slots)) {
            item.destruct();
        }
        this.destroyChest();
        events.packetBefore(MinecraftPacketIds.ItemStackRequest).remove(this.onItemStackRequest);
        events.packetBefore(MinecraftPacketIds.ContainerClose).remove(this.onContainerClose);
        events.playerLeft.remove(this.onDisconnect);
    }
    private open(): void {
        this.hasOpen = true;
        this.placeChest();
        this.openChest();
    }
    close(): void {
        this.assertDefault();

        this.destruct();
    }
    sendInventory(): void {
        this.assertDefault();
        for (const [slot_, item] of Object.entries(this.slots)) {
            const slot = +slot_;
            if (!this.slots[slot]?.sameItem(item)) this.slots[slot].destruct();
            const pk = new InventorySlotPacket(true);
            HSMenu.initInventorySlotPacket(pk, this.containerId, slot, item);
            this.entity.sendPacket(pk);
            pk.destruct();
        }
    }

    private block: HSBlock;
    private blockPos: BlockPos = BlockPos.create(0, 0, 0);
    private containerId: number;
    private entity: ServerPlayer;
    private slots: Record<number, ItemStack>;
    private netId: NetworkIdentifier;
    private size: HSBlock.size;

    protected onItemStackRequest: (pk: ItemStackRequestPacket, ni: NetworkIdentifier) => CANCEL | void;
    protected onContainerClose: (pk: ContainerClosePacket, ni: NetworkIdentifier) => CANCEL | void;
    protected onDisconnect: (event: PlayerLeftEvent) => void;
}

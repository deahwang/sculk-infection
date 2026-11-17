import { world, system, EquipmentSlot } from "@minecraft/server";

const BOOTS_ID = "sculk:sculk_boots";
const RESISTANCE_TAG = "sculk_boots_equipped";

system.runInterval(() => {
    for (const player of world.getPlayers()) {

        const equippable = player.getComponent("minecraft:equippable");
        if (!equippable) continue;

        const boots = equippable.getEquipment(EquipmentSlot.Feet);

        const wearingBoots = boots?.typeId === BOOTS_ID;
        const alreadyActive = player.hasTag(RESISTANCE_TAG);

        if (wearingBoots) {

            if (!alreadyActive) {
                player.addTag(RESISTANCE_TAG);
            }

            // 추가 체력 효과
            player.addEffect("health_boost", 40, {
                amplifier: 0,
                showParticles: false
            });

        } else if (alreadyActive) {

            player.removeTag(RESISTANCE_TAG);
            player.removeEffect("health_boost");

        }
    }
}, 20);

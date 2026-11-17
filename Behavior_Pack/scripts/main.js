import { world, system, EquipmentSlot } from "@minecraft/server";

const ARMOR = [
    {
        id: "sculk:sculk_helmet",
        slot: EquipmentSlot.Head,
        hp: 2
    },
    {
        id: "sculk:sculk_chestplate",
        slot: EquipmentSlot.Chest,
        hp: 4
    },
    {
        id: "sculk:sculk_leggings",
        slot: EquipmentSlot.Legs,
        hp: 2
    },
    {
        id: "sculk:sculk_boots",
        slot: EquipmentSlot.Feet,
        hp: 2
    }
];

const RESISTANCE_TAGS = [
    "sculk_infection_resistance_5",
    "sculk_infection_resistance_10",
    "sculk_infection_resistance_15",
    "sculk_infection_resistance_20"
];

system.runInterval(() => {
    for (const player of world.getPlayers()) {

        const equipment = player.getComponent("minecraft:equippable");
        if (!equipment) continue;

        let bonusHP = 0;
        let resistance = 0;
        let wearingBoots = false;

        // 방어구 확인
        for (const armor of ARMOR) {
            const item = equipment.getEquipment(armor.slot);

            if (item?.typeId === armor.id) {
                bonusHP += armor.hp;
                resistance += 5;

                if (armor.slot === EquipmentSlot.Feet) {
                    wearingBoots = true;
                }
            }
        }

        // 감염 저항 태그 갱신
        const resistanceTag = resistance > 0
            ? `sculk_infection_resistance_${resistance}`
            : null;

        for (const tag of RESISTANCE_TAGS) {
            if (tag !== resistanceTag && player.hasTag(tag)) {
                player.removeTag(tag);
            }
        }

        if (resistanceTag && !player.hasTag(resistanceTag)) {
            player.addTag(resistanceTag);
        }

        // 기존 부츠 태그 유지
        if (wearingBoots) {
            if (!player.hasTag("sculk_boots_equipped")) {
                player.addTag("sculk_boots_equipped");
            }
        } else {
            if (player.hasTag("sculk_boots_equipped")) {
                player.removeTag("sculk_boots_equipped");
            }
        }

        // 추가 체력
        if (bonusHP > 0) {
            const amplifier = Math.ceil(bonusHP / 4) - 1;

            player.addEffect("health_boost", 40, {
                amplifier: amplifier,
                showParticles: false
            });
        } else {
            player.removeEffect("health_boost");
        }
    }
}, 20);

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
const INFECTED_MOB_IDS = [
    "sculk:infected_zombie",
    "sculk:infected_skeleton",
    "sculk:infected_spider",
    "sculk:infected_enderman",
    "sculk:infected_creeper"
];

// 감염 판정
world.afterEvents.entityHurt.subscribe((event) => {

    const player = event.hurtEntity;

    if (player.typeId !== "minecraft:player") return;
    if (player.hasTag("sculk_infected")) return;

    const damageSource = event.damageSource;

    const attackers = [];

    if (damageSource.damagingEntity) {
        attackers.push(damageSource.damagingEntity);
    }

    // 화살 등 투사체의 주인 확인
    if (damageSource.damagingProjectile) {
        try {
            const projectile = damageSource.damagingProjectile;
            const owner = projectile.getComponent("minecraft:projectile")?.owner;

            if (owner) attackers.push(owner);
        } catch (e) {
            // 투사체 정보가 없으면 건너뜀
        }
    }

    // 감염 몹인지 확인
    const infectedAttacker = attackers.some(entity =>
        INFECTED_MOB_IDS.includes(entity.typeId)
    );

    if (!infectedAttacker) return;

    // 방어구 저항 계산
    const equipment = player.getComponent("minecraft:equippable");

    let resistance = 0;

    if (equipment) {
        for (const armor of ARMOR) {
            const item = equipment.getEquipment(armor.slot);

            if (item?.typeId === armor.id) {
                resistance += 5;
            }
        }
    }

    // 기본 감염 확률 30%
    const infectionChance = 0.30 * (1 - resistance / 100);

    if (Math.random() < infectionChance) {
        player.addTag("sculk_infected");

        player.sendMessage(
            "§5[스컬크 감염] 감염되었습니다!"
        );
    }
});
const infectionStartedAt = new Map();

system.runInterval(() => {
    for (const player of world.getPlayers()) {

        if (!player.hasTag("sculk_infected")) {
            infectionStartedAt.delete(player.id);
            continue;
        }

        const now = Date.now();

        if (!infectionStartedAt.has(player.id)) {
            infectionStartedAt.set(player.id, now);
        }

        const elapsed = (now - infectionStartedAt.get(player.id)) / 1000;

        let stage = 0;

        if (elapsed >= 180) {
            stage = 3;
        } else if (elapsed >= 90) {
            stage = 2;
        } else if (elapsed >= 30) {
            stage = 1;
        }

        if (stage === 0) continue;

        const stageTag = `sculk_infection_stage_${stage}`;

        for (let i = 1; i <= 3; i++) {
            const tag = `sculk_infection_stage_${i}`;

            if (i !== stage && player.hasTag(tag)) {
                player.removeTag(tag);
            }
        }

        if (!player.hasTag(stageTag)) {
            player.addTag(stageTag);
            player.sendMessage(`§5[스컬크 감염] ${stage}단계에 도달했습니다!`);
        }

        player.addEffect("weakness", 40, {
            amplifier: 0,
            showParticles: false
        });

        if (stage >= 2) {
            player.addEffect("slowness", 40, {
                amplifier: 0,
                showParticles: false
            });
        }

        if (stage >= 3) {
            player.addEffect("mining_fatigue", 40, {
                amplifier: 0,
                showParticles: false
            });
        }

    }
}, 20);

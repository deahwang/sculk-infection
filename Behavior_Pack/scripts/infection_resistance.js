import { world } from "@minecraft/server";

const PROPERTY = "sculk_infection_resistance";

const MAX_RESISTANCE = 100;
const MIN_RESISTANCE = 0;

// 감염 저항 초기화
function initializeResistance(player) {
    const resistance = player.getDynamicProperty(PROPERTY);

    if (resistance === undefined) {
        player.setDynamicProperty(PROPERTY, 0);
    }
}

// 감염 저항 확인
export function getResistance(player) {
    initializeResistance(player);

    return player.getDynamicProperty(PROPERTY);
}

// 감염 저항 설정
export function setResistance(player, amount) {
    const value = Math.max(
        MIN_RESISTANCE,
        Math.min(MAX_RESISTANCE, amount)
    );

    player.setDynamicProperty(PROPERTY, value);
}

// 감염 저항 증가
export function addResistance(player, amount) {
    const current = getResistance(player);

    setResistance(player, current + amount);
}

// 감염 저항 감소
export function removeResistance(player, amount) {
    const current = getResistance(player);

    setResistance(player, current - amount);
}

// 감염 피해 감소 계산
export function reduceInfection(player, infectionAmount) {
    const resistance = getResistance(player);

    const reducedAmount = infectionAmount *
        (1 - resistance / 100);

    return Math.max(0, Math.floor(reducedAmount));
}

// 플레이어 접속 시 초기화
world.afterEvents.playerSpawn.subscribe((event) => {
    initializeResistance(event.player);
});

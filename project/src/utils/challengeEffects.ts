    import { Card } from '../types/game';

    export function getChallengeEffects(card: Card) {
    switch (card.id) {
        case 'beer-havf':
        return {
            winnerEffect: {
            type: 'heal',
            value: 5.0
            },
            loserEffect: {
            type: 'damage',
            value: 5.0
            }
        };
        case 'big-muscles':
        return {
            winnerEffect: {
            type: 'manaRefill',
            value: 0
            },
            loserEffect: {
            type: 'manaBurn',
            value: 0
            }
        };
        default:
        return null;
    }
    }

    export function validateChallengeOutcome(
    winnerId: string,
    loserId: string,
    currentPlayerId: string
    ): boolean {
    if (!winnerId || !loserId) return false;
    if (winnerId === loserId) return false;
    return true;
    }
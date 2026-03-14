import { useState } from 'react';
import { GameMode, Party } from '../../../types/game';
import { Sword, Heart, Zap, Wine, Target, Sparkles, ChevronDown, ChevronUp, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface AttackBannerProps {
    lastAction: Party['lastAction'];
    players: Party['players'];
    gameMode?: GameMode;
    pendingCanCupFollowUp?: Party['pendingCanCupFollowUp'];
}

export function AttackBanner({ lastAction, players, gameMode = 'afterski', pendingCanCupFollowUp }: AttackBannerProps) {
    const [expanded, setExpanded] = useState(false);

    if (!lastAction) return null;

    const actionSegments = lastAction.segments?.length ? lastAction.segments : [lastAction];
    const primaryAction = actionSegments[0] ?? lastAction;
    const attacker = players.find((player) => player.id === primaryAction.playerId);
    const target = primaryAction.targetId ? players.find((player) => player.id === primaryAction.targetId) : null;
    if (!attacker) return null;

    const isSelf = primaryAction.playerId === primaryAction.targetId;
    const affectedIds = primaryAction.affectedPlayerIds || [];

    const getActionVerb = (type: string) => {
        switch (type) {
            case 'damage': case 'aoeDamage': return 'attackerade';
            case 'heal': case 'manaRefill': case 'potionBuff': return 'healade';
            case 'manaDrain': case 'manaBurn': return 'draenerade';
            case 'challenge': return 'utmanade';
            case 'forceDrink': return 'tvingade att dricka';
            case 'drunkTimer': return 'justerade drunk-tid foer';
            case 'drunkTimerShift': return 'flyttade drunk-tid till';
            case 'drunkestTimer': return 'straffade den mest dragna med';
            case 'leastDrunkForceDrink': return 'tvingade den minst dragna att dricka';
            case 'canCupSip': return 'tvingade klunkar pa';
            case 'canCupAoESip': return 'skalade med';
            case 'canCupWater': return 'tog vattenpaus';
            case 'canCupBathroomBreak': return 'tog en toapaus med';
            case 'canCupDeflect': return 'tog vattenpaus';
            case 'canCupTopUp': return 'fyllde pa med';
            case 'canCupDoubleTrouble': return 'dubbelsmallde';
            case 'canCupBottenUpp': return 'bottnade upp';
            case 'canCupSwap': return 'bytte burk med';
            case 'canCupVampire': return 'stal klunkar fran';
            case 'canCupReflect': return 'studsa klunkar till';
            case 'canCupHolyAlliance': return 'bildade pakt med';
            case 'canCupRelaySip': return 'spred klunkar via';
            case 'canCupRockBottom': return 'drog ner';
            case 'canCupRussianRoulette': return 'snurrade flaskan pa';
            case 'canCupLegendaryHeist': return 'kapade legendary fran';
            case 'canCupPenaltyDrink': return 'skalade med';
            case 'canCupTaxSober': return 'straffade the sober one';
            default: return 'spelade';
        }
    };

    const getActionIcon = (type: string) => {
        const cls = 'w-3.5 h-3.5';
        switch (type) {
            case 'damage': case 'aoeDamage': return <Sword className={clsx(cls, 'text-red-400')} />;
            case 'heal': case 'manaRefill': case 'potionBuff': return <Heart className={clsx(cls, 'text-green-400')} />;
            case 'manaDrain': case 'manaBurn': return <Zap className={clsx(cls, 'text-yellow-400')} />;
            case 'challenge': return <Target className={clsx(cls, 'text-orange-400')} />;
            case 'forceDrink': return <Wine className={clsx(cls, 'text-amber-400')} />;
            case 'drunkTimer':
            case 'drunkTimerShift':
            case 'drunkestTimer':
            case 'leastDrunkForceDrink':
                return <Wine className={clsx(cls, 'text-amber-300')} />;
            case 'canCupSip':
            case 'canCupAoESip':
            case 'canCupDoubleTrouble':
            case 'canCupBottenUpp':
            case 'canCupRockBottom':
            case 'canCupRussianRoulette':
            case 'canCupPenaltyDrink':
            case 'canCupTaxSober':
                return <Wine className={clsx(cls, 'text-cyan-300')} />;
            case 'canCupWater':
            case 'canCupBathroomBreak':
            case 'canCupDeflect':
            case 'canCupTopUp':
                return <Droplets className={clsx(cls, 'text-cyan-300')} />;
            case 'canCupSwap':
            case 'canCupHolyAlliance':
            case 'canCupRelaySip':
            case 'canCupLegendaryHeist':
                return <Sparkles className={clsx(cls, 'text-indigo-300')} />;
            default:
                return <Sparkles className={clsx(cls, 'text-purple-400')} />;
        }
    };

    const getAccentColor = (type: string) => {
        const defaultTone = gameMode === 'can-cup' ? 'border-cyan-500/30 bg-cyan-950/40' : 'border-purple-500/30 bg-purple-950/40';
        switch (type) {
            case 'damage': case 'aoeDamage': return 'border-red-500/30 bg-red-950/40';
            case 'heal': case 'manaRefill': case 'potionBuff': return 'border-green-500/30 bg-green-950/40';
            case 'manaDrain': case 'manaBurn': return 'border-yellow-500/30 bg-yellow-950/40';
            case 'challenge': return 'border-orange-500/30 bg-orange-950/40';
            case 'forceDrink': return 'border-amber-500/30 bg-amber-950/40';
            case 'drunkTimer':
            case 'drunkTimerShift':
            case 'drunkestTimer':
            case 'leastDrunkForceDrink':
                return 'border-amber-500/30 bg-amber-950/35';
            case 'canCupSip':
            case 'canCupAoESip':
            case 'canCupDoubleTrouble':
            case 'canCupBottenUpp':
            case 'canCupWater':
            case 'canCupBathroomBreak':
            case 'canCupDeflect':
            case 'canCupTopUp':
            case 'canCupSwap':
            case 'canCupVampire':
            case 'canCupReflect':
            case 'canCupRelaySip':
            case 'canCupRockBottom':
            case 'canCupRussianRoulette':
            case 'canCupPenaltyDrink':
            case 'canCupHolyAlliance':
            case 'canCupLegendaryHeist':
            case 'canCupTaxSober':
                return 'border-cyan-500/30 bg-cyan-950/35';
            default:
                return defaultTone;
        }
    };

    const verb = getActionVerb(primaryAction.cardType);
    const isCanCup = gameMode === 'can-cup';
    const affectedOthers = affectedIds.filter((id) => id !== attacker.id);
    const explicitGroupTypes = new Set([
        'aoeDamage',
        'aoeManaBurst',
        'manaStealAll',
        'manaIntakeOthers',
        'setAllToDrunk',
        'divineIntervention',
        'manaHurricane',
        'drunkTimerShift',
    ]);
    const affectedMany = affectedOthers.length > 1 || explicitGroupTypes.has(primaryAction.cardType);
    const includesAttacker = affectedIds.includes(attacker.id);

    let targetText = '';
    if (primaryAction.cardId === 'drink') {
        targetText = 'self';
    } else if (affectedMany) {
        targetText = includesAttacker ? 'all players' : 'all opponents';
    } else if (primaryAction.targetId && !isSelf) {
        targetText = target?.name || 'target';
    } else if (['drunkestTimer', 'leastDrunkForceDrink'].includes(primaryAction.cardType) && affectedOthers.length === 1) {
        targetText = players.find((player) => player.id === affectedOthers[0])?.name || 'maalet';
    } else if (primaryAction.targetId && isSelf && ['forceDrink', 'canCupWater', 'canCupTopUp'].includes(primaryAction.cardType)) {
        targetText = '';
    } else if (primaryAction.cardType === 'challenge') {
        targetText = 'challenge table';
    }

    const actionPrefix = targetText
        ? `${attacker.name} ${verb} ${targetText}${actionSegments.length > 1 ? ' och skickade vidare med' : ' med'}`
        : `${attacker.name} spelade`;
    const damageValue =
        typeof primaryAction.targetDamage === 'number'
            ? primaryAction.targetDamage
            : typeof primaryAction.targetManaDelta === 'number' && primaryAction.targetManaDelta < 0
                ? Math.abs(primaryAction.targetManaDelta)
                : null;
    const manaCost = typeof primaryAction.manaCost === 'number' ? primaryAction.manaCost : null;
    const damageLabel = isCanCup ? 'Sips' : 'Damage';
    const resourceLabel = isCanCup ? 'Cost' : 'Mana';
    const resourceValue = manaCost !== null
        ? (isCanCup ? `${manaCost} sip${manaCost === 1 ? '' : 's'}` : `${manaCost}`)
        : '--';
    const cardNameTone = isCanCup ? 'text-amber-200' : 'text-purple-300';
    const metaTone = isCanCup ? 'text-cyan-200/70' : 'text-gray-600';
    const pendingFollowUpLabel = pendingCanCupFollowUp
        ? `${players.find((player) => player.id === pendingCanCupFollowUp.responderId)?.name ?? 'A player'} still has to pass on ${pendingCanCupFollowUp.sipCount} sip${pendingCanCupFollowUp.sipCount === 1 ? '' : 's'}.`
        : '';
    const segmentRows = actionSegments.map((segment, index) => {
        const segmentAttacker = players.find((player) => player.id === segment.playerId)?.name ?? 'Player';
        const segmentTarget = segment.targetId
            ? players.find((player) => player.id === segment.targetId)?.name ?? 'target'
            : 'target';
        const segmentValue = typeof segment.targetDamage === 'number' && segment.targetDamage > 0
            ? segment.targetDamage
            : typeof segment.targetManaDelta === 'number' && segment.targetManaDelta < 0
                ? Math.abs(segment.targetManaDelta)
                : null;

        return {
            id: `${segment.cardId}-${segment.timestamp ?? index}-${index}`,
            label: segment.label ?? (index === 0 ? 'Initial hit' : `Chain ${index}`),
            text: `${segmentAttacker} -> ${segmentTarget}`,
            value: segmentValue,
        };
    });

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${primaryAction.playerId}-${primaryAction.cardId}-${lastAction.timestamp ?? 0}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={clsx(
                    'mx-2 rounded-lg border backdrop-blur-sm overflow-hidden cursor-pointer transition-colors',
                    getAccentColor(primaryAction.cardType)
                )}
                onClick={() => setExpanded((prev) => !prev)}
            >
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                    {getActionIcon(primaryAction.cardType)}
                    <span className="text-xs text-white/90 font-medium truncate flex-1">
                        <span className="font-bold">{actionPrefix}</span>{' '}
                        <span className={`${cardNameTone} italic`}>{primaryAction.cardName}</span>
                    </span>
                    {expanded
                        ? <ChevronUp className="w-3 h-3 text-gray-500 shrink-0" />
                        : <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                    }
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-2 pt-1 border-t border-white/5">
                                <div className="text-[11px] text-gray-300 leading-relaxed">
                                    {primaryAction.cardDescription}
                                </div>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${isCanCup
                                        ? 'border border-amber-300/40 bg-amber-950/35 text-amber-100'
                                        : 'border border-red-400/40 bg-red-950/40 text-red-200'
                                        }`}>
                                        <Sword className="w-3 h-3" />
                                        {damageValue !== null ? `${damageLabel} ${damageValue}` : `${damageLabel} --`}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-950/40 px-2 py-0.5 text-[10px] text-blue-200">
                                        <Droplets className="w-3 h-3" />
                                        {`${resourceLabel} ${resourceValue}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={`text-[9px] uppercase tracking-wider ${metaTone}`}>
                                        {primaryAction.cardRarity} · {primaryAction.cardType.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                </div>
                                {(segmentRows.length > 1 || pendingFollowUpLabel) && (
                                    <div className="mt-2 space-y-1.5">
                                        {segmentRows.map((segmentRow) => (
                                            <div
                                                key={segmentRow.id}
                                                className="flex items-center justify-between rounded-md border border-white/8 bg-black/15 px-2 py-1 text-[10px] text-white/85"
                                            >
                                                <span>{segmentRow.label}: {segmentRow.text}</span>
                                                <span>{segmentRow.value !== null ? `${segmentRow.value} ${damageLabel.toLowerCase()}` : '--'}</span>
                                            </div>
                                        ))}
                                        {pendingFollowUpLabel && (
                                            <p className="text-[10px] text-amber-100/85">{pendingFollowUpLabel}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}

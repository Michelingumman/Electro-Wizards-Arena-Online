import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useTDMatchState } from '../hooks/useTDMatchState';
import { useTDStore } from '../store/useTDStore';
import { useAuth } from '../../../hooks/useAuth';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getCardDef } from '../logic/cards';
import { TDCard } from '../types/td';

export function TDMatch() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  useTDMatchState(matchId);
  const { match } = useTDStore();
  const { user } = useAuth();

  // Elixir handling (float accumulator)
  const elixirFloatRef = useRef<number>(5);
  const [elixir, setElixir] = useState(5);
  const [elixirFrac, setElixirFrac] = useState(0);

  const startRef = useRef<number>(Date.now());
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [units, setUnits] = useState<Array<{ id: string; x: number; y: number; hp: number; ownerId: string; cardId: string; side: 'top' | 'bottom' }>>([]);
  const [towers, setTowers] = useState<Array<{ id: string; side: 'top' | 'bottom'; kind: 'princess' | 'king'; x: number; y: number; hp: number }>>([
    // Top side (enemy)
    { id: 't_princess_l', side: 'top', kind: 'princess', x: 0.22, y: 0.22, hp: 1400 },
    { id: 't_princess_r', side: 'top', kind: 'princess', x: 0.78, y: 0.22, hp: 1400 },
    { id: 't_king', side: 'top', kind: 'king', x: 0.5, y: 0.12, hp: 4000 },
    // Bottom side (player)
    { id: 'b_princess_l', side: 'bottom', kind: 'princess', x: 0.22, y: 0.78, hp: 1400 },
    { id: 'b_princess_r', side: 'bottom', kind: 'princess', x: 0.78, y: 0.78, hp: 1400 },
    { id: 'b_king', side: 'bottom', kind: 'king', x: 0.5, y: 0.88, hp: 4000 },
  ]);

  // Refs mirrored to avoid mid-loop re-renders
  const unitsRef = useRef(units);
  const towersRef = useRef(towers);
  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { towersRef.current = towers; }, [towers]);
  const unitsLayerRef = useRef<HTMLDivElement | null>(null);
  const unitNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Rolling hand (4 cards)
  const myDeck: TDCard[] = useMemo(() => (match?.players[0]?.deck || []).slice(0, 6), [match]);
  const [handIndex, setHandIndex] = useState(0);
  const hand: TDCard[] = useMemo(() => {
    if (!myDeck.length) return [];
    return new Array(Math.min(4, myDeck.length)).fill(0).map((_, i) => myDeck[(handIndex + i) % myDeck.length]);
  }, [myDeck, handIndex]);

  // Event stream: queue spawns to consume inside the game loop
  const pendingSpawnsRef = useRef<Array<{ x: number; y: number; cardId: string; playerId: string }>>([]);
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!matchId) return;
    const eventsRef = collection(db, 'td_matches', matchId, 'events');
    const eventsQ = query(eventsRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(eventsQ, (snap) => {
      snap.docChanges().forEach((chg) => {
        const id = chg.doc.id;
        if (processedEventIdsRef.current.has(id)) return;
        const data = chg.doc.data() as any;
        if (data?.type === 'place' || data?.type === 'place_card') {
          pendingSpawnsRef.current.push({ x: data.x, y: data.y, cardId: data.cardId, playerId: data.playerId });
        }
        processedEventIdsRef.current.add(id);
      });
    });
    return () => unsub();
  }, [matchId]);

  // Single RAF loop for elixir + simulation (anti-flicker)
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let accumulator = 0; // ms
    const fixedDt = 1000 / 30; // 30Hz physics

    const step = (dtMs: number) => {
      // Apply queued spawns
      if (pendingSpawnsRef.current.length > 0) {
        const spawns = pendingSpawnsRef.current.splice(0, pendingSpawnsRef.current.length);
        const nextUnits = unitsRef.current.slice();
        for (const s of spawns) {
          const def = getCardDef(s.cardId);
          if (!def) continue;
          const side: 'top' | 'bottom' = s.playerId === user?.uid ? 'bottom' : 'top';
          const count = Math.max(1, def.spawnCount ?? 1);
          for (let i = 0; i < count; i++) {
            nextUnits.push({
              id: `${Date.now()}_${Math.random().toString(36).slice(2)}_${i}`,
              x: Math.max(0.05, Math.min(0.95, s.x + (i - (count - 1) / 2) * 0.035)),
              y: s.y,
              hp: def.hp ?? 500,
              ownerId: s.playerId,
              cardId: s.cardId,
              side,
            });
          }
        }
        unitsRef.current = nextUnits;
      }

      // Unit vs unit, then vs towers
      const nextUnits = unitsRef.current.map((u) => ({ ...u }));
      const unitDamage: Record<string, number> = {};
      const nextTowers = towersRef.current.map((t) => ({ ...t }));
      const topUnits = nextUnits.filter((u) => u.side === 'top');
      const bottomUnits = nextUnits.filter((u) => u.side === 'bottom');

      for (const u of nextUnits) {
        const def = getCardDef(u.cardId);
        if (!def) continue;
        const enemies = u.side === 'bottom' ? topUnits : bottomUnits;
        let nearestEnemy: any = null;
        let best = Infinity;
        for (const e of enemies) {
          const d = Math.hypot(e.x - u.x, e.y - u.y);
          if (d < best) { best = d; nearestEnemy = e; }
        }
        const range = def.range ?? 0.05;
        if (nearestEnemy && best <= range) {
          const dmg = (def.dps ?? 50) * (dtMs / 1000);
          unitDamage[nearestEnemy.id] = (unitDamage[nearestEnemy.id] || 0) + dmg;
        } else {
          const enemyTowers = nextTowers.filter((t) => (u.side === 'bottom' ? t.side === 'top' : t.side === 'bottom') && t.hp > 0);
          if (enemyTowers.length > 0) {
            let tgt = enemyTowers[0];
            let tBest = Infinity;
            for (const t of enemyTowers) {
              const d = Math.hypot(t.x - u.x, t.y - u.y);
              if (d < tBest) { tBest = d; tgt = t; }
            }
            if (tBest <= range) {
              const dmg = (def.dps ?? 50) * (dtMs / 1000);
              const idx = nextTowers.findIndex((t) => t.id === tgt.id);
              if (idx >= 0) nextTowers[idx].hp = Math.max(0, nextTowers[idx].hp - dmg);
            } else {
              const speed = def.speed ?? 0.03;
              const stepLen = speed * (dtMs / 1000);
              u.x += (tgt.x - u.x) * (stepLen / tBest);
              u.y += (tgt.y - u.y) * (stepLen / tBest);
            }
          }
        }
      }
      // Apply unit damage
      const afterDamage = nextUnits
        .map((u) => ({ ...u, hp: u.hp - (unitDamage[u.id] || 0) }))
        .filter((u) => u.hp > 0);

      unitsRef.current = afterDamage;
      towersRef.current = nextTowers;
    };

    const frame = (ts: number) => {
      const dt = ts - last;
      last = ts;
      accumulator += dt;

      // Elixir regen (accumulated, cap at 10)
      elixirFloatRef.current = Math.min(10, elixirFloatRef.current + dt / 2800);

      while (accumulator >= fixedDt) {
        step(fixedDt);
        accumulator -= fixedDt;
      }

      // Commit state once per frame (batched by React for UI numbers, but units are DOM-managed to avoid flicker)
      const ef = elixirFloatRef.current;
      const whole = Math.floor(ef);
      setElixir(whole);
      setElixirFrac(ef - whole);
      // Imperative unit DOM update (no React re-render)
      const layer = unitsLayerRef.current;
      if (layer) {
        const nodes = unitNodesRef.current;
        const seen = new Set<string>();
        for (const u of unitsRef.current) {
          seen.add(u.id);
          let node = nodes.get(u.id);
          if (!node) {
            node = document.createElement('div');
            node.className = 'absolute w-8 h-8 rounded-full overflow-hidden shadow will-change-transform';
            node.style.position = 'absolute';
            node.style.transform = 'translate(-50%, -50%)';
            node.style.pointerEvents = 'none';
            const img = document.createElement('img');
            // Use low-res battlefield icons to reduce bandwidth
            img.src = `/td/cards/${u.cardId}_64.png`;
            img.srcset = `/td/cards/${u.cardId}_64.png 1x, /td/cards/${u.cardId}_128.png 2x`;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.className = 'w-full h-full object-cover';
            node.appendChild(img);
            layer.appendChild(node);
            nodes.set(u.id, node);
          }
          node.style.left = `${u.x * 100}%`;
          node.style.top = `${u.y * 100}%`;
          node.style.transform = `translate(-50%, -50%) translate3d(0,0,0)`;
        }
        // Remove stale nodes
        for (const [id, node] of nodes) {
          if (!seen.has(id)) {
            node.remove();
            nodes.delete(id);
          }
        }
      }
      // React state for towers only
      setTowers(towersRef.current);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [user?.uid]);

  // Host snapshot writer (every 1s)
  useEffect(() => {
    if (!matchId || !user?.uid || user?.uid !== (match as any)?.hostId) return;
    const interval = setInterval(async () => {
      try {
        const payload = {
          snapshotAt: serverTimestamp(),
          snapshot: {
            units: unitsRef.current.map(u => ({ id: u.id, x: u.x, y: u.y, hp: u.hp, ownerId: u.ownerId, cardId: u.cardId, side: u.side })),
            towers: towersRef.current.map(t => ({ id: t.id, side: t.side, kind: t.kind, x: t.x, y: t.y, hp: t.hp })),
          }
        } as any;
        await updateDoc(doc(db, 'td_matches', matchId), payload);
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [matchId, (match as any)?.hostId, user?.uid]);

  // Apply latest host snapshot (debounced)
  const lastAppliedSnapshot = useRef<string | null>(null);
  useEffect(() => {
    const snap = (match as any)?.snapshot;
    const at = (match as any)?.snapshotAt;
    if (!snap || !at) return;
    const key = typeof at?.toMillis === 'function' ? String(at.toMillis()) : String(Date.now());
    if (lastAppliedSnapshot.current === key) return;
    lastAppliedSnapshot.current = key;
    // Replace local state refs; React commit happens on next RAF frame
    if (Array.isArray(snap.units)) unitsRef.current = snap.units;
    if (Array.isArray(snap.towers)) towersRef.current = snap.towers;
  }, [match]);

  const CardImg: React.FC<{ srcs: string[]; className?: string }> = ({ srcs, className }) => {
    const [idx, setIdx] = useState(0);
    const onError = useCallback(() => { setIdx((i) => Math.min(srcs.length - 1, i + 1)); }, [srcs.length]);
    const src = srcs[Math.min(idx, srcs.length - 1)] || srcs[0];
    return <img src={src} onError={onError} alt="" className={className} />;
  };

  const handleArenaClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!matchId || !match || !user) return;
    if (!selectedCardId) return;
    const def = getCardDef(selectedCardId);
    if (!def) return;
    if (elixirFloatRef.current < def.elixir) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    const rotated = user?.uid !== (match as any)?.hostId;
    if (rotated) {
      x = 1 - x;
      y = 1 - y;
    }
    if (y < 0.5) return; // restrict to player half

    elixirFloatRef.current = Math.max(0, elixirFloatRef.current - def.elixir);

    await addDoc(collection(db, 'td_matches', matchId, 'events'), {
      type: 'place',
      x,
      y,
      playerId: user.uid,
      cardId: selectedCardId,
      createdAt: serverTimestamp(),
    });

    if (myDeck.length > 0) setHandIndex((i) => (i + 1) % myDeck.length);
    setSelectedCardId(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2 bg-gradient-to-b from-gray-900 to-green-900">
      <div className="relative w-[420px] max-w-[92vw]">
        <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate('/') } className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="text-gray-300 flex items-center space-x-4">
              <span>Time: {(() => {
                const now = Date.now();
                const start = (match as any)?.startTime?.toMillis ? (match as any).startTime.toMillis() : startRef.current;
                const elapsed = Math.max(0, Math.floor((now - start) / 1000));
                const total = 180;
                const remain = Math.max(0, total - elapsed);
                const mm = String(Math.floor(remain / 60)).padStart(1, '0');
                const ss = String(remain % 60).padStart(2, '0');
                return `${mm}:${ss}`;
              })()}
              </span>
              <span>Elixir: {elixir}/10</span>
            </div>
          </div>
          <div
            className="aspect-[9/16] bg-gradient-to-b from-green-900/30 to-blue-900/30 rounded-xl overflow-hidden border border-gray-700 relative"
            style={{ transform: (user?.uid !== (match as any)?.hostId) ? 'scaleY(-1)' : 'none' }}
            onClick={handleArenaClick}
          >
            {/* Lanes and river */}
            <div className="absolute inset-0 grid grid-rows-2">
              <div className="border-b border-blue-400/60" />
              <div />
            </div>
            {/* Towers layer */}
            <div className="absolute inset-0 pointer-events-none">
              {towers.map((t) => (
                <div
                  key={t.id}
                  style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${t.kind === 'king' ? 'w-12 h-12 rounded-xl border-2 border-yellow-500' : 'w-10 h-10 rounded-lg border'} bg-gray-700/70 border-gray-500`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${Math.max(0, Math.min(1, t.hp / (t.kind === 'king' ? 4000 : 1400))) * 100}%` }} />
                  </div>
                </div>
              ))}
              {/* Units layer managed imperatively to avoid flicker */}
              <div ref={unitsLayerRef} className="absolute inset-0 pointer-events-none" />
            </div>
          </div>

          {/* Elixir progress bar */}
          <div className="mt-3 w-full h-3 bg-gray-700/60 rounded-full overflow-hidden border border-gray-600">
            <div ref={elixirBarRef} className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${elixir * 10}%` }} />
          </div>

          {/* Hand (4 rolling cards), images only */}
          <div className="mt-3 grid grid-cols-4 gap-3">
            {hand.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCardId(c.id)}
                className={`px-3 py-2 rounded-lg border flex items-center justify-center ${
                  selectedCardId === c.id ? 'bg-purple-600/30 border-purple-500' : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <img
                  className="w-12 h-12 rounded object-cover"
                  src={`/td/cards/${c.id}_128.png`}
                  srcSet={`/td/cards/${c.id}_128.png 1x, /td/cards/${c.id}_256.png 2x`}
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



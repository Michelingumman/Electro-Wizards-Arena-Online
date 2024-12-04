import { useState, useCallback } from 'react';
import { Player, Card, GameState } from '../types/game';
import { cards } from '../data/cards';

const INITIAL_HEALTH = 10;
const INITIAL_MANA = 10;
const HAND_SIZE = 3;

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    gameStatus: 'setup',
  });

  const drawCards = (count: number) => {
    return Array.from({ length: count }, () => {
      const randomIndex = Math.floor(Math.random() * cards.length);
      return cards[randomIndex];
    });
  };

  const initializePlayer = (name: string, avatar: string): Player => ({
    id: crypto.randomUUID(),
    name,
    avatar,
    health: INITIAL_HEALTH,
    mana: INITIAL_MANA,
    hand: drawCards(HAND_SIZE),
  });

  const startGame = useCallback((players: { name: string; avatar: string }[]) => {
    setGameState({
      players: players.map(p => initializePlayer(p.name, p.avatar)),
      currentPlayerIndex: 0,
      gameStatus: 'playing',
    });
  }, []);

  const playCard = useCallback((cardIndex: number) => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const card = currentPlayer.hand[cardIndex];
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      
      if (currentPlayer.mana < card.manaCost) {
        return prev;
      }

      const updatedPlayers = prev.players.map((player, index) => {
        if (index === prev.currentPlayerIndex) {
          return {
            ...player,
            mana: player.mana - card.manaCost,
            hand: [
              ...player.hand.slice(0, cardIndex),
              ...player.hand.slice(cardIndex + 1),
              ...drawCards(1),
            ],
          };
        }
        return player;
      });

      return {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
      };
    });
  }, []);

  const drinkForMana = useCallback(() => {
    setGameState(prev => {
      const updatedPlayers = prev.players.map((player, index) => {
        if (index === prev.currentPlayerIndex) {
          return {
            ...player,
            mana: Math.min(player.mana + 10, INITIAL_MANA),
          };
        }
        return player;
      });

      return {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
      };
    });
  }, []);

  return {
    gameState,
    startGame,
    playCard,
    drinkForMana,
  };
};
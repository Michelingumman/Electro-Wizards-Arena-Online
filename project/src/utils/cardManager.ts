import { Card, CardCollection } from '../types/cards';

export class CardManager {
  private collection: CardCollection;

  constructor() {
    this.collection = {
      cards: [],
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }

  addCard(card: Omit<Card, 'id'>): Card {
    const newCard: Card = {
      ...card,
      id: this.generateCardId()
    };
    
    this.collection.cards.push(newCard);
    this.updateCollection();
    return newCard;
  }

  updateCard(id: string, updates: Partial<Card>): Card {
    const index = this.collection.cards.findIndex(card => card.id === id);
    if (index === -1) throw new Error('Card not found');

    const updatedCard = {
      ...this.collection.cards[index],
      ...updates
    };

    this.collection.cards[index] = updatedCard;
    this.updateCollection();
    return updatedCard;
  }

  removeCard(id: string): void {
    const index = this.collection.cards.findIndex(card => card.id === id);
    if (index === -1) throw new Error('Card not found');

    this.collection.cards.splice(index, 1);
    this.updateCollection();
  }

  getCard(id: string): Card | undefined {
    return this.collection.cards.find(card => card.id === id);
  }

  searchCards(query: string): Card[] {
    const lowercaseQuery = query.toLowerCase();
    return this.collection.cards.filter(card => 
      card.name.toLowerCase().includes(lowercaseQuery) ||
      card.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  getAllCards(): Card[] {
    return [...this.collection.cards];
  }

  private generateCardId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateCollection(): void {
    this.collection.lastUpdated = new Date().toISOString();
  }
}
import { CardCollection } from '../types/cards';

export class CardStorage {
  private readonly storageKey = 'card_collection';

  saveCollection(collection: CardCollection): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(collection));
    } catch (error) {
      console.error('Failed to save card collection:', error);
      throw new Error('Failed to save card collection');
    }
  }

  loadCollection(): CardCollection | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load card collection:', error);
      return null;
    }
  }

  clearCollection(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear card collection:', error);
      throw new Error('Failed to clear card collection');
    }
  }
}
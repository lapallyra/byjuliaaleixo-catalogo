import { CompanyId, Order, Product, Customer } from '../types';

export type ERPEventType = 
  | 'ORDER_CREATED' 
  | 'ORDER_UPDATED' 
  | 'ORDER_PAID' 
  | 'ORDER_CANCELLED'
  | 'PRODUCT_CREATED'
  | 'STOCK_UPDATED'
  | 'STOCK_LOW' 
  | 'CLIENT_CREATED';

export interface ERPEventPayloads {
  ORDER_CREATED: { order: Order };
  ORDER_UPDATED: { order: Order; changes: string[] };
  ORDER_PAID: { order: Order };
  ORDER_CANCELLED: { order: Order };
  PRODUCT_CREATED: { product: Product };
  STOCK_UPDATED: { product: Product; oldStock: number; newStock: number };
  STOCK_LOW: { product: Product; currentStock: number };
  CLIENT_CREATED: { customer: Customer };
}

type ERPEventListener<T extends ERPEventType> = (payload: ERPEventPayloads[T]) => void;

class ERPEventBus {
  private listeners: { [K in ERPEventType]?: Set<any> } = {};

  // Subscribe to a specific ERP event
  on<T extends ERPEventType>(event: T, listener: ERPEventListener<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener);
    return () => this.off(event, listener);
  }

  // Unsubscribe from a specific ERP event
  off<T extends ERPEventType>(event: T, listener: ERPEventListener<T>): void {
    const set = this.listeners[event];
    if (set) {
      set.delete(listener);
    }
  }

  // Emit an event to all subscribers and play related sounds
  emit<T extends ERPEventType>(event: T, payload: ERPEventPayloads[T]): void {
    const set = this.listeners[event];
    if (set) {
      set.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`[EventBus] Error in subscriber for ${event}:`, error);
        }
      });
    }

    // Play high-quality sound micro-interaction using Web Audio API
    this.playAudioFeedback(event);
  }

  // Audio synthesis engine for zero-dependency high-fidelity micro-interactions
  private playAudioFeedback(event: ERPEventType) {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        // Safe play pattern for browser interaction policies
        const resume = () => {
          ctx.resume();
          window.removeEventListener('click', resume);
        };
        window.addEventListener('click', resume);
        return;
      }

      switch (event) {
        case 'ORDER_CREATED': {
          // Play a gentle, crisp dual-tone chime (C5 then G5) - pleasant & soft
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          
          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc1.start();
          osc2.start(ctx.currentTime + 0.08);
          
          osc1.stop(ctx.currentTime + 0.8);
          osc2.stop(ctx.currentTime + 0.8);
          break;
        }
        case 'ORDER_PAID': {
          // Play a rewarding crystalline arpeggio (E5 -> G5 -> C6) with echo release
          const notes = [659.25, 783.99, 1046.50]; // E5, G5, C6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
            
            gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 1.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + idx * 0.08 + 1.2);
          });
          break;
        }
        case 'STOCK_LOW': {
          // Play a warm, low alert dual pulse (A3 -> A3)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
          osc.frequency.setValueAtTime(220.00, ctx.currentTime + 0.2);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
          gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
          break;
        }
        case 'CLIENT_CREATED': {
          // Play a warm wooden pop sound (quick sweep pitch)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
          break;
        }
        case 'ORDER_UPDATED': {
          // Play a very subtle high key tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
          break;
        }
        case 'ORDER_CANCELLED': {
          // Play a sad/low slide tone (A3 -> F3 slide)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
          osc.frequency.exponentialRampToValueAtTime(174.61, ctx.currentTime + 0.4); // F3
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
          break;
        }
        case 'PRODUCT_CREATED': {
          // Sparkly/bubble upward chime
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 -> E5 -> G5 -> C6
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
            
            gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.05);
            gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + idx * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.6);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + idx * 0.05);
            osc.stop(ctx.currentTime + idx * 0.05 + 0.6);
          });
          break;
        }
        case 'STOCK_UPDATED': {
          // Simple double pop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08); // C#5
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
          gain.gain.setValueAtTime(0, ctx.currentTime + 0.07);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
          break;
        }
      }
    } catch (e) {
      console.warn('[EventBus] Audio playback failed due to security/interaction restriction:', e);
    }
  }
}

export const eventBus = new ERPEventBus();

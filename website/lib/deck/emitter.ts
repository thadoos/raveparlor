/** A tiny typed event emitter: `Events` maps each event name to its payload type. */
export class Emitter<Events extends object> {
  private listeners = new Map<keyof Events, Set<(payload: never) => void>>();

  on<K extends keyof Events>(type: K, listener: (payload: Events[K]) => void): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
    return () => {
      set.delete(listener);
    };
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    this.listeners.get(type)?.forEach((listener) => listener(payload as never));
  }
}

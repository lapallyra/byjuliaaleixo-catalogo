import { AppConfig, Product } from "../types";
import { subscribeToAppConfig, subscribeToProducts } from "../services/firebaseService";

interface VitrineState {
  config: AppConfig | null;
  products: Product[];
  initialized: boolean;
  onUpdate: (state: VitrineState) => void;
}

const state: VitrineState = {
  config: null,
  products: [],
  initialized: false,
  onUpdate: () => {},
};

let unsubConfig: () => void;
let unsubProducts: () => void;

export const initVitrineSync = (callback: (state: VitrineState) => void) => {
  if (state.initialized) {
    callback(state);
    return;
  }

  state.onUpdate = callback;

  unsubConfig = subscribeToAppConfig((newConfig) => {
    state.config = newConfig;
    state.onUpdate({ ...state });
  });

  unsubProducts = subscribeToProducts((loaded) => {
    state.products = loaded;
    state.onUpdate({ ...state });
  });

  state.initialized = true;
};

export const cleanupVitrineSync = () => {
    if (unsubConfig) unsubConfig();
    if (unsubProducts) unsubProducts();
    state.initialized = false;
};

export const getVitrineState = () => state;

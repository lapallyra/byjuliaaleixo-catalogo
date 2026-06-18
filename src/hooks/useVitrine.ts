import { useState, useEffect } from 'react';
import { initVitrineSync, getVitrineState } from '../lib/vitrineStore';
import { AppConfig, Product } from '../types';

export const useVitrine = () => {
  const [state, setState] = useState(getVitrineState());

  useEffect(() => {
    initVitrineSync((newState) => {
      setState({ ...newState });
    });
  }, []);

  return {
    config: state.config,
    allProducts: state.products,
    initialized: state.initialized,
  };
};

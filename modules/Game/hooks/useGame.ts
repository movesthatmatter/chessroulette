import { useContext } from 'react';
import { GameContext } from '../GameProvider/GameContext';

export const useGame = () => useContext(GameContext);

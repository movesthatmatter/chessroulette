import { MovexDispatchAction } from 'movex';
import { useMatchActionsDispatch } from '../../hooks';
import { PlayActions } from '../store';

export const usePlayActionsDispatch: () => MovexDispatchAction<PlayActions> =
  useMatchActionsDispatch;

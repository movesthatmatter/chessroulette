import { useContext } from 'react';
import { MatchStateContext } from '../providers/MatchContext';
import { MatchViewState } from '../types';

export const useMatchViewState = (): MatchViewState =>
  useContext(MatchStateContext);

export const useMatchActionsDispatch = () =>
  useContext(MatchStateContext).dispatch;

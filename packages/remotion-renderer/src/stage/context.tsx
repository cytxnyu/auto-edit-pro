import {createContext, useContext} from 'react';
import type {Stage} from '../../../core/src/schema';
import type {VisualStyleId} from '../styles';
export type StageSurfaceContext = {surface: Stage['surface']; surfaceOpacity: number; dualRail: boolean; visualStyle?: VisualStyleId};
export const StageContext = createContext<StageSurfaceContext | null>(null);
export const useStageSurface = () => useContext(StageContext);

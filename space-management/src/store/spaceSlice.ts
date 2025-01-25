import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SpaceElement, SpaceConfig, ViewMode } from '../types/space';
import { SnapConfig } from '../types/wall';

interface SpaceState {
  elements: SpaceElement[];
  selectedElements: string[];
  hoveredElement: string | null;
  config: SpaceConfig;
  viewMode: ViewMode;
  snapConfig: SnapConfig;
}

const initialConfig: SpaceConfig = {
  seatSpacing: 0.5,
  minMeetingRoomSize: {
    width: 3,
    length: 4,
  },
  corridorWidth: 1.2,
  defaultSeatSize: {
    width: 0.8,
    depth: 0.6,
  },
  collisionThreshold: 0.1,
};

const initialSnapConfig: SnapConfig = {
  enabled: true,
  snapDistance: 10,
  snapToGrid: false,
  gridSize: 50,
  snapToWalls: true,
  snapToEndpoints: true,
  snapToMidpoints: false
};

const initialState: SpaceState = {
  elements: [],
  selectedElements: [],
  hoveredElement: null,
  config: initialConfig,
  viewMode: {
    mode: '2d',
  },
  snapConfig: initialSnapConfig,
};

const spaceSlice = createSlice({
  name: 'space',
  initialState,
  reducers: {
    addElement: (state, action: PayloadAction<SpaceElement>) => {
      state.elements.push(action.payload);
    },
    updateElement: (state, action: PayloadAction<SpaceElement>) => {
      const index = state.elements.findIndex(el => el.id === action.payload.id);
      if (index !== -1) {
        state.elements[index] = action.payload;
      }
    },
    deleteElement: (state, action: PayloadAction<string>) => {
      state.elements = state.elements.filter(el => el.id !== action.payload);
    },
    updateConfig: (state, action: PayloadAction<Partial<SpaceConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    setSelectedElements: (state, action: PayloadAction<string[]>) => {
      state.selectedElements = action.payload;
    },
    setHoveredElement: (state, action: PayloadAction<string | null>) => {
      state.hoveredElement = action.payload;
    },
    updateSnapConfig: (state, action: PayloadAction<Partial<SnapConfig>>) => {
      state.snapConfig = { ...state.snapConfig, ...action.payload };
    },
    setElements: (state, action: PayloadAction<SpaceElement[]>) => {
      state.elements = action.payload;
    },
  },
});

export const {
  addElement,
  updateElement,
  deleteElement,
  updateConfig,
  setViewMode,
  setSelectedElements,
  setHoveredElement,
  updateSnapConfig,
  setElements,
} = spaceSlice.actions;

export default spaceSlice.reducer;

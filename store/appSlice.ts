import { createSlice } from '@reduxjs/toolkit';

export interface AppState {
    mode: 'default' | 'explore';
    selectedPainting: number;
}

const initialState: AppState = {
  mode: 'default',
  selectedPainting: 0
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setSelectedPainting: (state, action) => {
      state.selectedPainting = action.payload;
    }
  },
});

export const { setMode, setSelectedPainting } = appSlice.actions;
export default appSlice.reducer;

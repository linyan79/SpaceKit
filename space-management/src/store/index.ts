import { configureStore } from '@reduxjs/toolkit';
import spaceReducer from './spaceSlice';
import authReducer from './authSlice';
import fileReducer from './fileSlice';
import commandReducer from './commandSlice';

export const store = configureStore({
  reducer: {
    space: spaceReducer,
    auth: authReducer,
    file: fileReducer,
    command: commandReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
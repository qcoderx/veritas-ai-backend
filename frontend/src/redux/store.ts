

import { configureStore } from '@reduxjs/toolkit';
/**
 * Redux store configuration with typed hooks for TypeScript support
 */
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

import authReducer from '../features/auth/authSlice'; 
import analyticsReducer from '../features/analytics/analyticsSlice';
import searchReducer from '../components/features/Search/searchSlice';
import toggleModalReducer from '../components/features/Modal/toggleModalSlice';
import formReducer from '../components/features/Modal/formSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,       
    analytics: analyticsReducer,
    search: searchReducer,
    modal: toggleModalReducer,
    form: formReducer,
  },
});

/**
 * Redux store types and typed hooks for TypeScript integration
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Typed dispatch hook */
export const useAppDispatch: () => AppDispatch = useDispatch;
/** Typed selector hook */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 
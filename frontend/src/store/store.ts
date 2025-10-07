import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "../components/features/Search/searchSlice";
import toggleModalReducer from "../components/features/Modal/toggleModalSlice";
import formReducer from "../components/features/Modal/formSlice";

export const store = configureStore({
  reducer: {
    search: searchReducer,
    modal: toggleModalReducer,
    form: formReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

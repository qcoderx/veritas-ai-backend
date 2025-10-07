import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface ToggleModalSlice {
  isOpen: boolean;
}

const initialState: ToggleModalSlice = {
  isOpen: false,
};

const toggleModalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    setIsOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },

    closeModal: (state) => {
      state.isOpen = false;
    },
  },
});

export const { setIsOpen, closeModal } = toggleModalSlice.actions;
export default toggleModalSlice.reducer;

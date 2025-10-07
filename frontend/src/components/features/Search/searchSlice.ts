import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import DATA from "../../../constants/DATA";

interface SearchSlice {
  query: string;
  results: typeof DATA;
}

const initialState: SearchSlice = {
  query: "",
  results: DATA,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;

      state.results = DATA.filter((item) =>
        item.Claimant.toLowerCase().includes(state.query.toLowerCase())
      );
    },
  },
});

export const { setQuery } = searchSlice.actions;
export default searchSlice.reducer;

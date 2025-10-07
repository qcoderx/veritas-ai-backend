import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface FormProps {
  step: number;
  data: {
    fullname?: string;
    policyNumber?: string;
    date?: string;
    description?: string;
    doc?: File;
  };
}

interface UpdatePayload {
  key: keyof FormProps;
  value: any;
}

const initialState: FormProps = {
  step: 1,
  data: {},
};

const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    nextStep(state) {
      if (state.step < 3) {
        state.step += 1;
      }
    },
    previousStep(state) {
      if (state.step > 1) {
        state.step -= 1;
      }
    },
    updateForm(state, action: PayloadAction<UpdatePayload>) {
      (state.data as any)[action.payload.key] = action.payload.value;
    },

    resetStep(state) {
      state.step = 1;
      state.data = {};
    },
  },
});

export const { nextStep, previousStep, resetStep, updateForm } =
  formSlice.actions;
export default formSlice.reducer;

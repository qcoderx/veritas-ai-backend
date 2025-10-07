import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AnalyticsState {
  claimReportContent: string | null;
  dashboardSummary: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  claimReportContent: null,
  dashboardSummary: null,
  isLoading: false,
  error: null,
};

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    fetchReportRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchReportSuccess: (state, action: PayloadAction<string>) => {
      state.claimReportContent = action.payload;
      state.isLoading = false;
    },
    fetchReportFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setDashboardSummary: (state, action: PayloadAction<string>) => {
      try {
        state.dashboardSummary = action.payload;
        state.error = null;
      } catch (error) {
        state.error = 'Failed to set dashboard summary';
      }
    }
  },
});

export const { fetchReportRequest, fetchReportSuccess, fetchReportFailure, setDashboardSummary } = analyticsSlice.actions;
export default analyticsSlice.reducer;
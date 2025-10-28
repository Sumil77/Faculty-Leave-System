import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../util/api"; // adjust path as needed

export const fetchGlobals = createAsyncThunk(
  "global/fetchGlobals",
  async (_, { rejectWithValue }) => {
    try {
      // fetch both in parallel
      const [leaveRes, deptRes] = await Promise.all([
        apiRequest("/users/leave-types"),
        apiRequest("/users/dept-list"),
      ]);

      return {
        leaveTypes: leaveRes,
        departments: deptRes,
        lastFetched: Date.now(),
      };
    } catch (error) {
      console.error("Global fetch failed:", error);
      return rejectWithValue(
        error?.message || "Failed to fetch global configuration"
      );
    }
  }
);

const globalSlice = createSlice({
  name: "global",
  initialState: {
    leaveTypes: {},
    departments: [],
    lastFetched: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGlobals.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveTypes = action.payload.leaveTypes || {};
        state.departments = action.payload.departments || [];
        state.lastFetched = action.payload.lastFetched;
      })
      .addCase(fetchGlobals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default globalSlice.reducer;

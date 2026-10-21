import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "./adminSlice";
import doctorReducer from "./doctorSlice";

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    doctor: doctorReducer,
  },
});

export default store;
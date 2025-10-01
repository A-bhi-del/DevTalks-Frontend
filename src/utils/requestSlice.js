import { createSlice } from "@reduxjs/toolkit";

const requestSlice = createSlice({
    name: "request",
    initialState: [],
    reducers:{
        addRequest:(state, action) => {
            return action.payload;
        },
        removeRequest:(state,action)=>{
            const newArray = state.filter((r) => r._id !== action.payload);
            return newArray;
        },
        clearAllRequests: (state, action) => {
            return [];
        }
    }
})


export const {addRequest, removeRequest, clearAllRequests} = requestSlice.actions;
export default requestSlice.reducer;
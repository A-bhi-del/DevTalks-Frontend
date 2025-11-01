import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
    name: "feed",
    initialState: [],  // this is a feed show it should be intialize with an array
    reducers:{
        addfeed: (state, action) => {
            console.log("=== FEED SLICE - addfeed action ===");
            console.log("Action payload:", action.payload);
            console.log("Current state before update:", state);
            console.log("New state will be:", action.payload);
            return action.payload;
        },
        // remeove ka use state ko filter krke check krke krte hai... 
        removefeed: (state, action) => {
            const newArray = state.filter((u) => u._id !== action.payload);
            return newArray;
        } 
    }
})

export const { addfeed , removefeed} = feedSlice.actions;

export default feedSlice.reducer;
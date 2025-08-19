import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
    name: "feed",
    initialState: [],  // this is a feed show it should be intialize with an array
    reducers:{
        addfeed: (state, action) => {
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
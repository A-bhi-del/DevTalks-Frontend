import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
    name: "feed",
    initialState: [],  // this is a feed show it should be intialize with an array
    reducers:{
        addfeed: (state, action) => {
            return action.payload;
        },
        removefeed: (state, action) => {
            return null;
        }
    }
})

export const { addfeed , removefeed} = feedSlice.actions;

export default feedSlice.reducer;
import { createSlice } from "@reduxjs/toolkit";

const connecionSlice = createSlice({
    name: "connection",
    initialState: [],
    reducers:{
        addConnection: (state, action) => {
            return action.payload
        },
        removeConnection: ()=>{
            return null;
        }
    }
})

export const {addConnection, removeConnection} = connecionSlice.actions;

export default connecionSlice.reducer;
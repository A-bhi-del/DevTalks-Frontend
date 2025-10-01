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
        },
        clearAllConnections: (state, action) => {
            return [];
        }
    }
})

export const {addConnection, removeConnection, clearAllConnections} = connecionSlice.actions;

export default connecionSlice.reducer;
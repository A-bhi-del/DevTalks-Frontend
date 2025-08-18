import { createSlice } from "@reduxjs/toolkit";

const articleSlice = createSlice({
    name: "article",
    initialState: null,
    reducers:{
        addArticle: (state, action) => {
            return action.payload;
        },
        removeArticle: ()=> {
            return null;
        }
    }
})

export const {addArticle, removeArticle} = articleSlice.actions
export default articleSlice.reducer;
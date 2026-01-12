import axios from "axios";
import { BASE_URL } from "./constants";
import { addUser } from "./userSlice";

export const fetchUser = () => async (dispatch) => {
  try {
    const res = await axios.get(BASE_URL + "/profile/view", {
      withCredentials: true,
    });

    dispatch(addUser(res.data.data));
  } catch (err) {
    console.error("Failed to fetch user", err);
  }
};

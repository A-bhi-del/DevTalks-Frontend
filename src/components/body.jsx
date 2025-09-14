import React, { useEffect } from 'react'
import Navbar from './Navbar'
import { Outlet, useNavigate } from 'react-router-dom'
import Footer from './Footer'
import { BASE_URL } from '../utils/constants'
import { useDispatch, useSelector } from 'react-redux'
import { addUser } from '../utils/userSlice'
import axios from 'axios'

const Body = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((store) => store.user);

  const fetchUser = async () => {
    if(userData) return;
    try{
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials : true,
      });
      dispatch(addUser(res.data));
    }catch(err){
      if(err.status === 401){
        navigate("/login");
      }
      console.error(err);
    }
  }

  useEffect(() => {
    fetchUser(); // ye site ke load hote hai.. sabse pahle authontication check krega if you are not authenticated than login page par navigate kr dega
  }, [])
  
  return (
    <div className='bg-gradient-to-br from-gray-900 via-black to-gray-800 '>
      <Navbar/>
      <Outlet/>
      <Footer/>
    </div>
  )
}

export default Body

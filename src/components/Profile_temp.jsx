import React from 'react'
import EditProfile from './Editprofile_temp'
import { useSelector } from 'react-redux'

const Profile = () => {
  const user = useSelector((store) => store.user);
  return (
    user && (<div>
      <EditProfile />
    </div>)
  )
}

export default Profile;

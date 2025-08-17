import axios from 'axios';
import React, { useEffect } from 'react'
import { BASE_URL } from '../utils/constants';
import { useDispatch, useSelector } from 'react-redux';
import { addConnection } from '../utils/connectionSlice';

const Connection = () => {
  const connection = useSelector((store) => store.connection);
  const dispatch = useDispatch();

  const fetchConnections = async() => {
    try{
      const connections = await axios.get(BASE_URL + "/user/connections", {
        withCredentials: true,
      })

      console.log(connections.data.data);
      dispatch(addConnection(connections.data.data));

    }catch(err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchConnections();
  }, []);


  if (!connection) return null;
  if (connection.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <h1 className="text-xl font-semibold text-gray-600">No connections</h1>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Connections</h1>

      <div className="space-y-4">
        {connection.map((c, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-base-100 shadow-md rounded-xl p-4"
          >
            {/* Left side: profile image + name */}
            <div className="flex items-center space-x-4">
              <img
                src={c.photoUrl || "https://via.placeholder.com/40"}
                alt={c.firstName}
                className="w-12 h-12 rounded-full border"
              />
              <div>
                <h2 className="font-semibold text-lg">{c.firstName + " " + c.lastName}</h2>
                <p className="text-sm text-gray-500">{c.about}</p>
              </div>
            </div>

            {/* Right side: button */}
            <button className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg">
              Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Connection;
import axios from "axios";
import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addConnection } from "../utils/connectionSlice";
import { addRequest } from "../utils/requestSlice";

const Request = () => {
    const request = useSelector((store) => store.request);
    const dispatch = useDispatch();
    const [showtoast, setShowtoast] = useState(false);
    const [toastMsg , setToastMsg] = useState("");

  const fetchRequest = async () => {
    try {
      const requests = await axios.get(BASE_URL + "/user/requests", {
        withCredentials: true,
      });

      console.log(requests.data.data);
      dispatch(addRequest(requests.data.data));
      
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptorReject = async (status, requestId) => {
    try{
       await axios.post(`${BASE_URL}/request/receive/${status}/${requestId}`,{}, {
        withCredentials: true,
       })

       setToastMsg(status === "accepted" ? "You have accepted the request" : "You have rejected the request");
       setShowtoast(true);
       setTimeout(() => {
         setShowtoast(false);
        }, 3000);
    }catch(err){
        console.error(err);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, []);

  if (!request) return null;
  console.log("Requests Data:", request);
  if (request.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <h1 className="text-xl font-semibold text-gray-600">No Requests</h1>
      </div>
    );

  return (
    <>
    {showtoast && (
        <div className="toast toast-top toast-center">
          <div className="alert alert-success">
            <span>{toastMsg}</span>
          </div>
        </div>
      )}
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Requests</h1>

      <div className="space-y-4">
        {request.map((r, index) => {
          const { firstName, lastName, about, photoUrl } = r.fromUserId;
          return (
            <div
              key={index}
              className="flex items-center justify-between bg-base-100 shadow-md rounded-xl p-4"
            >
              {/* Left side: profile image + name */}
              <div className="flex items-center space-x-4">
                <img
                  src={photoUrl || "https://via.placeholder.com/40"}
                  alt={firstName}
                  className="w-12 h-12 rounded-full border"
                />
                <div>
                  <h2 className="font-semibold text-lg">
                    {firstName + " " + lastName}
                  </h2>
                  <p className="text-sm text-gray-500">{about}</p>
                </div>
              </div>

              {/* Right side: buttons */}
              <div className="space-x-2">
                <button className="px-4 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg" onClick={() => handleAcceptorReject("accepted", r._id)}>
                  Accept
                </button>
                <button className="px-4 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg" onClick={() => handleAcceptorReject("rejected", r._id)}>
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};

export default Request;

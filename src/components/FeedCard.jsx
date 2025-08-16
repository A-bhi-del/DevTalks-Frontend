import React from "react";

const FeedCard = ({ user }) => {
  console.log(user);
  return (
    <div className="card bg-base-100 image-full w-75 h-110 shadow-sm">
      <figure>
        <img
          src={user.photoUrl}
          alt="Shoes"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{user.firstName} {user.lastName}</h2>
        <p>
          {user.about}
        </p>
        <div className="card-actions justify-between">
          <button className="btn btn-error">Ignore</button>
          <button className="btn btn-success">Interested</button>
        </div>
      </div>
    </div>
  );
};

export default FeedCard;

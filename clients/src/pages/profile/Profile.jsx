// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchUserData } from '../../redux/userDataSlice';

// const Profile = () => {
//   const dispatch = useDispatch();
//   const { userData, loading, error } = useSelector((state) => state.userData);
//   console.log(userData);

//   useEffect(() => {
//     const userId = localStorage.getItem('userId');
//     if (userId) {
//       dispatch(fetchUserData(userId));
//     }
//   }, [dispatch]);

//   const userId = localStorage.getItem('userId');
//   if (loading) return <p>Loading profile...</p>;
//   if (error) return <p>Error: {error}</p>;
//   if (!userData || (!userData.id && !userData._id)) {
//     console.log('userData is null or missing id:', userData);
//     return <p>No profile data found.</p>;
//   }
//   if ((userData.id && userData.id !== userId) && (userData._id && userData._id !== userId)) {
//     console.log('User ID does not match profile:', userData, userId);
//     return <p>User ID does not match profile.</p>;
//   }

//   return (
//     <div className="container mt-4">
//       <h2>User Profile</h2>
//       <p><strong>Name:</strong> {userData.firstName} {userData.lastName}</p>
//       <p><strong>Email:</strong> {userData.email}</p>
//       <p><strong>Phone:</strong> {userData.phone}</p>
//       <p><strong>Status:</strong> {userData.status}</p>
//       <p><strong>Role:</strong> {userData.role?.roleName}</p>
//       {/* Add more fields as needed */}
//     </div>
//   );
// };

// export default Profile;

import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config/config";
import api from "../../pages/config/axiosInstance"
import { useAuth } from "../../components/auth/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/api/user/userdata/${userId}`, {
          withCredentials: true,
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Profile fetch failed:", err);
      }
    };

    fetchUser();
  }, [userId]);

  if (!profile) return <p>Loading user profile...</p>;

  return (
    <div className="container mt-4">
      <h2>User Profile</h2>

      <div className="card p-3 shadow-sm">
        <div className="d-flex align-items-center mb-3">
          <div className="me-3">
            {profile.profileImage?.length > 0 ? (
              <img
                src={profile.profileImage[0]?.url}
                alt="Profile"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "10%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                className="bg-secondary text-white d-flex justify-content-center align-items-center"
                style={{ width: "50px", height: "50px", borderRadius: "10%" }}
              >
                {profile.firstName?.charAt(0)}
                {profile.lastName?.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <strong>
              {profile.firstName} {profile.lastName}
            </strong>
          </div>
        </div>

        <p><strong>Full Name:</strong> {profile.firstName} {profile.lastName}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Phone:</strong> {profile.phone || "—"}</p>
        <p><strong>Status:</strong> {profile.status || "—"}</p>
        <p><strong>Role:</strong> {profile.role?.roleName || "—"}</p>
        <p>
          <strong>Account Created:</strong>{" "}
          {profile.createdAt
            ? new Date(profile.createdAt).toLocaleString()
            : "—"}
        </p>
        <p>
          <strong>Last Updated:</strong>{" "}
          {profile.updatedAt
            ? new Date(profile.updatedAt).toLocaleString()
            : "—"}
        </p>
      </div>
    </div>
  );
};

export default Profile;



// semi final
// src/pages/Profile.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import BASE_URL from "../config/config";

// const Profile = () => {
//   const [user, setUser] = useState(null);
//   const userObj = JSON.parse(localStorage.getItem("user"));
//   const userId = userObj?.id; // or userObj?._id based on your schema
//   const token = localStorage.getItem("token");
//   // console.log("User ID:", userId);
//   // console.log("Token:", token);
//   // console.log("User Object:", userObj);
//   // console.log("User Data:", user);

//   useEffect(() => {
//     if (!userId || !token) return;

//     const fetchUser = async () => {
//       try {
//         const res = await axios.get(`${BASE_URL}/api/user/userdata/${userId}`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         setUser(res.data);
//       } catch (err) {

//         // console.log("Full URL:", `${BASE_URL}/api/user/userdata/${userId}`);

//         console.error("Profile fetch failed:", err);
//       }
//     };

//     fetchUser();
//   }, [userId, token]);

//   if (!user) return <p>Loading user profile...</p>;

//   return (
//     <div>
//       <h2>Welcome, {user.firstName} {user.lastName}</h2>
//       <p><strong>Email:</strong> {user.email}</p>
//       <p><strong>Role:</strong> {user.role?.roleName}</p>
//     </div>
//   );
// };

// export default Profile;

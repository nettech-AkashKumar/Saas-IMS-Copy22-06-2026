import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TbBell, TbCirclePlus, TbCommand, TbDeviceLaptop, TbDotsVertical, TbFileText, TbLanguage, TbLogout, TbMail, TbMaximize, TbSearch, TbSettings, TbUserCircle } from 'react-icons/tb';
import { FaTrash } from 'react-icons/fa';
import { useSocket } from '../Context/SocketContext';
import './activities.css'; // Import your CSS file for styles
// import BASE_URL from "../../../pages/config/config";
import axios from "axios";
import api from "../pages/config/axiosInstance"
import { useAuth } from "../components/auth/AuthContext"


const Activities = ({ onUnreadCountChange, onClose }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const userData = user;
  // const user = useMemo(() => {
  //   try {
  //     const userData = localStorage.getItem('user');
  //     return userData ? JSON.parse(userData) : null;
  //   } catch (error) {
  //     console.error('Error parsing user data:', error);
  //     return null;
  //   }
  // }, []);
  // const backendurl = api.defaults.baseURL;
  const { connectSocket, getSocket, isSocketConnected } = useSocket();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      // const token = localStorage.getItem('token');
      const userId = user?.id || user?._id;

      if (!userId) return;

      const res = await api.get(`/api/notifications/${userId}`);
      setNotifications(res.data.notifications || []);
    } catch (error) {
      // console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      // const token = localStorage.getItem('token');
      const userId = user?.id || user?._id;

      if (!userId) return;

      const res = await api.get(`/api/notifications/unread/${userId}`);
      const count = res.data.count || 0;
      setUnreadCount(count);
      if (onUnreadCountChange) {
        onUnreadCountChange(count);
      }
    } catch (error) {
      // console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // const token = localStorage.getItem('token');
      const userId = user?.id || user?._id;

      if (!userId) return;

      await api.put(`/api/notifications/read/${notificationId}`);

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );

      // Update unread count
      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);

      // Inform Navbar of the updated count
      if (onUnreadCountChange) {
        onUnreadCountChange(newUnreadCount);
      }
    } catch (error) {
      // console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // const token = localStorage.getItem('token');
      const userId = user?.id || user?._id;

      if (!userId) return;

      await api.put(`/api/notifications/read-all/${userId}`);

      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);

      // Inform Navbar of the updated count
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (error) {
      // console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      // const token = localStorage.getItem('token');
      const userId = user?.id || user?._id;

      if (!userId) return;

      const res = await api.delete(`/api/notifications/${notificationId}`);
      // Check if the notification was unread before deleting
      const notificationToDelete = notifications.find(n => n._id === notificationId);
      const wasUnread = notificationToDelete && !notificationToDelete.read;

      // Remove from local state
      setNotifications(prev =>
        prev.filter(notification => notification._id !== notificationId)
      );

      // Update unread count if the deleted notification was unread
      if (wasUnread) {
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);

        // Inform Navbar of the updated count
        if (onUnreadCountChange) {
          onUnreadCountChange(newUnreadCount);
        }
      }
    } catch (error) {
      // console.error('Error deleting notification:', error);
    }
  };

  // Format time ago
  // const formatTimeAgo = (timestamp) => {
  //   const now = new Date();
  //   const time = new Date(timestamp);
  //   const diffInMinutes = Math.floor((now - time) / (1000 * 60));

  //   if (diffInMinutes < 1) return 'Just now';
  //   if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;

  //   const diffInHours = Math.floor(diffInMinutes / 60);
  //   if (diffInHours < 24) return `${diffInHours} hours ago`;

  //   const diffInDays = Math.floor(diffInHours / 24);
  //   return `${diffInDays} days ago`;
  // };
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  useEffect(() => {
    if (user) {
      // Don't create a new socket connection here, use the one from Navbar
      // The socket connection should be managed at a higher level

      return () => {
        // Don't disconnect here, let the Navbar manage the socket
      };
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [user])

  return (
    <div style={{ backgroundColor: '#FDFDFD', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
      <div className="" style={{ padding: '5px 12px', backgroundColor: '#FDFDFD', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h5 className="notification-title" style={{ color: '#262626', marginTop: '8px' }}>{t("Notification")}</h5>
        <a href="#" className="clear-noti" style={{ color: '#1368EC', textDecoration: 'none' }} onClick={(e) => {
          e.preventDefault();
          markAllAsRead();
        }}>{t("Clear All")}</a>
      </div>
      <div className="" style={{ padding: '5px 10px', lineHeight: 'normal', height: 'auto', width: '350px', position: 'relative', overflowY: 'auto', maxHeight: '300px' }}>
        <ul className="notification-list">
          {loading ? (
            <li className="notification-message">
              <div className="media d-flex">
                <div className="flex-grow-1">
                  <p className="noti-details">Loading Notifications...</p>
                </div>
              </div>
            </li>
          ) : notifications.length === 0 ? (
            <li className="notification-message">
              <div className="media d-flex">
                <div className="flex-grow-1">
                  <p className="noti-details" style={{ marginTop: '10px', textAlign: 'center' }}>{t("No Notifications !!")}</p>
                </div>
              </div>
            </li>
          ) : notifications.filter(notification => !notification.read).length === 0 ? (
            <li className="notification-message">
              <div className="media d-flex">
                <div className="flex-grow-1">
                  <p className="noti-details" style={{ marginBottom: '10px', textAlign: 'center', }}> No New Notifications !!</p>
                </div>
              </div>
            </li>
          ) : (
            notifications.filter(notification => !notification.read).map((notification) => (
              <li key={notification._id} className={`notification-item ${!notification.read ? 'unread' : ''}`}
                style={{}}
              >
                <div style={{ textDecoration: 'none' }} onClick={() => markAsRead(notification._id)}>
                  <div className="media d-flex">
                    <div>
                      {notification.sender?.profileImage?.url ? (
                        <img
                          src={notification.sender.profileImage.url}
                          alt="Sender"
                          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          border: '2px solid #eee',
                          backgroundColor: '#007AFF',
                          display: notification.sender?.profileImage?.url ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '20px',
                          fontWeight: '600',
                        }}
                      >
                        {notification.sender?.name?.slice(0, 1).toUpperCase() || 'NA'}
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <p className="noti-details" style={{ textDecoration: 'none', marginLeft: '5px', marginTop: '5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span className="noti-title" style={{ textDecoration: 'none', fontWeight: 'bold' }}>{notification.sender?.name}</span>
                          <span className="noti-time" style={{ textDecoration: 'none', fontSize: '10px' }}>{formatTimeAgo(notification.timestamp)}</span>
                        </div>
                        <span style={{ fontSize: '14px' }}>{notification.message.length > 20 ? notification.message.slice(0, 20) + "..." : notification.message}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                {/* <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '35px',
                    right: '10px',
                    width: '20px',
                    height: '20px',
                    border: 'none',
                    borderRadius: '50%',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '25px',
                    zIndex: 10
                  }}
                  title="Delete notification"
                >
                  <FaTrash style={{ fontSize: '25px' }} />
                </button> */}

                {!notification.read && (
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    right: '20px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#FFD700',
                    borderRadius: '50%',
                    border: '1px solid white',
                    boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                  }}></div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="" style={{ padding: '8px', backgroundColor: '#bdddf328', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', textAlign: 'center' }} onClick={(e) => {
        e.preventDefault();
        markAllAsRead();
      }}>
        <Link
          onClick={() => {
            if (onClose) onClose();
          }}
          to="/ViewAllNotifications"
          style={{ width: '100%', color: '#1368EC', textAlign: 'center', textDecoration: 'none' }} >
          {t("View All")}
        </Link>
      </div>
    </div>
  )
}

export default Activities
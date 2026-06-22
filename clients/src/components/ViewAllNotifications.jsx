import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import BASE_URL from '../../../pages/config/config';
import { toast } from 'react-toastify';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaCheckDouble,
  FaExclamationTriangle
} from 'react-icons/fa';
import { CiClock2 } from 'react-icons/ci';
import './activities.css';
import { ObjectId } from 'bson'; // Import bson for ObjectId validation
import { useSocket } from '../Context/SocketContext';
import api from "../pages/config/axiosInstance"
import { useAuth } from '../components/auth/AuthContext';
import DeleteModal from '../components/ConfirmDelete';

const ViewAllNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const { connectSocket, getSocket } = useSocket();
  const [deleteMode, setDeleteMode] = useState(null);

  const userId = user?.id || user?._id;

  const fetchNotifications = async (page = 1) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/api/notifications/paginated/${userId}?page=${page}&limit=100`);
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
    } catch (error) {
      const errorMessage = error.res?.data?.message || error.message || 'Failed to load notifications';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!userId) return;

    try {
      const res = await api.get(
        `/api/notifications/unread/${userId}`);
      setUnreadCount(res.data.count);
    } catch (error) {
      // console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(
        `/api/notifications/read/${notificationId}`,
        { userId });

      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      fetchUnreadCount();
      toast.success('Notification marked as read');
    } catch (error) {
      const errorMessage = error.res?.data?.message || error.message || 'Failed to mark notification as read';
      toast.error(errorMessage);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(
        `/api/notifications/read-all/${userId}`);

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      const errorMessage = error.res?.data?.message || error.message || 'Failed to mark all notifications as read';
      toast.error(errorMessage);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleDelete = (mode, id = null) => {
    setDeleteMode(mode);
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    try {
      if (deleteMode === 'single') {
        await api.delete(`/api/notifications/${deleteTargetId}`, {
          data: { userId }
        });

        setNotifications(prev =>
          prev.filter(n => n._id !== deleteTargetId)
        );

        toast.success('Notification deleted');
      }

      if (deleteMode === 'all') {
        await api.delete(`/api/notifications/all/${userId}`, {
          data: { userId }
        });

        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications deleted');
      }

      if (deleteMode === 'selected') {
        if (!selectedNotifications.length) {
          toast.error('No notifications selected');
          return;
        }

        await api.delete(`/api/notifications/bulk-delete`, {
          data: {
            userId,
            notificationIds: selectedNotifications
          }
        });

        setNotifications(prev =>
          prev.filter(n => !selectedNotifications.includes(n._id))
        );

        setSelectedNotifications([]);
        toast.success('Selected notifications deleted');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Delete failed'
      );
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      setDeleteMode(null);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await api.delete(
        `/api/notifications/all/${userId}`,
        { data: { userId } });

      setNotifications([]);
      setUnreadCount(0);
      handleDelete();
      toast.success('All notifications deleted successfully');
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    } catch (error) {
      const errorMessage = error.res?.data?.message || error.message || 'Failed to delete all notifications';
      toast.error(errorMessage);
      handleDelete();
    }
  };

  const deleteSelectedNotifications = async () => {
    if (!selectedNotifications.length) {
      toast.error('No notifications selected');
      handleDelete();
      return;
    }

    // Validate that all selected notifications exist in the current notifications list
    const validSelectedIds = selectedNotifications.filter(id =>
      notifications.some(notification => notification._id === id)
    );

    if (validSelectedIds.length !== selectedNotifications.length) {
      // console.warn('Some selected notifications are no longer valid:', {selected: selectedNotifications, valid: validSelectedIds});
    }

    if (validSelectedIds.length === 0) {
      toast.error('No valid notifications selected');
      handleDelete();
      return;
    }

    try {
      // console.log('Deleting selected notifications:', validSelectedIds);
      // console.log('User ID:', userId);
      const requestData = { userId, notificationIds: validSelectedIds };
      // console.log('Request data:', requestData);

      const res = await api.delete(
        `/api/notifications/bulk-delete`,
        { data: requestData });

      // console.log('Response:', res.data);

      setNotifications(prev =>
        prev.filter(notification => !validSelectedIds.includes(notification._id))
      );
      setSelectedNotifications([]);
      handleDelete();
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      toast.success(res.data.message || 'Selected notifications deleted successfully');
    } catch (error) {
      // console.error('Error deleting selected notifications:', error);
      // console.error('Error response:', error.res?.data);
      // console.error('Error status:', error.res?.status);
      const errorMessage = error.res?.data?.message || error.message || 'Failed to delete selected notifications';
      toast.error(errorMessage);
      handleDelete();
    }
  };

  const handleCheckboxChange = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const formatTimestamp = (timestamp) => {
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
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();

      // Attach real-time listener for new notifications
      const socket = connectSocket(api.defaults.baseURL);
      if (socket) {
        try {
          // Ensure user is registered (safe to emit again)
          socket.emit('add-user', userId);
        } catch (e) {
          // console.error('Socket user registration failed in ViewAllNotifications:', e);
        }

        const handleNewNotification = () => {
          // Refresh notifications and unread count to reflect latest state
          fetchNotifications(currentPage);
          fetchUnreadCount();
        };

        socket.on('new-notification', handleNewNotification);

        return () => {
          socket.off('new-notification', handleNewNotification);
        };
      }
    } else {
      setLoading(false);
    }
  }, [userId, currentPage]);

  return (
    <div className='p-4'>
      <div className="">
        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                height: '33px'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "black",
                  fontSize: 22,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  height: '33px'
                }}
              >
                Notifications
              </h2>
            </div>
          </div>
          {notifications.length > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'white',
                    color: '#1368EC',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaCheckDouble />
                  Mark All as Read
                </button>
              )}
              {selectedNotifications.length === 0 && (
                <button
                  onClick={() => handleDelete('all')}
                  style={{
                    background: 'white',
                    color: '#dc3545',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaTrash />
                  Delete All
                </button>
              )}
              {selectedNotifications.length > 0 && (
                <button
                  onClick={() => handleDelete('selected')}
                  style={{
                    background: 'white',
                    color: '#dc3545',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaTrash />
                  Delete Selected ({selectedNotifications.length})
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: '5px', overflowY: 'auto', height: '81vh', borderRadius: '8px', backgroundColor: 'white' }}>
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: '#6c757d' }}>
              <FaBell style={{ fontSize: '48px', color: '#dee2e6', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#495057' }}>Please log in</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>Please log in to view notifications</p>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <p style={{ color: '#6c757d' }}>Loading notifications...</p>
              </div>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: '#6c757d' }}>
              <FaBell style={{ fontSize: '48px', color: '#dee2e6', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#495057' }}>Error loading notifications</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>{error}</p>
              <button
                onClick={() => fetchNotifications()}
                style={{
                  marginTop: '16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: '#6c757d' }}>
              <FaBell style={{ fontSize: '48px', color: '#dee2e6', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#495057' }}>No Notifications !!</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>You're all caught up! No new notifications.</p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div key={notification._id} className='notification-items notification-hover-group'>
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification._id)}
                    onChange={() => handleCheckboxChange(notification._id)}
                    style={{ marginRight: '12px', verticalAlign: 'middle' }}
                  />
                  <div>
                    {notification.sender?.profileImage?.url ? (
                      <img
                        src={notification.sender.profileImage.url}
                        alt="Sender"
                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee', }}
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
                        backgroundColor: '#007AFF',
                        border: '2px solid #eee',
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
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: 'black' }}>
                          {notification.sender?.name || 'User'}
                        </span>
                        <br />
                        <span style={{ fontWeight: '400', color: '#6c757d' }}>
                          {notification.message}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div className='notification-default-info'>
                      <span style={{ fontWeight: '400', color: '#6c757d' }}>
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <span style={{
                          color: 'white',
                          fontSize: '10px',
                          marginTop: '8px',
                          width: '8px',
                          height: '8px',
                          marginLeft: '8px',
                          backgroundColor: '#FFD700',
                          borderRadius: '50%',
                          border: '1px solid white',
                          boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }}></span>
                      )}
                    </div>
                    <div className='notification-hover-actions'>
                      {!notification.read && (
                        <button
                          style={{
                            width: '32px',
                            height: '32px',
                            border: 'none',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: '#FBFBFB',
                            color: '#1368EC',
                            fontSize: '15px',
                            transition: 'all 0.3s ease'
                          }}
                          className='notification-action-btn mark-read'
                          onClick={() => markAsRead(notification._id)}
                          title="Mark as read"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: '#FBFBFB',
                          color: '#dc3545',
                          fontSize: '15px',
                          transition: 'all 0.3s ease'
                        }}
                        className='notification-action-btn delete'
                        onClick={() => handleDelete('single', notification._id)}
                        title="Delete notification"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  padding: '20px 0',
                  borderTop: '1px solid #f1f3f4',
                  marginTop: '20px'
                }}>
                  <button
                    style={{
                      background: currentPage === 1 ? '#6c757d' : '#667eea',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.6 : 1
                    }}
                    disabled={currentPage === 1}
                    onClick={() => fetchNotifications(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    style={{
                      background: currentPage === totalPages ? '#6c757d' : '#667eea',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.6 : 1
                    }}
                    disabled={currentPage === totalPages}
                    onClick={() => fetchNotifications(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName="product"
      />

    </div>
  );
};

export default ViewAllNotifications;
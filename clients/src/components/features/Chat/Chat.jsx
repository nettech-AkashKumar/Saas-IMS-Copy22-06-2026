import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import './chat.css';
import { CiSearch } from "react-icons/ci";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { CiCamera } from "react-icons/ci";
import { GrGallery } from "react-icons/gr";
import { MdOutlineAudiotrack } from "react-icons/md";
import { VscLocation } from "react-icons/vsc";
import { RiUserFollowLine } from "react-icons/ri";
import { GrEmoji } from "react-icons/gr";
import { CiFolderOn } from "react-icons/ci";
import { IoVolumeMuteOutline } from "react-icons/io5";
import { GoClock } from "react-icons/go";
import { TbClearAll } from "react-icons/tb";
import { RiDeleteBinLine } from "react-icons/ri";
import { MdBlockFlipped } from "react-icons/md";
import EmojiPicker from 'emoji-picker-react';
import { LuRefreshCcw, LuChevronUp, LuMic, LuSend } from "react-icons/lu";
import { TbFolderUp } from "react-icons/tb";
import { HiMenu, HiX } from "react-icons/hi";
import { useSocket } from '../../../Context/SocketContext';
import ChatIcon from '../../../assets/img/icons/chat.png';
import DeleteAlert from "../../../utils/sweetAlert/DeleteAlert";
import axios from "axios";
import api from "../../../pages/config/axiosInstance"
// import { useAuth } from '../../auth/AuthContext';
import { useAuth } from '../../../components/auth/AuthContext';

const SOCKET_URL = api.defaults.baseURL;

const Chat = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState({}); // Store messages per user
  const [message, setMessage] = useState('');
  const [readStatus, setReadStatus] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread counts per user
  const [newMessagesStartIndex, setNewMessagesStartIndex] = useState(null); // Index of first unread incoming message
  const [showNewMessagesDivider, setShowNewMessagesDivider] = useState(false); // Show "New messages" divider
  useEffect(() => { }, [unreadCounts]);
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering friends
  const [searchSuggestions, setSearchSuggestions] = useState([]); // Search suggestions dropdown
  const [showSearchDropdown, setShowSearchDropdown] = useState(false); // Show/hide search dropdown
  const [searchTimeout, setSearchTimeout] = useState(null); // For debouncing search
  const socket = useRef(null);
  // const user = userss; // Removed redundant assignment
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const backendurl = api.defaults.baseURL;
  const [clickDropdown, setClickDropdown] = useState();
  const [clickDropdowntwo, setClickDropdownTwo] = useState();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { idx, x, y }
  const [replyTo, setReplyTo] = useState(null); // message object
  const [popup, setPopup] = useState({ show: false, message: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
  const currentUserId = user?.id || user?._id;

  // Helper function to normalize user IDs for comparison
  const normalizeUserId = (userId) => {
    return userId ? String(userId) : null;
  };

  // Normalized current user ID for consistent comparison
  const normalizedCurrentUserId = normalizeUserId(currentUserId);

  // Helper to safely get profile image URL
  const getProfileImageUrl = (userObj) => {
    if (!userObj || !userObj.profileImage) return null;

    // Case 1: string
    if (typeof userObj.profileImage === 'string') {
      return userObj.profileImage;
    }

    // Case 2: array
    if (Array.isArray(userObj.profileImage) && userObj.profileImage.length > 0) {
      // Could be array of strings or array of objects
      const first = userObj.profileImage[0];
      if (typeof first === 'string') return first;
      if (first && first.url) return first.url;
      return null;
    }

    // Case 3: object
    if (typeof userObj.profileImage === 'object') {
      return userObj.profileImage.url || null;
    }
    return null;
  };

  const { connectSocket, getSocket } = useSocket();

  // Function to handle search input changes
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.trim().length > 0) {
      // Set a new timeout for debouncing
      const timeoutId = setTimeout(async () => {
        try {
          const res = await api.get(`/api/user/search?query=${encodeURIComponent(query)}`);
          const data = res.data;
          const conversationUserIds = users.map(u => u._id);
          const filteredSuggestions = data.users.filter(userItem =>
            userItem._id !== currentUserId && !conversationUserIds.includes(userItem._id)
          ).slice(0, 5); // Limit to 5 suggestions
          setSearchSuggestions(filteredSuggestions);
          setShowSearchDropdown(true);
        } catch (err) {
          // console.error("Error searching users:", err);
          setSearchSuggestions([]);
          setShowSearchDropdown(false);
        }
      }, 300); // 300ms delay
      setSearchTimeout(timeoutId);
    } else {
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
    }
  };

  // Function to select a user from search suggestions (do not add to left panel until first message)
  const selectUserFromSearch = async (selectedUser) => {
    try {
      // Only open chat view without adding to left list until a message exists
      // Initialize local message array but don't push into users list yet
      setMessages(prev => ({ ...prev, [selectedUser._id]: prev[selectedUser._id] || [] }));

      // Select the user for chat (right panel)
      setSelectedUser(selectedUser);

      // Clear search
      setSearchQuery('');
      setSearchSuggestions([]);
      setShowSearchDropdown(false);

      // Initialize unread count for this user locally
      setUnreadCounts(prev => ({ ...prev, [selectedUser._id]: prev[selectedUser._id] || 0 }));

    } catch (err) {
      // console.error("Error adding user to conversation list:", err);
      setError('Failed to add user to conversation list');
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setClickDropdownTwo(false); // Close file options when opening emoji picker
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    // Check file size and type for each file
    const maxSize = 10 * 1024 * 1024; // 10MB - more reasonable for chat files
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/quicktime',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'application/zip', 'application/x-rar-compressed'
    ];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setPopup({
          show: true,
          message: `${file.name}: File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`
        });
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setPopup({
          show: true,
          message: `${file.name}: File type not supported. Allowed types: Images, Videos, PDFs, Documents, Archives, and Text files.`
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setShowEmojiPicker(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles.length || !selectedUser) return;
    setIsUploading(true);
    setUploadProgress(0);

    for (const file of selectedFiles) {
      try {
        const sigRes = await api.get("/api/cloudinary-signature");
        const { timestamp, signature, apiKey, cloudName, folder } = sigRes.data;

        // Validate Cloudinary configuration
        if (!timestamp || !signature || !apiKey || !cloudName) {
          throw new Error('Invalid Cloudinary configuration');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: 'POST', body: formData }
        );

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error?.message || 'Cloudinary upload failed');
        }

        const data = await uploadRes.json();

        // Success: use Cloudinary URL
        const fileMessage = {
          from: currentUserId,
          to: selectedUser._id,
          message: `📎 ${file.name}`,
          fileUrl: data.secure_url,
          fileType: file.type,
          fileName: file.name,
          timestamp: new Date(),
          read: false,
          replyTo: null
        };

        // Save file message to backend for persistence
        try {
          await api.post("/api/messages", fileMessage);
        } catch (saveError) {
          // console.warn('Error saving message to backend:', saveError);
        }

        // Add message to sender's local state immediately
        setMessages(prev => {
          const newMessages = {
            ...prev,
            [selectedUser._id]: [...(prev[selectedUser._id] || []), fileMessage]
          };
          return newMessages;
        });

        // Only add user to left panel if they're not already there
        setUsers(prev => {
          const exists = prev.some(u => u._id === selectedUser._id);
          return exists ? prev : [selectedUser, ...prev];
        });

        socket.current.emit('send-msg', {
          from: currentUserId,
          to: selectedUser._id,
          message: fileMessage.message,
          fileUrl: fileMessage.fileUrl,
          fileType: fileMessage.fileType,
          fileName: fileMessage.fileName,
          replyTo: fileMessage.replyTo
        });

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

      } catch (cloudinaryError) {
        // console.error('Cloudinary upload failed:', cloudinaryError);

        // Fallback: upload to backend for local storage
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('from', currentUserId);
          formData.append('to', selectedUser._id);
          const uploadUrl = `/api/cloudinary-signature/upload-file`;
          const response = await api.post(uploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const data = response.data;

          // Success: use local file URL
          const fileMessage = {
            from: currentUserId,
            to: selectedUser._id,
            message: `📎 ${file.name}`,
            fileUrl: data.fileUrl,
            fileType: file.type,
            fileName: file.name,
            timestamp: new Date(),
            read: false,
            replyTo: null
          };

          // Add message to sender's local state immediately
          setMessages(prev => {
            const newMessages = {
              ...prev,
              [selectedUser._id]: [...(prev[selectedUser._id] || []), fileMessage]
            };
            return newMessages;
          });

          setUsers(prev => {
            const exists = prev.some(u => u._id === selectedUser._id);
            return exists ? prev : [selectedUser, ...prev];
          });

          socket.current.emit('send-msg', {
            from: currentUserId,
            to: selectedUser._id,
            message: fileMessage.message,
            fileUrl: fileMessage.fileUrl,
            fileType: fileMessage.fileType,
            fileName: fileMessage.fileName,
            replyTo: fileMessage.replyTo
          });

          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);

        } catch (fallbackError) {
          // console.error('Both Cloudinary and backend upload failed:', fallbackError);
          setPopup({
            show: true,
            message: `Failed to upload ${file.name}. Please try again or contact support.`
          });
        }
      }
    }
    setSelectedFiles([]);
    setIsUploading(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Date helpers for day grouping and label rendering
  const isSameDay = (a, b) => {
    if (!a || !b) return false;
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate();
  };

  const formatDateLabel = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const labelDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (labelDate.getTime() === today.getTime()) return 'Today';
    if (labelDate.getTime() === yesterday.getTime()) return 'Yesterday';

    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateUnreadCount = (userId) => {
    const userMessages = messages[userId] || [];
    const unreadMessages = userMessages.filter(msg => msg.from === userId && !msg.read);
    const unreadCount = unreadMessages.length;
    return unreadCount;
  };

  const scrollToFirstUnreadMessage = () => {
    if (!messageContainerRef.current || !selectedUser) return;

    const userMessages = messages[selectedUser._id] || [];
    const normalizedSelectedUserId = normalizeUserId(selectedUser._id);
    // Prefer stored boundary index to avoid race with read flag updates
    const targetIndex = (newMessagesStartIndex !== null && newMessagesStartIndex !== -1) ? newMessagesStartIndex : userMessages.findIndex(msg => normalizeUserId(msg.from) === normalizedSelectedUserId && !msg.read);

    if (targetIndex !== -1 && targetIndex !== null) {
      const messageElements = messageContainerRef.current.children;
      if (messageElements[targetIndex]) {
        messageElements[targetIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        return;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getLastMessage = (userId) => {
    const safeMessages = messages || {};
    const userMessages = safeMessages[userId] || [];
    if (userMessages.length === 0) return 'No conversation';

    const lastMessage = userMessages[userMessages.length - 1];
    const isFromCurrentUser = lastMessage.from === currentUserId;
    const prefix = isFromCurrentUser ? 'You: ' : '';
    const messageText = lastMessage.message && lastMessage.message.length > 10 ? lastMessage.message.substring(0, 10) + '...' : lastMessage.message || '';
    return prefix + messageText;
  };

  const getLastMessageTime = (userId) => {
    const safeMessages = messages || {};
    const userMessages = safeMessages[userId] || [];
    if (userMessages.length === 0) return '';
    const lastMessage = userMessages[userMessages.length - 1];
    return lastMessage && lastMessage.timestamp ? formatTime(lastMessage.timestamp) : '';
  };

  const getLastMessageTimestamp = (userId) => {
    const safeMessages = messages || {};
    const userMessages = safeMessages[userId] || [];
    if (userMessages.length === 0) return new Date(0);
    const lastMessage = userMessages[userMessages.length - 1];
    return lastMessage && lastMessage.timestamp ? new Date(lastMessage.timestamp) : new Date(0);
  };

  const getLastMessageStatus = (userId) => {
    const safeMessages = messages || {};
    const userMessages = safeMessages[userId] || [];
    if (userMessages.length === 0) return null;

    const lastMessage = userMessages[userMessages.length - 1];
    // Only show status for messages sent by current user
    if (lastMessage && lastMessage.from === currentUserId) {
      return lastMessage.read ? '✓✓' : '✓';
    }
    return null;
  };

  // Left panel list: show only users with whom you have chat history, filtered by search
  const getFilteredUsers = () => {
    const query = searchQuery.trim().toLowerCase();
    const baseUsers = (users || []).filter(u => u && u._id);
    if (!query) return baseUsers;
    return baseUsers.filter((userItem) =>
      (userItem.name && userItem.name.toLowerCase().includes(query)) ||
      (userItem.username && userItem.username.toLowerCase().includes(query)) ||
      (userItem.email && userItem.email.toLowerCase().includes(query))
    );
  };

  // Close emoji picker and dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
      if (clickDropdowntwo && !event.target.closest('.file-dropdown-container')) {
        setClickDropdownTwo(false);
      }
      if (clickDropdown && !event.target.closest('.settings-dropdown-container')) {
        setClickDropdown(false);
      }
      if (showSearchDropdown && !event.target.closest('.chat-list-search-box')) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup search timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [showEmojiPicker, clickDropdowntwo, clickDropdown, showSearchDropdown, searchTimeout]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // ✅ Get conversations for the logged-in user
        // Use the correct conversations endpoint directly
        let conversationsData = [];
        try {
          const conversationsRes = await api.get(`/api/conversations/${currentUserId}`);
          conversationsData = conversationsRes.data;
        } catch (error) {
          // console.error("Failed to fetch conversations:", error);
          conversationsData = [];
        }

        if (Array.isArray(conversationsData) && conversationsData.length > 0) {
          // Extract user IDs from conversations and build messages
          const conversationUserIds = [];
          const allMessages = {};
          const usersWithConversations = [];

          conversationsData.forEach((conversation, index) => {
            const normalizedParticipants = (conversation.participants || []).map((p) =>
              typeof p === 'string' ? { _id: p } : p
            );
            // Find the other participant (not the current user)
            const otherParticipant = normalizedParticipants.find(p => String(p._id) !== String(currentUserId));
            if (otherParticipant) {
              conversationUserIds.push(otherParticipant._id);
              // Add user to the list
              usersWithConversations.push({
                _id: otherParticipant._id,
                name: otherParticipant.name || 'User',
                username: otherParticipant.username || '',
                email: otherParticipant.email || '',
                profileImage: otherParticipant.profileImage || otherParticipant.profilePicture || null
              });
              // Build messages for this conversation (may be empty)
              const convMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
              allMessages[otherParticipant._id] = convMessages.map((msg) => ({
                from: msg.from,
                message: msg.message,
                read: msg.read,
                timestamp: msg.timestamp,
                fileUrl: msg.fileUrl,
                fileType: msg.fileType,
                fileName: msg.fileName,
                replyTo: msg.replyTo,
                isDeleted: msg.isDeleted
              }));
            }
          });

          setMessages(allMessages);
          // Deduplicate users by _id in case of duplicates
          const uniqueUsers = usersWithConversations.filter((u, idx, arr) =>
            idx === arr.findIndex(x => String(x._id) === String(u._id))
          );
          setUsers(uniqueUsers);

          // Calculate initial unread counts
          const initialUnreadCounts = {};
          usersWithConversations.forEach(userItem => {
            const unreadCount = calculateUnreadCount(userItem._id);
            initialUnreadCounts[userItem._id] = unreadCount;
          });
          setUnreadCounts(initialUnreadCounts);


        } else {
          setUsers([]);
          setMessages({});
        }
      } catch (err) {
        // console.error("Error fetching users and conversations:", err);
        setError(err.message);
      }
    };

    if (currentUserId) fetchUsers();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    // Use the centralized socket connection
    const socketInstance = connectSocket(api.defaults.baseURL);

    if (socketInstance) {
      socket.current = socketInstance;

      // Emit add-user when connected
      if (socketInstance.connected) {
        socketInstance.emit('add-user', currentUserId);
      } else {
        socketInstance.on('connect', () => {
          socketInstance.emit('add-user', currentUserId);
        });
      }

      socketInstance.on('online-users', (online) => {
        setOnlineUsers(online);
      });

      socketInstance.on('msg-receive', (data) => {
        setMessages((prev) => {
          const userId = data.from === currentUserId ? data.to : data.from;
          const userMessages = prev[userId] || [];

          // Check for duplicate messages to prevent multiple additions
          const newMessage = {
            from: data.from,
            message: data.message,
            fileUrl: data.fileUrl,
            fileType: data.fileType,
            fileName: data.fileName,
            read: false,
            timestamp: data.timestamp || new Date(),
            replyTo: data.replyTo
          };

          // Create a unique key for the message to check for duplicates (same format as mergeMessages)
          const messageKey = `${data.timestamp || new Date()}-${data.message || ''}-${data.from}-${data.fileUrl || ''}-${data.fileType || ''}`;
          const isDuplicate = userMessages.some(msg => {
            const existingKey = `${msg.timestamp}-${msg.message || ''}-${msg.from}-${msg.fileUrl || ''}-${msg.fileType || ''}`;
            return existingKey === messageKey;
          });

          // Only add the message if it's not a duplicate
          if (isDuplicate) {
            return prev;
          }

          return {
            ...prev,
            [userId]: [...userMessages, newMessage]
          };
        });
        // Only add the other user to left panel if they're not already there (ensures only users with actual conversations appear)
        const otherId = data.from === currentUserId ? data.to : data.from;
        if (otherId !== currentUserId) {
          // Try to find the user in existing users list; otherwise fetch minimal details from search pool
          setUsers(prev => {
            if (prev.some(u => u._id === otherId)) return prev;

            // Fallback: synthesize minimal object to show; will get enriched immediately
            // Trigger async fetch for user details
            const fetchNewUserDetails = async () => {
              try {
                const res = await api.get(`/api/users/${otherId}`);
                const newUser = res.data;
                setUsers(currentUsers => currentUsers.map(u =>
                  u._id === otherId ? {
                    ...u,
                    name: newUser.name,
                    username: newUser.username,
                    email: newUser.email,
                    profileImage: newUser.profileImage
                  } : u
                ));
              } catch (err) {
                // console.error("Failed to fetch new user details:", err);
              }
            };
            fetchNewUserDetails();
            return [{ _id: otherId, name: 'User', username: '', email: '', profileImage: null }, ...prev];
          });
        }

        // Increment unread count for received messages
        if (data.from !== currentUserId) {
          setUnreadCounts((prev) => ({
            ...prev,
            [data.from]: (prev[data.from] || 0) + 1
          }));
        }
      });

      socketInstance.on('msg-read', (data) => {
        setReadStatus((prev) => ({ ...prev, [data.from]: true }));

        // Update message read status for messages sent by this user to the user who just read them
        setMessages((prev) => {
          const updatedMessages = { ...prev };
          if (updatedMessages[data.from]) {
            updatedMessages[data.from] = updatedMessages[data.from].map(msg =>
              normalizeUserId(msg.from) === normalizedCurrentUserId ? { ...msg, read: true } : msg
            );
          }
          return updatedMessages;
        });
      });

      // Listen for real-time message deletion (soft-delete instead of removing)
      socketInstance.on('delete-msg', (data) => {
        setMessages(prev => {
          // The event is sent to the recipient; conversation key is the sender's id
          const conversationKey = data.from;
          const userMessages = prev[conversationKey] || [];
          return {
            ...prev,
            [conversationKey]: userMessages.map(msg =>
              String(msg.timestamp) === String(data.messageTimestamp) ? { ...msg, message: 'This message was deleted', isDeleted: true } : msg
            )
          };
        });
      });

      // Listen for real-time chat clear
      socketInstance.on('clear-chat', (data) => {
        setMessages(prev => ({
          ...prev,
          [data.from]: []
        }));
      });
    }
    return () => {
      // Don't disconnect here, let the socket context manage the connection
    };
  }, [currentUserId, connectSocket]);

  // Fetch chat history when a user is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !currentUserId) return;
      // Reset divider state for fresh computation on new selection
      setNewMessagesStartIndex(null);
      setShowNewMessagesDivider(false);
      try {
        const res = await api.get(`/api/messages?from=${currentUserId}&to=${selectedUser._id}`);
        const data = res.data;
        // Helper function to merge messages and avoid duplicates
        const mergeMessages = (existingMessages, newMessages) => {
          const messageMap = new Map();
          // Add existing messages to map
          existingMessages.forEach(msg => {
            // Create a more comprehensive key that includes file info for better deduplication
            const key = `${msg.timestamp}-${msg.message || ''}-${msg.from}-${msg.fileUrl || ''}-${msg.fileType || ''}`;
            messageMap.set(key, msg);
          });
          // Add new messages, overwriting duplicates
          newMessages.forEach(msg => {
            // Create a more comprehensive key that includes file info for better deduplication
            const key = `${msg.timestamp}-${msg.message || ''}-${msg.from}-${msg.fileUrl || ''}-${msg.fileType || ''}`;
            messageMap.set(key, msg);
          });
          // Convert back to array and sort by timestamp
          return Array.from(messageMap.values()).sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
          );
        };
        setMessages((prev) => {
          // For refresh scenarios, replace existing messages with server data to avoid timestamp conflicts
          const newMessages = data.map((msg) => ({
            from: msg.from,
            message: msg.message,
            read: msg.read,
            timestamp: msg.timestamp,
            fileUrl: msg.fileUrl,
            fileType: msg.fileType,
            fileName: msg.fileName,
            replyTo: msg.replyTo,
            isDeleted: msg.isDeleted
          }));
          return {
            ...prev,
            [selectedUser._id]: newMessages
          };
        });
        // Compute boundary and check unread messages from selected user
        const normalizedSelectedUserId = normalizeUserId(selectedUser._id);
        const firstUnreadIndex = data.findIndex(msg => normalizeUserId(msg.from) === normalizedSelectedUserId && !msg.read);
        setNewMessagesStartIndex(firstUnreadIndex !== -1 ? firstUnreadIndex : null);
        setShowNewMessagesDivider(firstUnreadIndex !== -1);
        const unreadMessages = data.filter(msg => normalizeUserId(msg.from) === normalizedSelectedUserId && !msg.read);
        // Only mark messages as read if there are actually unread messages
        if (unreadMessages.length > 0) {
          await api.post(`/api/messages/read`, {
            from: selectedUser._id,
            to: currentUserId
          });
          socket.current.emit('message-read', { from: currentUserId, to: selectedUser._id });
          setReadStatus((prev) => ({ ...prev, [selectedUser._id]: true }));
          // Update messages to mark them as read for incoming messages
          const normalizedSelectedUserIdForMarking = normalizeUserId(selectedUser._id);
          setMessages((prev) => ({
            ...prev,
            [selectedUser._id]: (prev[selectedUser._id] || []).map(msg => ({
              ...msg,
              read: normalizeUserId(msg.from) === normalizedSelectedUserIdForMarking ? true : msg.read
            }))
          }));
        }
        // Update unread counts after marking messages as read
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedUser._id]: 0
        }));
      } catch (err) {
        setError(err.message);
      }
    };
    fetchMessages();
  }, [selectedUser, currentUserId]);

  // Calculate unread counts whenever messages change
  useEffect(() => {
    const newUnreadCounts = {};
    Object.keys(messages).forEach(userId => {
      newUnreadCounts[userId] = calculateUnreadCount(userId);
    });
    // console.log("Updating unread counts:", newUnreadCounts);
    setUnreadCounts(newUnreadCounts);
  }, [messages, selectedUser]);

  // Scroll to first unread message when messages are loaded
  useEffect(() => {
    if (selectedUser && messages[selectedUser._id]) {
      setTimeout(() => {
        scrollToFirstUnreadMessage();
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [messages, selectedUser, newMessagesStartIndex]);

  const handleMessageSelection = (messageIndex) => {
    if (!isSelectionMode) return;
    if (!selectedUser) return;
    const userMessages = messages[selectedUser._id] || [];
    const msg = userMessages[messageIndex];
    if (!msg) return;
    // Only allow selecting your own, non-deleted messages
    if (normalizeUserId(msg.from) !== normalizedCurrentUserId) return;
    if (msg.isDeleted || msg.message === 'This message was deleted') return;
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageIndex)) {
        newSet.delete(messageIndex);
      } else {
        newSet.add(messageIndex);
      }
      return newSet;
    });
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedMessages.size} selected message(s)?`)) {
      try {
        const userMessages = messages[selectedUser._id] || [];
        const selectedMessageData = Array.from(selectedMessages)
          .map(index => userMessages[index])
          .filter(msg => normalizeUserId(msg.from) === normalizedCurrentUserId) // Only allow deletion of user's own messages
          .map(msg => ({
            timestamp: msg.timestamp,
            message: msg.message,
            from: msg.from
          }));

        const requestBody = {
          messages: selectedMessageData,
          from: currentUserId,
          to: selectedUser._id
        };
        const response = await api.delete(`/api/messages/delete-selected`, {
          data: requestBody
        });
        const responseData = response.data;
        // Refresh messages from server to ensure consistency
        const refreshRes = await api.get(
          `/api/messages?from=${currentUserId}&to=${selectedUser._id}`
        );
        const refreshData = refreshRes.data;
        if (refreshData) {
          setMessages(prev => ({
            ...prev,
            [selectedUser._id]: refreshData.map((msg) => ({
              from: msg.from,
              message: msg.message,
              read: msg.read,
              timestamp: msg.timestamp,
              fileUrl: msg.fileUrl,
              fileType: msg.fileType,
              fileName: msg.fileName,
              replyTo: msg.replyTo,
              isDeleted: msg.isDeleted
            }))
          }));
        } else {
          setMessages(prev => ({
            ...prev,
            [selectedUser._id]: (prev[selectedUser._id] || []).filter((msg, index) =>
              !selectedMessages.has(index)
            )
          }));
        }
        // Emit socket event for real-time bulk deletion
        selectedMessageData.forEach(msg => {
          socket.current.emit('delete-msg', {
            from: currentUserId,
            to: selectedUser._id,
            messageTimestamp: msg.timestamp
          });
        });
        // Exit selection mode
        setIsSelectionMode(false);
        setSelectedMessages(new Set());
      } catch (error) {
        // console.error('Error deleting selected messages:', error);
        alert('Failed to delete messages. Please try again.');
      }
    }
  };

  const handleMessageClick = (msg, idx, event) => {
    if (normalizeUserId(msg.from) === normalizedCurrentUserId) {
      event.preventDefault();
      setContextMenu({ idx, x: event.clientX, y: event.clientY });
    }
  };

  const handleDeleteSingleMessage = async (idx) => {
    if (!selectedUser) return;
    const userMessages = messages[selectedUser._id] || [];
    const msg = userMessages[idx];
    if (!msg || msg.from !== currentUserId) return;
    const confirmed = await DeleteAlert({});
    if (!confirmed) return;
    try {
      const requestBody = {
        messages: [{
          timestamp: new Date(msg.timestamp).toISOString(),
          message: msg.message,
          from: msg.from
        }],
        from: currentUserId,
        to: selectedUser._id
      };
      const response = await api.delete(`/api/messages/delete-selected`, {
        data: requestBody
      });
      const responseData = response.data;
      // Optimistically mark as deleted locally (soft-delete)
      setMessages(prev => ({
        ...prev,
        [selectedUser._id]: (prev[selectedUser._id] || []).map((m, i) =>
          i === idx ? { ...m, message: 'This message was deleted', isDeleted: true } : m
        )
      }));

      // Emit socket event for real-time deletion
      socket.current.emit('delete-msg', {
        from: currentUserId,
        to: selectedUser._id,
        messageTimestamp: msg.timestamp
      });

      // Refresh messages from server to ensure consistency
      try {
        const refreshRes = await api.get(`/api/messages?from=${currentUserId}&to=${selectedUser._id}`);
        const refreshData = refreshRes.data;
        if (refreshData) {
          setMessages(prev => ({
            ...prev,
            [selectedUser._id]: refreshData.map((srvMsg) => ({
              from: srvMsg.from,
              message: srvMsg.message,
              read: srvMsg.read,
              timestamp: srvMsg.timestamp,
              fileUrl: srvMsg.fileUrl,
              fileType: srvMsg.fileType,
              fileName: srvMsg.fileName,
              replyTo: srvMsg.replyTo
            }))
          }));
        }
      } catch (e) {
      }
    } catch (error) {
      // console.error('Error deleting message:', error);
      alert('Failed to delete message: ' + error.message);
    } finally {
      setContextMenu(null);
    }
  };

  const handleReplyToMessage = (msg) => {
    setReplyTo(msg);
    setContextMenu(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;
    // Prepare replyTo object if replying
    const replyToObj = replyTo ? {
      message: replyTo.message,
      timestamp: replyTo.timestamp,
      from: replyTo.from,
      username: replyTo.username || (selectedUser && selectedUser.username)
    } : undefined;
    // Send to backend for persistence
    try {
      await api.post(`/api/messages`, {
        from: currentUserId,
        to: selectedUser._id,
        message,
        replyTo: replyToObj
      });
    } catch {
      setError('Failed to send message');
    }
    // Send via socket for real-time
    setMessages((prev) => {
      const userMessages = prev[selectedUser._id] || [];
      return {
        ...prev,
        [selectedUser._id]: [...userMessages, {
          from: currentUserId,
          message,
          read: false,
          timestamp: new Date(),
          replyTo: replyToObj
        }]
      };
    });
    // Only add user to left panel if they're not already there (this ensures only users with actual conversations appear)
    setUsers(prev => {
      const exists = prev.some(u => u._id === selectedUser._id);
      return exists ? prev : [selectedUser, ...prev];
    });
    setReadStatus((prev) => ({ ...prev, [selectedUser._id]: false }));
    socket.current.emit('send-msg', {
      to: selectedUser._id,
      from: currentUserId,
      message,
      replyTo: replyToObj
    });
    setMessage('');
    setReplyTo(null);
  };
  // Test Cloudinary configuration
  const testCloudinaryConfig = async () => {
    try {
      const response = await api.get(`/api/cloudinary-signature/test-cloudinary`);
      const data = response.data;
      if (data.message) {
        setPopup({
          show: true,
          message: `Cloudinary Test: ${data.message}`
        });
      }
      return data;
    } catch (error) {
      // console.error('Failed to test Cloudinary config:', error);
      setPopup({
        show: true,
        message: `Cloudinary test failed: ${error.message}`
      });
      return null;
    }
  };

  const checkEnvironment = async () => {
    try {
      const response = await api.get(`/api/cloudinary-signature/env-check`);
      const data = response.data;
      if (!data || !data.cloudinary) {
        // console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from server');
      }
      const message = `Environment Check:\n\nCloudinary:\n- Cloud Name: ${data.cloudinary.cloud_name}\n- API Key: ${data.cloudinary.api_key}\n- API Secret: ${data.cloudinary.api_secret}\n\nUploads:\n- Directory: ${data.uploads.directory}\n- Exists: ${data.uploads.exists}\n- Writable: ${data.uploads.writable}`;
      setPopup({
        show: true,
        message: message
      });
      return data;
    } catch (error) {
      // console.error('Failed to check environment:', error);
      setPopup({
        show: true,
        message: `Failed to check environment: ${error.message}`
      });
      return null;
    }
  };

  // Simple ping test to verify routing
  const testPing = async () => {
    try {
      const response = await api.get(`/api/cloudinary-signature/ping`);
      const data = response.data;
      setPopup({
        show: true,
        message: `Ping test successful: ${data.message}`
      });
      return data;
    } catch (error) {
      // console.error('Failed to ping:', error);
      setPopup({
        show: true,
        message: `Ping test failed: ${error.message}`
      });
      return null;
    }
  };

  return (
    <div className='p-4' style={{ display: 'flex', flexDirection: 'column', }}>

      {/* Main content */}
      <div className="">
        <div className="d-flex flex-wrap gap-10" style={{ height: 'calc(100vh - 100px)', }}>
          {/* Left panel: User list */}
          <div className={`col-12 col-lg-3 left-pannel ${isMobileMenuOpen ? 'd-block' : 'd-none d-lg-block'}`} style={{ overflowY: 'auto' }}>
            <div className="h-100 border rounded p-3 bg-white shadow-sm d-flex flex-column mobile-panel-height">

              <div style={{ flexShrink: 0 }}>
                <span style={{ fontWeight: '500', fontSize: '20px' }}>Chats</span>
                {/* Search Box */}
                <div style={{ marginBottom: '15px', padding: '0px 10px', position: 'relative' }} className="chat-list-search-box" >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                    <CiSearch style={{ fontSize: '20px' }} />
                    <input
                      type="search"
                      placeholder="Search"
                      className="chat-list-search-input"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      style={{
                        width: '100%',
                        outline:'none'
                      }}
                    />
                  </div>
                  {/* Search Suggestions Dropdown */}
                  {showSearchDropdown && searchSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0px',
                      right: '10px',
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      width:"100%",
                      overflowY: 'auto'
                    }}>
                      {searchSuggestions.map((userItem) => (
                        <div
                          key={userItem._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            gap: '10px'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          onClick={() => selectUserFromSearch(userItem)}
                        >
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {/* User Avatar */}
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#007AFF',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              border: '2px solid #ddd',
                              position: 'relative'
                            }}>
                              {(userItem.name || userItem.email || 'U').slice(0, 1).toUpperCase()}
                              {getProfileImageUrl(userItem) && (
                                <img
                                  src={getProfileImageUrl(userItem)}
                                  alt={userItem.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                            {/* User Info */}
                            <div style={{}}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                {userItem.name}
                                <br />
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                  {userItem.email}
                                </span>
                              </span>
                            </div>
                          </div>
                          {/* Start Conversation Button */}
                          <div style={{
                            fontSize: '12px',
                            color: '#007AFF',
                            fontWeight: 'bold'
                          }}>
                            Start Chat
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {error && <div style={{ color: 'red' }}>{error}</div>}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, overflowY: 'auto', flex: 1, marginTop: '1px' }} className="chat-list-usersection">
                {getFilteredUsers().length > 0 ? (
                  getFilteredUsers()
                    .sort((a, b) => {
                      const aTimestamp = getLastMessageTimestamp(a._id);
                      const bTimestamp = getLastMessageTimestamp(b._id);
                      return bTimestamp - aTimestamp; // Sort by most recent first
                    })
                    .map((userItem) => (
                      <li
                        key={userItem._id}
                        className="chat-list-user"
                        style={{
                          background: selectedUser && selectedUser._id === userItem._id ? '#E3F3FF' : 'transparent',
                          // padding: '12px 15px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          // margin: '12px',
                          borderRadius: '5px',
                          borderBottom: '1px solid #f0f0f0',
                          overflowY: 'hidden',
                        }}
                        onClick={() => {
                          setSelectedUser(userItem);
                          // Immediately clear unread count for this user
                          setUnreadCounts((prev) => ({
                            ...prev,
                            [userItem._id]: 0
                          }));
                          // Close mobile menu when user is selected
                          setIsMobileMenuOpen(false);
                          // console.log("Selected user:", userItem._id, "Clearing unread count");
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: getProfileImageUrl(userItem) ? '#eee' : '#007AFF',
                              color: 'white',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              border: '2px solid #ddd',
                              display: 'flex',
                              position: 'relative',
                              textAlign: 'center',
                            }} className='chat-list-user-img'>
                              {/* Initials (always present) */}
                              {(userItem.name || 'U').slice(0, 1).toUpperCase()}
                              {getProfileImageUrl(userItem) && (
                                <img
                                  src={getProfileImageUrl(userItem)}
                                  alt={userItem.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                  }}
                                  className='chat-list-user-img'
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              {onlineUsers.includes(normalizeUserId(userItem._id)) && (
                                <div style={{ position: 'absolute', top: '-10px', right: '-2px', zIndex: 1 }}>
                                  <span style={{ color: 'rgb(43, 216, 66)', fontSize: 21, }}>●</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* name and message */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold' }} className='chat-list-user-name'>
                                {(userItem.name || userItem.email || 'User')}
                              </span>
                            </div>
                            <span style={{
                              color: '#666',
                              marginTop: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '150px'
                            }} className='chat-list-user-msg'>
                              {getLastMessage(userItem._id)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{
                            color: '#999',
                            whiteSpace: 'nowrap'
                          }} className='chat-list-user-time'>
                            {getLastMessageTime(userItem._id)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {getLastMessageStatus(userItem._id) && (
                              <span style={{
                                fontSize: '10px',
                                color: getLastMessageStatus(userItem._id) === '✓✓' ? 'rgb(43, 216, 66)' : '#999'
                              }}>
                                {getLastMessageStatus(userItem._id)}
                              </span>
                            )}
                            {(() => {
                              const count = unreadCounts[userItem._id] || 0;
                              // console.log(`Badge check for user ${userItem._id} (${userItem.name}): count=${count}, show=${count > 0}`);
                              return count > 0 ? (
                                <span style={{
                                  backgroundColor: 'orange',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  minWidth: '20px'
                                }}>
                                  {count}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </li>
                    ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    {searchQuery ? <span> No users found matching your search</span> : (<span>No chat history yet. <br /> Start a conversation to see users here.</span>)}
                  </div>
                )}
              </ul>
            </div>
          </div>

          {/* Right panel: Chat area */}
          <div className={`col-12 col-lg-9 right-pannel ${isMobileMenuOpen ? 'd-none d-lg-block' : 'd-block'}`} style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
            <div className="h-100 d-flex flex-column bg-white border rounded shadow-sm mobile-panel-height">
              {selectedUser ? (
                <>
                  {/* friend header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgb(231, 230, 230)', padding: '10px 15px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div className="d-lg-none bg-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <button
                            className="btn"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            style={{ border: 'none', background: 'transparent' }}
                          >
                            {isMobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
                          </button>
                        </div>
                      </div>

                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: getProfileImageUrl(selectedUser) ? '#eee' : '#007AFF',
                        color: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        border: '2px solid #ddd',
                        display: 'flex',
                        position: 'relative'
                      }}>
                        {(selectedUser.name || 'U').slice(0, 1).toUpperCase()}
                        {getProfileImageUrl(selectedUser) && (
                          <img
                            src={getProfileImageUrl(selectedUser)}
                            alt={selectedUser.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <span><b>{selectedUser.name}</b></span>
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          {onlineUsers.includes(normalizeUserId(selectedUser._id)) ? (
                            <span style={{ color: 'rgb(43, 216, 66)', fontSize: 20 }}>●</span>
                          ) : (
                            <span style={{ color: 'rgba(228, 226, 226, 1)', fontSize: 20 }}>●</span>
                          )}
                          <span style={{ color: 'rgb(182, 180, 180)' }}>{onlineUsers.includes(normalizeUserId(selectedUser._id)) ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>

                    {isSelectionMode ? (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px' }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          {selectedMessages.size} selected
                        </span>
                        <button
                          onClick={handleDeleteSelectedMessages}
                          disabled={selectedMessages.size === 0}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: selectedMessages.size === 0 ? '#ccc' : '#ff4757',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedMessages.size === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete ({selectedMessages.size})
                        </button>
                        <button
                          onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedMessages(new Set());
                          }}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: "grey", position: "relative", marginTop: '8px', marginRight: '10px' }}>
                          <div style={{ display: 'flex', gap: '20px', fontSize: '20px' }}>
                            {/* <span><CiSearch /></span> */}
                            <span onClick={() => setClickDropdown(!clickDropdown)} style={{ transform: 'rotate(90deg)', cursor: 'pointer' }}>
                              <HiOutlineDotsVertical className="threedot-setting" />
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {clickDropdown && (
                      <div
                        className="settings-dropdown-container"
                        style={{
                          position: "absolute",
                          top: "100px",
                          right: "55px",
                          zIndex: "100",
                        }}
                      >
                        <div>
                          <div
                            className="setting-notification-container"
                            style={{
                              backgroundColor: "white",
                              width: "200px",
                              height: "auto",
                              border: "1px solid #dfd8d8",
                              padding: "10px 15px",
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: '10px'
                            }}
                          >
                            {/* <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <IoVolumeMuteOutline style={{ color: "#4a4848" }} />
                            <span style={{ color: "#4a4848" }}>Mute Notification</span>
                          </div>
                          <br />
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <GoClock style={{ color: "#4a4848" }} />
                            <span style={{ color: "#4a4848" }}>Disappearing</span>
                          </div>
                          <br /> */}
                            <div
                              style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to clear all messages in this conversation?')) {
                                  try {
                                    // const token = localStorage.getItem('token');
                                    await api.delete(`/api/messages/clear`, {
                                      data: {
                                        from: currentUserId,
                                        to: selectedUser._id
                                      }
                                    });
                                    // Clear messages from local state
                                    setMessages(prev => ({
                                      ...prev,
                                      [selectedUser._id]: []
                                    }));
                                    // Emit socket event for real-time chat clear
                                    socket.current.emit('clear-chat', {
                                      from: currentUserId,
                                      to: selectedUser._id
                                    });
                                    // Close the dropdown
                                    setClickDropdown(false);
                                  } catch (error) {
                                    // console.error('Error clearing messages:', error);
                                    alert('Failed to clear messages. Please try again.');
                                  }
                                }
                              }}
                            >
                              <TbClearAll style={{ color: "#4a4848" }} />
                              <span style={{ color: "#4a4848" }}>Clear Message</span>
                            </div>
                            <br />
                            <div
                              style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}
                              onClick={() => {
                                setIsSelectionMode(true);
                                setSelectedMessages(new Set());
                                setClickDropdown(false);
                              }}
                            >
                              <RiDeleteBinLine style={{ color: "#4a4848" }} />
                              <span style={{ color: "#4a4848" }}>Delete Chat</span>
                            </div>
                            {/* <br />
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <MdBlockFlipped style={{ color: "#4a4848" }} />
                            <span style={{ color: "#4a4848" }}>Block</span>
                          </div> */}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* message box */}
                  <div
                    ref={messageContainerRef}
                    style={{
                      height: 'calc(100vh - 200px)',
                      marginTop: 12,
                      marginBottom: 12,
                      padding: '32px',
                      minHeight: 'auto',
                      maxHeight: 'calc(100vh - 270px)',
                      overflowY: 'auto',
                    }}
                    onClick={() => setContextMenu(null)}
                  >
                    {(messages[selectedUser._id] || []).map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: normalizeUserId(msg.from) === normalizedCurrentUserId ? 'flex-end' : 'flex-start',
                          position: 'relative',
                          width: '100%'
                        }}
                        onClick={() => handleMessageSelection(idx)}
                      >
                        {/* Checkbox for selection mode */}
                        {isSelectionMode && normalizeUserId(msg.from) === normalizedCurrentUserId && !(msg.isDeleted || msg.message === 'This message was deleted') && (
                          <input
                            type="checkbox"
                            checked={selectedMessages.has(idx)}
                            onChange={() => handleMessageSelection(idx)}
                            style={{ position: 'absolute', top: 0, right: -30, zIndex: 2 }}
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                        {/* Reply preview above message row */}
                        {msg.replyTo && (
                          <div style={{
                            background: '#f1f1f1',
                            borderLeft: '3px solid #007AFF',
                            padding: '6px 10px',
                            marginBottom: 4,
                            borderRadius: 6,
                            maxWidth: 260,
                            fontSize: 12,
                            color: '#555',
                            textAlign: 'left',
                            alignSelf: normalizeUserId(msg.from) === normalizedCurrentUserId ? 'flex-end' : 'flex-start',
                            marginRight: normalizeUserId(msg.from) === normalizedCurrentUserId ? 0 : undefined,
                            marginLeft: normalizeUserId(msg.from) !== normalizedCurrentUserId ? 0 : undefined
                          }}>
                            <span style={{ fontWeight: 500, color: '#007AFF' }}>
                              {msg.replyTo.username ? msg.replyTo.username : (msg.replyTo.from === currentUserId ? 'You' : 'Friend')}
                            </span>
                            <br />
                            <span style={{ color: '#333' }}>{msg.replyTo.message}</span>
                          </div>
                        )}
                        {/* Date divider */}
                        {msg.timestamp && (idx === 0 || !isSameDay(msg.timestamp, (messages[selectedUser._id] || [])[idx - 1]?.timestamp)) && (
                          <div style={{ width: '100%', textAlign: 'center', margin: '8px 0' }}>
                            <span style={{
                              backgroundColor: '#E3F3FF',
                              color: 'black',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              border: '1px solid #007AFF',
                              fontSize: '12px'
                            }}>
                              {formatDateLabel(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        {/* NEW: Inline "New messages" divider within the message node */}
                        {showNewMessagesDivider && newMessagesStartIndex === idx && (
                          <div style={{ width: '100%', textAlign: 'center', margin: '8px 0' }}>
                            <span style={{
                              backgroundColor: '#fff3cd',
                              color: '#856404',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              border: '1px solid #ffeeba',
                              fontSize: '12px'
                            }}>
                              New messages
                            </span>
                          </div>
                        )}
                        {/* Message row: avatar + message bubble + menu */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: normalizeUserId(msg.from) === normalizedCurrentUserId ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            gap: '8px',
                            width: '100%'
                          }}
                        >
                          {/* Profile Picture */}
                          {/* <div style={{ flexShrink: 0 }}>
                      {normalizeUserId(msg.from) === normalizedCurrentUserId ? (
                        // Current user's profile picture
                        user?.profileImage ? (
                          <img 
                            src={Array.isArray(user.profileImage) && user.profileImage.length > 0 ? 
                              user.profileImage[0].url : 
                              (typeof user.profileImage === 'string' ? user.profileImage : 
                               (user.profileImage.url || user.profileImage))} 
                            alt={user?.name}
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              border: '2px solid #ddd'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              // e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              backgroundColor: '#007bff',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              border: '2px solid #ddd'
                            }}
                          >
                            {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                        )
                      ) : (
                        // Other user's profile picture
                        selectedUser?.profileImage ? (
                          <img 
                            src={selectedUser.profileImage} 
                            alt={selectedUser?.name}
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              border: '2px solid #ddd'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              // e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              backgroundColor: '#007AFF',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              border: '2px solid #ddd'
                            }}
                          >
                            {selectedUser?.name?.slice(0, 2).toUpperCase()}
                          </div>
                        )
                      } */}
                          {/* Message Content */}
                          <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: normalizeUserId(msg.from) === normalizedCurrentUserId ? 'flex-end' : 'flex-start', maxWidth: '70%',
                            background: normalizeUserId(msg.from) === normalizedCurrentUserId ? '#EBF7FF' : '#F9F9F9',
                            border: normalizeUserId(msg.from) === normalizedCurrentUserId ? '1px solid #BBE1FF' : '1px solid #E6E6E6',
                            padding: '6px 12px',
                            borderTopLeftRadius: normalizeUserId(msg.from) === normalizedCurrentUserId ? '12px' : '0px',
                            borderTopRightRadius: normalizeUserId(msg.from) === normalizedCurrentUserId ? '0px' : '12px',
                            borderBottomLeftRadius: '12px 12px',
                            borderBottomRightRadius: '12px 12px',
                            wordWrap: 'break-word',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            hyphens: 'auto',
                            minWidth: 0,
                          }}>
                            <div
                              style={{
                                display: 'inline-block',
                                margin: '2px 0',
                                cursor: msg.fileUrl ? 'pointer' : 'default',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                maxWidth: '100%',
                                minWidth: 0,
                              }}
                              onClick={msg.fileUrl && !(msg.isDeleted || msg.message === 'This message was deleted') ? () => window.open(msg.fileUrl, '_blank') : undefined}
                            >
                              {msg.message}
                              {msg.fileUrl && !(msg.isDeleted || msg.message === 'This message was deleted') && (
                                <div style={{ marginTop: '8px' }}>
                                  {msg.fileType?.startsWith('image/') && (
                                    <img
                                      src={msg.fileUrl}
                                      alt={msg.fileName || 'Image'}
                                      style={{
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(msg.fileUrl, '_blank');
                                      }}
                                    />
                                  )}
                                  {msg.fileType?.startsWith('video/') && (
                                    <video
                                      src={msg.fileUrl}
                                      controls
                                      style={{
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(msg.fileUrl, '_blank');
                                      }}
                                    />
                                  )}
                                  {msg.fileType === 'application/pdf' && (
                                    <div
                                      style={{
                                        padding: '8px',
                                        backgroundColor: '#f0f0f0',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(msg.fileUrl, '_blank');
                                      }}
                                    >
                                      <span role="img" aria-label="PDF">📄</span> {msg.fileName || 'PDF File'}
                                    </div>
                                  )}
                                  {/* For other file types, show a generic link */}
                                  {!msg.fileType?.startsWith('image/') && !msg.fileType?.startsWith('video/') && msg.fileType !== 'application/pdf' && (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF', textDecoration: 'underline' }}>
                                      {msg.fileName || 'Download file'}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <span style={{ fontSize: '10px', color: '#666' }}>
                                {msg.timestamp ? formatTime(msg.timestamp) : ''}
                              </span>
                              {normalizeUserId(msg.from) === normalizedCurrentUserId && (
                                <span style={{ fontSize: 10, color: msg.read ? 'rgb(43, 216, 66)' : '#999' }}>
                                  {msg.read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Show three-dots icon when not in selection mode.
                                  Hide only for your own deleted messages; still show for others' deleted messages */}
                          {!isSelectionMode && !(normalizeUserId(msg.from) === normalizedCurrentUserId && (msg.isDeleted || msg.message === 'This message was deleted')) && (
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                position: 'absolute',
                                top: 0,
                                right: normalizeUserId(msg.from) === normalizedCurrentUserId ? '-30px' : 'auto',
                                left: normalizeUserId(msg.from) !== normalizedCurrentUserId ? '-30px' : 'auto',
                                zIndex: 10,
                                padding: 2
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                // Menu size (should match the rendered menu)
                                const menuWidth = 70;
                                const menuHeight = 40;
                                let x = e.clientX;
                                let y = e.clientY;
                                // For your own messages, if menu would overflow right, show to the left
                                if (normalizeUserId(msg.from) === normalizedCurrentUserId) {
                                  // Find the chat area right edge
                                  const chatArea = e.target.closest('[style*="background-color:white"][style*="border-radius:10px"]');
                                  const chatAreaRect = chatArea ? chatArea.getBoundingClientRect() : null;
                                  const chatAreaRight = chatAreaRect ? chatAreaRect.right : window.innerWidth;
                                  if (x + menuWidth > chatAreaRight) {
                                    x = x - menuWidth;
                                  }
                                } else {
                                  if (x + menuWidth > window.innerWidth) {
                                    x = window.innerWidth - menuWidth - 8;
                                  }
                                }
                                if (y + menuHeight > window.innerHeight) {
                                  y = window.innerHeight - menuHeight - 8;
                                }
                                setContextMenu({ idx, x, y });
                              }}
                              title="Message options"
                            >
                              <HiOutlineDotsVertical style={{ fontSize: 18, color: '#888' }} />
                            </button>
                          )}
                          {/* Context menu for message */}
                          {contextMenu && contextMenu.idx === idx && (
                            <div
                              style={{
                                position: 'fixed',
                                top: contextMenu.y,
                                left: contextMenu.x,
                                background: 'white',
                                border: '1px solid #ccc',
                                borderRadius: 6,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                zIndex: 2000,
                                minWidth: 70,
                                minHeight: 40,
                                width: 70
                              }}
                            >
                              {normalizeUserId(msg.from) === normalizedCurrentUserId ? (
                                <div
                                  style={{ padding: '8px', cursor: 'pointer', textAlign: 'left' }}
                                  onClick={() => handleDeleteSingleMessage(idx)}
                                >
                                  Delete
                                </div>
                              ) : (
                                <div
                                  style={{ padding: '8px', cursor: 'pointer', textAlign: 'left' }}
                                  onClick={() => handleReplyToMessage({
                                    ...msg,
                                    username: selectedUser && selectedUser._id === msg.from ? selectedUser.name : undefined
                                  })}
                                >
                                  Reply
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* text message box */}
                  <div style={{ padding: '8px 16px', borderTop: '1px solid rgb(231, 230, 230)', backgroundColor: 'white' }}>
                    {/* Reply preview */}
                    {replyTo && (
                      <div style={{
                        background: '#f1f1f1',
                        borderLeft: '4px solid #007AFF',
                        padding: '8px 12px',
                        marginBottom: 6,
                        borderRadius: 6,
                        maxWidth: 400
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#007AFF' }}>Replying to:</span>
                        <br />
                        <span style={{ color: '#333' }}>{replyTo.message}</span>
                        <button
                          style={{ marginLeft: 10, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                          onClick={() => setReplyTo(null)}
                        >✕</button>
                      </div>
                    )}
                    <form onSubmit={handleSend} style={{
                      display: 'flex',
                      marginTop: 'auto',
                      position: 'sticky',
                      bottom: 0,
                      backgroundColor: 'white',
                      padding: '5px 15px',
                      alignItems: 'center',
                      border: '1px solid rgb(212, 212, 212)',
                      borderRadius: '10px',
                      gap: '12px'
                    }}>
                      {/* <LuMic /> */}
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        style={{ flex: 1, padding: 8, border: 'none', outline: 'none', backgroundColor: 'white' }}
                      />
                      <GrEmoji
                        style={{ fontSize: "20px", cursor: "pointer", color: 'gray' }}
                        onClick={toggleEmojiPicker}
                      />
                      {showEmojiPicker && (
                        <div
                          className="emoji-picker-container"
                          style={{
                            position: "absolute",
                            bottom: "70px",
                            right: "5px",
                            zIndex: "1000"
                          }}
                        >
                          <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                      <span
                        onClick={() => setClickDropdownTwo(!clickDropdowntwo)}
                        style={{ color: "grey", position: "relative" }}
                      >
                        <HiOutlineDotsVertical style={{ fontSize: "25px", color: 'gray' }} />
                      </span>
                      {clickDropdowntwo && (
                        <div
                          className="file-dropdown-container"
                          style={{
                            position: "absolute",
                            top: "-50px", //178
                            right: "100px",
                            zIndex: "100",
                          }}
                        >
                          {/* files options */}
                          <div>
                            <div
                              className="send-file-container"
                              style={{
                                backgroundColor: "white",
                                width: "150px",
                                height: "auto",
                                border: "1px solid #dfd8d8",
                                padding: "10px 15px",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: '10px'
                              }}
                            >
                              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <label htmlFor="file-upload2" className="custom-file-upload2" style={{ color: "gray" }}>
                                  <CiCamera />
                                  <span>Camera</span>
                                </label>
                                <input
                                  id="file-upload2"
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  style={{ color: "#4a4848" }}
                                  onChange={handleFileSelect}
                                />
                              </div>
                              <br />
                              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <label for="file-upload3" className="custom-file-upload3" style={{ color: "gray" }}><GrGallery /> Gallery</label>
                                <input id="file-upload3" type="file" accept=".jpg,.jpeg,.pdf" style={{ color: "#4a4848" }}
                                  onChange={handleFileSelect} />
                              </div>
                              {/* <br />
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "gray" }}>
                              <MdOutlineAudiotrack />
                              <span>Audio</span>
                            </div>
                            <br />
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: 'gray' }}>
                              <VscLocation />
                              <span>Location</span>
                            </div>
                            <br />
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: 'gray' }}>
                              <RiUserFollowLine />
                              <span>Contact</span>
                            </div> */}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* send files */}
                      <label
                        htmlFor="file-upload1"
                        className="custom-file-upload1"
                        style={{ cursor: "pointer" }}
                      >
                        <TbFolderUp style={{ fontSize: "25px", color: 'gray' }} />
                      </label>
                      <input
                        id="file-upload1"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.pdf"
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                      />

                      {/* File preview and upload button */}
                      {selectedFiles.length > 0 && (
                        <div style={{
                          position: "absolute",
                          bottom: "60px",
                          left: "10px",
                          backgroundColor: "white",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          padding: "12px",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                          zIndex: "1000",
                          minWidth: "250px"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "bold" }}>📎 {selectedFiles.length} files selected</span>
                            <button
                              onClick={() => setSelectedFiles([])}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "16px",
                                color: "#666"
                              }}
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                            Total Size: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}
                          </div>
                          {selectedFiles.map((file, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#666' }}>{file.name}</span>
                              <button
                                onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  color: "#666"
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              onClick={handleFileUpload}
                              disabled={isUploading}
                              style={{
                                flex: 1,
                                padding: "8px",
                                backgroundColor: isUploading ? "#ccc" : "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: isUploading ? "not-allowed" : "pointer"
                              }}
                            >
                              {isUploading ? "Uploading..." : "Send Files"}
                            </button>
                          </div>
                        </div>
                      )}
                      <button type="submit" style={{ border: 'none', backgroundColor: '#007AFF', color: 'white', display: 'flex', justifyContent: 'center', borderRadius: '8px', padding: '8px 10px' }}>
                        <LuSend />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  <div className="d-lg-none bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        className="btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ border: 'none', background: 'transparent' }}
                      >
                        {isMobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: 60, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', alignContent: 'center' }}>
                    <div style={{ marginTop: '150px', textAlign: 'center' }}>
                      <img src={ChatIcon} style={{ width: '172px', marginBottom: '50px' }} />
                      <h2 style={{ margin: 0, color: '#495057' }}>Welcome, {user?.name || 'User'} !</h2>
                      Select a user to start chatting.
                      <br /><br />
                      {/* 
            <button 
            onClick={handleLogout}
            style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              Logout
            </button> */}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {popup.show && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{
            background: 'white',
            padding: '32px 40px',
            borderRadius: 12,
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
            fontSize: 18,
            color: '#333',
            textAlign: 'center',
            minWidth: 300
          }}>
            {popup.message}
            <br />
            <button style={{ marginTop: 20, padding: '8px 24px', borderRadius: 6, background: '#007AFF', color: 'white', border: 'none', fontSize: 16, cursor: 'pointer' }} onClick={() => setPopup({ show: false, message: '' })}>OK</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chat;
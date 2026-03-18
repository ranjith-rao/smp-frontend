import React, { useEffect, useMemo, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import chatService from '../services/chatService';
import { usePresence } from '../context/PresenceContext';
import LexicalEditor from './LexicalEditor';
import Dialog from './Dialog';
import { stripHtml } from '../utils/contentHelpers';

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString();
};

const formatLastSeen = (lastSeenAt) => {
  if (!lastSeenAt) return 'offline';
  const date = new Date(lastSeenAt);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / 3600000);
  
  if (hours < 24) {
    // Show time for same day
    return `last seen at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    // Show date for older
    return `last seen at ${date.toLocaleDateString()}`;
  }
};

const getConversationName = (conversation) => {
  if (conversation.type === 'GROUP') return conversation.name || 'Unnamed group';
  return conversation.name || 'Direct chat';
};

const avatarLetter = (text = 'C') => text.trim()?.[0]?.toUpperCase() || 'C';

const calculateUnreadTotal = (conversationList) =>
  conversationList.reduce((sum, conversation) => sum + (Number(conversation.unreadCount) || 0), 0);

const MessagesModal = ({
  isOpen,
  onClose,
  currentUserId,
  onUnreadChange,
  onOpenProfile,
  openDirectUserId = null,
}) => {
  const { socket } = usePresence();
  const [conversations, setConversations] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageEditorKey, setMessageEditorKey] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [draftsByConversation, setDraftsByConversation] = useState({});
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [leftPanelMode, setLeftPanelMode] = useState('chats');
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [discoverUsersLoading, setDiscoverUsersLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupImageUrl, setGroupImageUrl] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [showGroupEmojiPicker, setShowGroupEmojiPicker] = useState(false);
  const [viewingMembers, setViewingMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [removeMemberDialogState, setRemoveMemberDialogState] = useState({ open: false, member: null });
  const [userPresence, setUserPresence] = useState({});
  const [deleteDialogState, setDeleteDialogState] = useState({ open: false, messageId: null });
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [editNameDialogState, setEditNameDialogState] = useState({ open: false, currentName: '' });
  const [editPhotoDialogState, setEditPhotoDialogState] = useState({ open: false, photoUrl: '' });
  const [deleteGroupDialogState, setDeleteGroupDialogState] = useState({ open: false });
  const [exitGroupDialogState, setExitGroupDialogState] = useState({ open: false });
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const messageListRef = useRef(null);
  const groupImageInputRef = useRef(null);
  const autoOpenedDirectUserRef = useRef(null);
  const draftsRef = useRef({});

  useEffect(() => {
    draftsRef.current = draftsByConversation;
  }, [draftsByConversation]);

  const sortedConversations = useMemo(
    () => 
      [...conversations]
        .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const q = chatSearchQuery.trim().toLowerCase();
    if (!q) return sortedConversations;
    return sortedConversations.filter((conversation) => {
      const name = getConversationName(conversation).toLowerCase();
      return name.includes(q);
    });
  }, [sortedConversations, chatSearchQuery]);

  const refreshConversations = async (keepSelection = true) => {
    try {
      setLoadingConversations(true);
      const data = await chatService.getConversations();
      const rawConversations = Array.isArray(data.conversations) ? data.conversations : [];
      const nextConversations = Array.from(
        new Map(rawConversations.map((conversation) => [conversation.id, conversation])).values()
      );
      const nextUnreadTotal = calculateUnreadTotal(nextConversations);
      setConversations(nextConversations);
      setUnreadTotal(nextUnreadTotal);
      onUnreadChange?.(nextUnreadTotal);

      if (keepSelection) {
        setSelectedConversation((prev) => {
          if (!prev?.id) return prev;
          const updated = nextConversations.find((c) => Number(c.id) === Number(prev.id));
          return updated || prev;
        });
      }

      return nextConversations;
    } catch (err) {
      setError(err.message || 'Unable to load conversations');
      return [];
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversation) => {
    if (!conversation?.id) return;

    try {
      setLoadingMessages(true);
      const data = await chatService.getMessages(conversation.id);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      await chatService.markRead(conversation.id);
      await refreshConversations();
      
      // Fetch presence status for direct chats
      if (conversation.type === 'DIRECT' && conversation.otherUser?.id) {
        try {
          const presenceData = await chatService.getUserPresence([conversation.otherUser.id]);
          setUserPresence(presenceData.statuses || {});
        } catch (err) {
          console.error('Error fetching presence:', err);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Listen for live socket events
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Listen for new messages
    const handleNewMessage = (payload) => {
      const conversationId = payload.conversationId || payload.id;
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some((m) => m.id === payload.id);
        if (exists) return prev;
        return [...prev, payload];
      });
      // Update conversation's last message
      setConversations((prev) =>
        prev.map((c) =>
          Number(c.id) === Number(conversationId)
            ? {
                ...c,
                lastMessageAt: payload.createdAt,
                lastMessage: {
                  id: payload.id,
                  text: payload.text,
                  messageType: payload.messageType,
                  createdAt: payload.createdAt,
                  senderId: payload.senderId,
                },
              }
            : c
        )
      );
    };

    // Listen for conversation updates (when new message arrives in other conversations)
    const handleConversationUpdated = ({ conversationId }) => {
      refreshConversations(true);
    };

    // Listen for presence updates in real-time
    const handlePresenceUpdate = ({ userId, isOnline }) => {
      setUserPresence((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          isOnline,
        },
      }));
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:conversation-updated', handleConversationUpdated);
    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:conversation-updated', handleConversationUpdated);
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [socket, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    refreshConversations(false);

    const interval = setInterval(() => {
      refreshConversations();
      if (selectedConversation?.id) {
        loadMessages(selectedConversation);
      }
    }, 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedConversation?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (leftPanelMode !== 'new-chat' && leftPanelMode !== 'new-group-members') {
      setDiscoverUsers([]);
      return;
    }

    const q = leftPanelMode === 'new-chat' ? newChatSearchQuery.trim() : groupMemberSearchQuery.trim();
    const timeout = setTimeout(async () => {
      try {
        setDiscoverUsersLoading(true);
        const data = await chatService.searchUsers(q);
        setDiscoverUsers(Array.isArray(data.users) ? data.users : []);
      } catch {
        setDiscoverUsers([]);
      } finally {
        setDiscoverUsersLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [isOpen, leftPanelMode, newChatSearchQuery, groupMemberSearchQuery]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const conversationId = selectedConversation?.id;
    setViewingMembers(false);
    setGroupMembers([]);
    if (!conversationId) {
      setMessageText('');
      setAttachments([]);
      setMessageEditorKey((prev) => prev + 1);
      return;
    }

    const draft = draftsRef.current[conversationId] || { text: '', attachments: [] };
    setMessageText(draft.text || '');
    setAttachments(Array.isArray(draft.attachments) ? draft.attachments : []);
    setMessageEditorKey((prev) => prev + 1);
  }, [selectedConversation?.id]);

  const openDirectConversation = async (userId) => {
    try {
      setError('');
      const data = await chatService.createDirectConversation(userId);
      const refreshed = await refreshConversations(false);
      const conversation = refreshed.find((c) => Number(c.id) === Number(data.conversationId));
      if (conversation) {
        setSelectedConversation(conversation);
        await loadMessages(conversation);
        setLeftPanelMode('chats');
        setNewChatSearchQuery('');
      }
    } catch (err) {
      setError(err.message || 'Unable to open chat');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      autoOpenedDirectUserRef.current = null;
      setLeftPanelMode('chats');
      setChatSearchQuery('');
      setNewChatSearchQuery('');
      setGroupMemberSearchQuery('');
      setSelectedMembers(new Set());
      setGroupName('');
      setGroupImageUrl('');
      setShowGroupEmojiPicker(false);
      return;
    }

    if (!openDirectUserId) return;

    const normalizedUserId = Number(openDirectUserId);
    if (autoOpenedDirectUserRef.current === normalizedUserId) return;

    autoOpenedDirectUserRef.current = normalizedUserId;
    openDirectConversation(normalizedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openDirectUserId]);

  const handlePickAttachment = async (event) => {
    if (!selectedConversation?.id) return;
    const files = Array.from(event.target.files || []).slice(0, 5);
    if (files.length === 0) return;

    const converted = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                fileName: file.name,
                mimeType: file.type || 'application/octet-stream',
                sizeBytes: file.size,
                url: String(reader.result || ''),
              });
            };
            reader.readAsDataURL(file);
          })
      )
    );

    setAttachments((prev) => {
      const next = [...prev, ...converted].slice(0, 5);
      setDraftsByConversation((drafts) => ({
        ...drafts,
        [selectedConversation.id]: {
          text: drafts[selectedConversation.id]?.text || messageText,
          attachments: next,
        },
      }));
      return next;
    });
    event.target.value = '';
  };

  const handleSend = async () => {
    if (!selectedConversation?.id || sendingMessage) return;
    const plainText = stripHtml(messageText);
    if (!plainText.trim() && attachments.length === 0) return;

    try {
      setSendingMessage(true);
      await chatService.sendMessage(selectedConversation.id, {
        text: messageText,
        attachments,
      });
      setDraftsByConversation((prev) => {
        const next = { ...prev };
        delete next[selectedConversation.id];
        return next;
      });
      setMessageText('');
      setMessageEditorKey((prev) => prev + 1);
      setAttachments([]);
      await loadMessages(selectedConversation);
    } catch (err) {
      setError(err.message || 'Unable to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    setDeleteDialogState({ open: true, messageId });
  };

  const confirmDeleteMessage = async () => {
    const messageId = deleteDialogState.messageId;
    if (!selectedConversation?.id || !messageId) return;

    try {
      await chatService.deleteMessage(selectedConversation.id, messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setDeleteDialogState({ open: false, messageId: null });
    } catch (err) {
      setError(err.message || 'Unable to delete message');
      setDeleteDialogState({ open: false, messageId: null });
    }
  };

  const sanitizeMessageHtml = (value = '') => {
    if (!value) return '';
    if (typeof window === 'undefined') return value;

    const template = window.document.createElement('template');
    template.innerHTML = value;

    template.content.querySelectorAll('script,style,iframe,object,embed').forEach((node) => node.remove());
    template.content.querySelectorAll('*').forEach((element) => {
      [...element.attributes].forEach((attr) => {
        const attrName = attr.name.toLowerCase();
        if (attrName.startsWith('on') || attrName === 'style') {
          element.removeAttribute(attr.name);
        }
      });
    });

    return template.innerHTML;
  };

  const toggleGroupMember = (id) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenNewChatPanel = () => {
    setLeftPanelMode('new-chat');
    setNewChatSearchQuery('');
  };

  const handleBackFromPanel = () => {
    if (leftPanelMode === 'new-group-details') {
      setLeftPanelMode('new-group-members');
      return;
    }
    if (leftPanelMode === 'new-group-members') {
      setLeftPanelMode('new-chat');
      return;
    }
    setLeftPanelMode('chats');
  };

  const handleOpenNewGroupPanel = () => {
    setSelectedMembers(new Set());
    setGroupMemberSearchQuery('');
    setGroupName('');
    setGroupImageUrl('');
    setShowGroupEmojiPicker(false);
    setLeftPanelMode('new-group-members');
  };

  const handleGoToGroupDetails = () => {
    if (selectedMembers.size === 0) return;
    setLeftPanelMode('new-group-details');
  };

  const handleGroupImagePick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const encoded = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });

    setGroupImageUrl(encoded);
    event.target.value = '';
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) return;
    try {
      const data = await chatService.createGroupConversation(groupName.trim(), Array.from(selectedMembers), groupImageUrl || null);
      setGroupName('');
      setGroupImageUrl('');
      setSelectedMembers(new Set());
      setShowGroupEmojiPicker(false);
      setLeftPanelMode('chats');
      setNewChatSearchQuery('');
      setGroupMemberSearchQuery('');
      const refreshed = await refreshConversations(false);
      const created = refreshed.find((c) => Number(c.id) === Number(data.conversationId));
      if (created) {
        setSelectedConversation(created);
        await loadMessages(created);
      }
    } catch (err) {
      setError(err.message || 'Unable to create group');
    }
  };

  const handleViewMembers = async () => {
    if (!selectedConversation?.id || selectedConversation.type !== 'GROUP') return;

    try {
      setLoadingGroupMembers(true);
      setViewingMembers(true);
      const data = await chatService.getGroupMembers(selectedConversation.id);
      setGroupMembers(data.members || []);
    } catch (err) {
      setError(err.message || 'Unable to load members');
      setViewingMembers(false);
    } finally {
      setLoadingGroupMembers(false);
    }
  };

  const canRemoveMember = (member) => {
    if (!selectedConversation || selectedConversation.type !== 'GROUP') return false;
    if (!member || Number(member.id) === Number(currentUserId)) return false;
    if (member.role === 'OWNER') return false;

    const myRole = selectedConversation.myRole;
    const isOwner = selectedConversation.isGroupOwner || myRole === 'OWNER';
    const isAdmin = myRole === 'ADMIN';

    if (isOwner) return true;
    if (isAdmin) return member.role === 'MEMBER';
    return false;
  };

  const handleRemoveMember = (member) => {
    if (!selectedConversation?.id || !member?.id || !canRemoveMember(member)) return;
    setRemoveMemberDialogState({ open: true, member });
  };

  const confirmRemoveMember = async () => {
    const member = removeMemberDialogState.member;
    if (!selectedConversation?.id || !member?.id || !canRemoveMember(member)) return;
    try {
      setRemovingMemberId(member.id);
      setError('');
      await chatService.removeGroupMember(selectedConversation.id, member.id);
      setGroupMembers((prev) => prev.filter((m) => Number(m.id) !== Number(member.id)));
      setRemoveMemberDialogState({ open: false, member: null });
      await refreshConversations(false);
    } catch (err) {
      setError(err.message || 'Unable to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleEditGroupName = () => {
    if (!selectedConversation?.id) return;
    setEditNameDialogState({ open: true, currentName: selectedConversation.rawName || '' });
    setGroupMenuOpen(false);
  };

  const confirmEditGroupName = async () => {
    const newName = editNameDialogState.currentName.trim();
    if (!selectedConversation?.id || !newName) return;

    try {
      setUpdatingGroup(true);
      setError('');
      await chatService.updateGroupName(selectedConversation.id, newName);
      setSelectedConversation((prev) => ({
        ...prev,
        name: newName,
        rawName: newName,
      }));
      setEditNameDialogState({ open: false, currentName: '' });
      await refreshConversations(false);
    } catch (err) {
      setError(err.message || 'Unable to update group name');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleEditGroupPhoto = () => {
    if (!selectedConversation?.id) return;
    setEditPhotoDialogState({ open: true, photoUrl: selectedConversation.avatarUrl || selectedConversation.profileImageUrl || '' });
    setGroupMenuOpen(false);
  };

  const handleEditPhotoPick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const encoded = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });

    setEditPhotoDialogState((prev) => ({ ...prev, photoUrl: encoded }));
    event.target.value = '';
  };

  const confirmEditGroupPhoto = async () => {
    const photoUrl = editPhotoDialogState.photoUrl.trim();
    if (!selectedConversation?.id || !photoUrl) return;

    try {
      setUpdatingGroup(true);
      setError('');
      await chatService.updateGroupPhoto(selectedConversation.id, photoUrl);
      setSelectedConversation((prev) => ({
        ...prev,
        avatarUrl: photoUrl,
        profileImageUrl: photoUrl,
      }));
      setEditPhotoDialogState({ open: false, photoUrl: '' });
      await refreshConversations(false);
    } catch (err) {
      setError(err.message || 'Unable to update group photo');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = () => {
    setDeleteGroupDialogState({ open: true });
    setGroupMenuOpen(false);
  };

  const confirmDeleteGroup = async () => {
    if (!selectedConversation?.id) return;

    try {
      setUpdatingGroup(true);
      setError('');
      await chatService.deleteConversation(selectedConversation.id);
      setSelectedConversation(null);
      setDeleteGroupDialogState({ open: false });
      await refreshConversations(false);
    } catch (err) {
      setError(err.message || 'Unable to delete group');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleExitGroup = () => {
    setExitGroupDialogState({ open: true });
    setGroupMenuOpen(false);
  };

  const confirmExitGroup = async () => {
    if (!selectedConversation?.id) return;

    try {
      setUpdatingGroup(true);
      setError('');
      await chatService.exitGroup(selectedConversation.id);
      setSelectedConversation(null);
      setExitGroupDialogState({ open: false });
      await refreshConversations(false);
    } catch (err) {
      setError(err.message || 'Unable to exit group');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const panelIndex =
    leftPanelMode === 'new-chat'
      ? 1
      : leftPanelMode === 'new-group-members'
        ? 2
        : leftPanelMode === 'new-group-details'
          ? 3
          : 0;

  const peopleList = useMemo(
    () => discoverUsers.filter((user) => Number(user.id) !== Number(currentUserId)),
    [discoverUsers, currentUserId]
  );

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        zIndex: 2100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '1060px',
          height: '82vh',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          overflow: 'hidden',
        }}
      >
        <div style={{ borderRight: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              width: '400%',
              height: '100%',
              transform: `translateX(-${panelIndex * 25}%)`,
              transition: 'transform 240ms ease',
            }}
          >
            {/* Chats panel */}
            <div style={{ width: '25%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>Messages</div>
                  <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                </div>
                <input
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Search existing chats"
                  style={{ width: '100%', marginTop: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 10px', fontSize: '13px' }}
                />
                <button
                  onClick={handleOpenNewChatPanel}
                  style={{ marginTop: '8px', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                >
                  + New chat
                </button>
              </div>

              <div style={{ padding: '10px 10px 12px', overflowY: 'auto', flex: 1 }}>
                {loadingConversations && <div style={{ fontSize: '12px', color: '#64748b' }}>Loading conversations...</div>}
                {!loadingConversations && filteredConversations.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>No conversations found.</div>
                )}
                {filteredConversations.map((conversation) => {
                  const active = Number(selectedConversation?.id) === Number(conversation.id);
                  const name = getConversationName(conversation);
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadMessages(conversation);
                      }}
                      style={{
                        width: '100%',
                        border: active ? '1px solid #a5b4fc' : '1px solid #e2e8f0',
                        background: active ? '#eef2ff' : '#fff',
                        borderRadius: '10px',
                        padding: '10px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155' }}>
                            {conversation.avatarUrl ? <img alt={name} src={conversation.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter(name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '210px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {stripHtml(conversation.lastMessage?.text || '') || (conversation.lastMessage?.messageType === 'IMAGE' ? '📷 Image' : conversation.lastMessage?.messageType === 'FILE' ? '📎 File' : 'No messages yet')}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{formatTime(conversation.lastMessageAt)}</div>
                          {conversation.unreadCount > 0 && (
                            <div style={{ marginTop: '4px', background: '#ef4444', color: '#fff', borderRadius: '999px', minWidth: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, padding: '0 6px' }}>
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* New chat panel */}
            <div style={{ width: '25%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={handleBackFromPanel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>←</button>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>New chat</div>
                </div>
                <input
                  value={newChatSearchQuery}
                  onChange={(e) => setNewChatSearchQuery(e.target.value)}
                  placeholder="Search people"
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 10px', fontSize: '13px' }}
                />
                <button
                  onClick={handleOpenNewGroupPanel}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#eef2ff', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                >
                  + New group
                </button>
              </div>
              <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
                {discoverUsersLoading && <div style={{ fontSize: '12px', color: '#64748b' }}>Loading people...</div>}
                {!discoverUsersLoading && peopleList.length === 0 && <div style={{ fontSize: '12px', color: '#64748b' }}>No people found.</div>}
                {peopleList.map((user) => {
                  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User';
                  return (
                    <button
                      key={`new-chat-${user.id}`}
                      onClick={() => openDirectConversation(user.id)}
                      style={{ width: '100%', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '10px', padding: '10px', marginBottom: '8px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155' }}>
                        {user.profileImageUrl ? <img alt={name} src={user.profileImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter(name)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Start chat</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* New group: members selection */}
            <div style={{ width: '25%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={handleBackFromPanel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>←</button>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>New group</div>
                </div>
                <input
                  value={groupMemberSearchQuery}
                  onChange={(e) => setGroupMemberSearchQuery(e.target.value)}
                  placeholder="Search people to add"
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 10px', fontSize: '13px' }}
                />
              </div>

              <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
                {discoverUsersLoading && <div style={{ fontSize: '12px', color: '#64748b' }}>Loading people...</div>}
                {!discoverUsersLoading && peopleList.length === 0 && <div style={{ fontSize: '12px', color: '#64748b' }}>No people found.</div>}
                {peopleList.map((user) => {
                  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User';
                  const selected = selectedMembers.has(user.id);
                  return (
                    <button
                      key={`new-group-${user.id}`}
                      onClick={() => toggleGroupMember(user.id)}
                      style={{ width: '100%', border: selected ? '1px solid #818cf8' : '1px solid #e2e8f0', background: selected ? '#eef2ff' : '#fff', borderRadius: '10px', padding: '10px', marginBottom: '8px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155' }}>
                          {user.profileImageUrl ? <img alt={name} src={user.profileImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter(name)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{selected ? 'Selected' : 'Tap to select'}</div>
                        </div>
                      </div>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: selected ? 'none' : '1px solid #94a3b8', background: selected ? '#6366f1' : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '12px' }}>
                        {selected ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedMembers.size} selected</div>
                <button
                  onClick={handleGoToGroupDetails}
                  disabled={selectedMembers.size === 0}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '16px', opacity: selectedMembers.size > 0 ? 1 : 0.45 }}
                  title="Next"
                >
                  →
                </button>
              </div>
            </div>

            {/* New group: details */}
            <div style={{ width: '25%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={handleBackFromPanel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>←</button>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>Group details</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155', flexShrink: 0 }}>
                    {groupImageUrl ? <img src={groupImageUrl} alt="Group" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter(groupName || 'G')}
                  </div>
                  <button
                    type="button"
                    onClick={() => groupImageInputRef.current?.click()}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    title="Pick group image"
                  >
                    📷 Camera
                  </button>
                  <input ref={groupImageInputRef} type="file" accept="image/*" onChange={handleGroupImagePick} style={{ display: 'none' }} />
                </div>
                <div style={{ position: 'relative', display: 'flex', gap: '6px' }}>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 10px', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroupEmojiPicker((prev) => !prev)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#fff', cursor: 'pointer', fontSize: '16px' }}
                  >
                    😊
                  </button>
                  {showGroupEmojiPicker && (
                    <div style={{ position: 'absolute', top: '44px', right: 0, zIndex: 1000, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)', maxHeight: '52vh', overflowY: 'auto' }}>
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setGroupName((prev) => prev + emojiData.emoji);
                          setShowGroupEmojiPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedMembers.size} members selected</div>
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedMembers.size === 0}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '18px', opacity: groupName.trim() && selectedMembers.size > 0 ? 1 : 0.45 }}
                  title="Create group"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 18px', minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedConversation?.type === 'GROUP' && (selectedConversation?.avatarUrl || selectedConversation?.profileImageUrl) && (
                <img 
                  src={selectedConversation.avatarUrl || selectedConversation.profileImageUrl} 
                  alt={selectedConversation.name}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{selectedConversation ? getConversationName(selectedConversation) : 'Select a conversation'}</div>
                {selectedConversation?.type === 'GROUP' ? (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Group chat</div>
                ) : selectedConversation?.otherUser?.id ? (
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {userPresence[selectedConversation.otherUser.id]?.isOnline ? (
                      <>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                        <span style={{ color: '#10b981', fontWeight: 500 }}>Online</span>
                      </>
                    ) : (
                      <>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}></span>
                        <span style={{ color: '#64748b' }}>
                          {formatLastSeen(userPresence[selectedConversation.otherUser.id]?.lastSeenAt)}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Direct chat</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
              {selectedConversation?.type === 'GROUP' && (
                <>
                  <button
                    onClick={() => setGroupMenuOpen(!groupMenuOpen)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, position: 'relative' }}
                  >
                    ⋮
                  </button>
                  {groupMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                      zIndex: 1000,
                      minWidth: '180px',
                      marginTop: '4px'
                    }}>
                      <button
                        onClick={() => {
                          setGroupMenuOpen(false);
                          handleViewMembers();
                        }}
                        style={{ width: '100%', border: 'none', background: '#fff', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#334155' }}
                      >
                        View members
                      </button>
                      {selectedConversation?.isGroupOwner && (
                        <>
                          <button
                            onClick={handleEditGroupName}
                            style={{ width: '100%', border: 'none', background: '#fff', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#334155' }}
                          >
                            Edit Name
                          </button>
                          <button
                            onClick={handleEditGroupPhoto}
                            style={{ width: '100%', border: 'none', background: '#fff', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#334155' }}
                          >
                            Edit Photo
                          </button>
                          <button
                            onClick={handleDeleteGroup}
                            style={{ width: '100%', border: 'none', background: '#fff', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #e2e8f0', fontWeight: 500, color: '#b91c1c' }}
                          >
                            Delete Group
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleExitGroup}
                        style={{ width: '100%', border: 'none', background: '#fff', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#b91c1c', borderRadius: '0 0 8px 8px' }}
                      >
                        Exit Group
                      </button>
                    </div>
                  )}
                </>
              )}
              {selectedConversation?.otherUser?.id && (
                <button
                  onClick={() => onOpenProfile?.(selectedConversation.otherUser.id)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  View profile
                </button>
              )}
            </div>
          </div>

          <div ref={messageListRef} style={{ minHeight: 0, flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '14px 16px' }}>
            {viewingMembers ? (
              <div style={{ background: 'white', borderRadius: '12px', padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <button
                    onClick={() => {
                      setViewingMembers(false);
                      setGroupMembers([]);
                    }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#334155' }}
                    title="Back"
                  >
                    ←
                  </button>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Group Members</div>
                </div>
                {loadingGroupMembers ? (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Loading members...</div>
                ) : groupMembers.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>No members found</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {groupMembers.map((member) => {
                      const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username || 'User';
                      const roleLabel = member.role === 'OWNER' ? '👑 Owner' : member.role === 'ADMIN' ? '⭐ Admin' : 'Member';
                      return (
                        <div
                          key={member.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155', flexShrink: 0 }}>
                            {member.profileImageUrl ? (
                              <img src={member.profileImageUrl} alt={memberName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              memberName[0]?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{memberName}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{roleLabel}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {member.id !== currentUserId && (
                              <button
                                onClick={() => onOpenProfile?.(member.id)}
                                style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                              >
                                Profile
                              </button>
                            )}
                            {canRemoveMember(member) && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                disabled={removingMemberId === member.id}
                                style={{ border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 12px', background: '#fff1f2', color: '#b91c1c', cursor: 'pointer', fontSize: '12px', fontWeight: 600, opacity: removingMemberId === member.id ? 0.7 : 1 }}
                              >
                                {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                {loadingMessages && <div style={{ fontSize: '12px', color: '#64748b' }}>Loading messages...</div>}
                {!loadingMessages && selectedConversation && messages.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>No messages yet. Say hi 👋</div>
                )}
                {!selectedConversation && (
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Choose someone from the left to start chatting.</div>
                )}
                {messages.map((message) => {
                  const mine = Number(message.senderId) === Number(currentUserId);
                  const senderName = `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() || message.sender?.username || 'User';

                  return (
                <div key={message.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '10px', gap: '6px', alignItems: 'flex-end' }}>
                  {!mine && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#cbd5e1', overflow: 'hidden', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155', flexShrink: 0 }}>
                      {message.sender?.profileImageUrl ? (
                        <img src={message.sender.profileImageUrl} alt={senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        senderName[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                  )}
                  {mine && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                      title="Delete message"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  )}
                  <div style={{ maxWidth: '75%', borderRadius: '12px', padding: '8px 10px', background: mine ? '#6366f1' : '#fff', color: mine ? '#fff' : '#0f172a', border: mine ? 'none' : '1px solid #e2e8f0' }}>
                    {!mine && <div style={{ fontSize: '11px', marginBottom: '4px', color: '#64748b' }}>{senderName}</div>}
                    {message.text && (
                      <div
                        style={{
                          fontSize: '14px',
                          lineHeight: 1.45,
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(message.text) }}
                      />
                    )}
                    {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'grid', gap: '6px' }}>
                        {message.attachments.map((attachment) => {
                          const isImage = (attachment.mimeType || '').startsWith('image/');
                          return isImage ? (
                            <img key={attachment.id} src={attachment.url} alt={attachment.fileName} style={{ width: '200px', maxWidth: '100%', borderRadius: '8px' }} />
                          ) : (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              download={attachment.fileName}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: mine ? '#fff' : '#2563eb', textDecoration: 'underline', fontSize: '12px' }}
                            >
                              📎 {attachment.fileName}
                            </a>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ marginTop: '4px', fontSize: '10px', opacity: 0.75 }}>{formatTime(message.createdAt)}</div>
                  </div>
                  </div>
                );
              })}
              </>
            )}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px', display: 'grid', gap: '8px' }}>
            {attachments.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {attachments.map((attachment, index) => (
                  <div key={`${attachment.fileName}-${index}`} style={{ border: '1px solid #cbd5e1', borderRadius: '999px', padding: '4px 8px', fontSize: '11px', background: '#fff' }}>
                    {attachment.fileName}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, opacity: selectedConversation ? 1 : 0.65, pointerEvents: selectedConversation && !sendingMessage ? 'auto' : 'none' }}>
                <LexicalEditor
                  key={messageEditorKey}
                  placeholder={selectedConversation ? 'Type a message...' : 'Select a conversation first'}
                  initialContent={messageText}
                  onChange={(value) => {
                    setMessageText(value);
                    if (!selectedConversation?.id) return;
                    setDraftsByConversation((prev) => ({
                      ...prev,
                      [selectedConversation.id]: {
                        text: value,
                        attachments,
                      },
                    }));
                  }}
                  contentEditableStyle={{ minHeight: '44px', maxHeight: '110px', overflowY: 'auto', padding: '10px' }}
                />
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                <label style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', cursor: selectedConversation ? 'pointer' : 'not-allowed', background: '#fff', fontSize: '12px', fontWeight: 600, textAlign: 'center', opacity: selectedConversation ? 1 : 0.5 }}>
                  📎 File
                  <input type="file" multiple style={{ display: 'none' }} onChange={handlePickAttachment} disabled={!selectedConversation || sendingMessage} />
                </label>
                <button
                  onClick={handleSend}
                  disabled={!selectedConversation || sendingMessage || (!stripHtml(messageText).trim() && attachments.length === 0)}
                  style={{ border: 'none', borderRadius: '8px', padding: '8px 12px', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: selectedConversation && (stripHtml(messageText).trim() || attachments.length > 0) ? 1 : 0.55 }}
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
            {error && <div style={{ fontSize: '12px', color: '#ef4444' }}>{error}</div>}
            <div style={{ fontSize: '11px', color: '#64748b' }}>Unread total: {unreadTotal}</div>
          </div>
        </div>
      </div>

      {deleteDialogState.open && (
        <Dialog
          isOpen={deleteDialogState.open}
          title="Delete message?"
          message="This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteMessage}
          onCancel={() => setDeleteDialogState({ open: false, messageId: null })}
        />
      )}

      {removeMemberDialogState.open && (
        <Dialog
          isOpen={removeMemberDialogState.open}
          title="Remove member?"
          message={`Remove ${`${removeMemberDialogState.member?.firstName || ''} ${removeMemberDialogState.member?.lastName || ''}`.trim() || removeMemberDialogState.member?.username || 'this member'} from this group?`}
          confirmText="Remove"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmRemoveMember}
          onCancel={() => setRemoveMemberDialogState({ open: false, member: null })}
        />
      )}

      {editNameDialogState.open && (
        <div
          onClick={() => setEditNameDialogState({ open: false, currentName: '' })}
          style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>Edit Group Name</div>
            <input
              type="text"
              value={editNameDialogState.currentName}
              onChange={(e) => setEditNameDialogState({ ...editNameDialogState, currentName: e.target.value })}
              placeholder="Group name"
              style={{
                width: '100%',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                marginBottom: '20px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditNameDialogState({ open: false, currentName: '' })}
                disabled={updatingGroup}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: updatingGroup ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmEditGroupName}
                disabled={updatingGroup || !editNameDialogState.currentName.trim()}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  background: '#6366f1',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: updatingGroup || !editNameDialogState.currentName.trim() ? 0.6 : 1
                }}
              >
                {updatingGroup ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editPhotoDialogState.open && (
        <div
          onClick={() => setEditPhotoDialogState({ open: false, photoUrl: '' })}
          style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>Edit Group Photo</div>
            <label
              style={{
                width: '100%',
                border: '1px dashed #94a3b8',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '13px',
                marginBottom: '12px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                display: 'block',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#f8fafc'
              }}
            >
              📷 Choose image
              <input type="file" accept="image/*" onChange={handleEditPhotoPick} style={{ display: 'none' }} />
            </label>
            {editPhotoDialogState.photoUrl && (
              <div style={{ marginBottom: '16px' }}>
                <img src={editPhotoDialogState.photoUrl} alt="Preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '220px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditPhotoDialogState({ open: false, photoUrl: '' })}
                disabled={updatingGroup}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: updatingGroup ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmEditGroupPhoto}
                disabled={updatingGroup || !editPhotoDialogState.photoUrl.trim()}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  background: '#6366f1',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: updatingGroup || !editPhotoDialogState.photoUrl.trim() ? 0.6 : 1
                }}
              >
                {updatingGroup ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteGroupDialogState.open && (
        <Dialog
          isOpen={deleteGroupDialogState.open}
          title="Delete group?"
          message="This will permanently delete the group for all members. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteGroup}
          onCancel={() => setDeleteGroupDialogState({ open: false })}
        />
      )}

      {exitGroupDialogState.open && (
        <Dialog
          isOpen={exitGroupDialogState.open}
          title="Exit group?"
          message="You will no longer receive messages from this group."
          confirmText="Exit"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmExitGroup}
          onCancel={() => setExitGroupDialogState({ open: false })}
        />
      )}
    </div>
  );
};

export default MessagesModal;

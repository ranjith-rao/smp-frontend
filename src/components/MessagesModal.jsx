import React, { useEffect, useMemo, useRef, useState } from 'react';
import chatService from '../services/chatService';
import { usePresence } from '../context/PresenceContext';

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
  if (conversation.type === 'GROUP') return conversation.name || 'Unnamed room';
  return conversation.name || 'Direct chat';
};

const avatarLetter = (text = 'C') => text.trim()?.[0]?.toUpperCase() || 'C';

const calculateUnreadTotal = (conversationList) =>
  conversationList.reduce((sum, conversation) => sum + (Number(conversation.unreadCount) || 0), 0);

const MessagesModal = ({ isOpen, onClose, currentUserId, onUnreadChange, onOpenProfile }) => {
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
  const [attachments, setAttachments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], groups: [] });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState(new Set());
  const [userPresence, setUserPresence] = useState({});
  const messageListRef = useRef(null);

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)),
    [conversations]
  );

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
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults({ users: [], groups: [] });
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const data = await chatService.searchChats(q);
        setSearchResults({
          users: Array.isArray(data.users) ? data.users : [],
          groups: Array.isArray(data.groups) ? data.groups : [],
        });
      } catch {
        setSearchResults({ users: [], groups: [] });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, isOpen]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const openDirectConversation = async (userId) => {
    try {
      setError('');
      const data = await chatService.createDirectConversation(userId);
      const refreshed = await refreshConversations(false);
      const conversation = refreshed.find((c) => Number(c.id) === Number(data.conversationId));
      if (conversation) {
        setSelectedConversation(conversation);
        await loadMessages(conversation);
      }
    } catch (err) {
      setError(err.message || 'Unable to open chat');
    }
  };

  const openGroupConversation = async (conversationId) => {
    const conversation = sortedConversations.find((c) => c.id === conversationId);
    if (!conversation) return;
    setSelectedConversation(conversation);
    await loadMessages(conversation);
  };

  const handlePickAttachment = async (event) => {
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

    setAttachments((prev) => [...prev, ...converted].slice(0, 5));
    event.target.value = '';
  };

  const handleSend = async () => {
    if (!selectedConversation?.id || sendingMessage) return;
    if (!messageText.trim() && attachments.length === 0) return;

    try {
      setSendingMessage(true);
      await chatService.sendMessage(selectedConversation.id, {
        text: messageText,
        attachments,
      });
      setMessageText('');
      setAttachments([]);
      await loadMessages(selectedConversation);
    } catch (err) {
      setError(err.message || 'Unable to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleGroupMember = (id) => {
    setGroupMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const data = await chatService.createGroupConversation(groupName.trim(), Array.from(groupMembers));
      setGroupName('');
      setGroupMembers(new Set());
      setCreatingGroup(false);
      const refreshed = await refreshConversations(false);
      const created = refreshed.find((c) => Number(c.id) === Number(data.conversationId));
      if (created) {
        setSelectedConversation(created);
        await loadMessages(created);
      }
    } catch (err) {
      setError(err.message || 'Unable to create room');
    }
  };

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
        <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>Messages</div>
              <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people or room names"
              style={{ width: '100%', marginTop: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 10px', fontSize: '13px' }}
            />
            <button
              onClick={() => setCreatingGroup((prev) => !prev)}
              style={{ marginTop: '8px', width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
            >
              {creatingGroup ? 'Close room builder' : 'Create room'}
            </button>
            {creatingGroup && (
              <div style={{ marginTop: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', display: 'grid', gap: '8px' }}>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Room name"
                  style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', fontSize: '12px' }}
                />
                <div style={{ fontSize: '12px', color: '#64748b' }}>Pick members from search results below.</div>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim()}
                  style={{ border: 'none', borderRadius: '6px', padding: '8px', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: groupName.trim() ? 1 : 0.5 }}
                >
                  Create room ({groupMembers.size} members)
                </button>
              </div>
            )}
          </div>

          {searchQuery.trim() && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', maxHeight: '180px', overflowY: 'auto' }}>
              {searchResults.users.map((user) => {
                const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User';
                const isSelected = groupMembers.has(user.id);
                return (
                  <div key={`u-${user.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
                    <button
                      onClick={() => openDirectConversation(user.id)}
                      style={{ border: 'none', background: '#f8fafc', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', textAlign: 'left', flex: 1 }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Chat</div>
                    </button>
                    {creatingGroup && (
                      <button
                        onClick={() => toggleGroupMember(user.id)}
                        style={{ border: '1px solid #cbd5e1', background: isSelected ? '#dcfce7' : '#fff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        {isSelected ? 'Added' : 'Add'}
                      </button>
                    )}
                  </div>
                );
              })}
              {searchResults.groups.map((group) => (
                <button
                  key={`g-${group.id}`}
                  onClick={() => openGroupConversation(group.id)}
                  style={{ width: '100%', border: 'none', background: '#eef2ff', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', textAlign: 'left', marginBottom: '6px' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{group.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Room</div>
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: '10px 10px 12px', overflowY: 'auto', flex: 1 }}>
            {loadingConversations && <div style={{ fontSize: '12px', color: '#64748b' }}>Loading conversations...</div>}
            {!loadingConversations && sortedConversations.length === 0 && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>No conversations yet.</div>
            )}
            {sortedConversations.map((conversation) => {
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
                          {conversation.lastMessage?.text || (conversation.lastMessage?.messageType === 'IMAGE' ? '📷 Image' : conversation.lastMessage?.messageType === 'FILE' ? '📎 File' : 'No messages yet')}
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

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 18px', minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{selectedConversation ? getConversationName(selectedConversation) : 'Select a conversation'}</div>
              {selectedConversation?.type === 'GROUP' ? (
                <div style={{ fontSize: '12px', color: '#64748b' }}>Room chat</div>
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
            {selectedConversation?.otherUser?.id && (
              <button
                onClick={() => onOpenProfile?.(selectedConversation.otherUser.id)}
                style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
              >
                View profile
              </button>
            )}
          </div>

          <div ref={messageListRef} style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '14px 16px' }}>
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
                <div key={message.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                  <div style={{ maxWidth: '75%', borderRadius: '12px', padding: '8px 10px', background: mine ? '#6366f1' : '#fff', color: mine ? '#fff' : '#0f172a', border: mine ? 'none' : '1px solid #e2e8f0' }}>
                    {!mine && <div style={{ fontSize: '11px', marginBottom: '4px', color: '#64748b' }}>{senderName}</div>}
                    {message.text && <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{message.text}</div>}
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
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={selectedConversation ? 'Type a message...' : 'Select a conversation first'}
                disabled={!selectedConversation || sendingMessage}
                rows={2}
                style={{ flex: 1, resize: 'none', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px', fontSize: '14px' }}
              />
              <div style={{ display: 'grid', gap: '6px' }}>
                <label style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', cursor: selectedConversation ? 'pointer' : 'not-allowed', background: '#fff', fontSize: '12px', fontWeight: 600, textAlign: 'center', opacity: selectedConversation ? 1 : 0.5 }}>
                  📎 File
                  <input type="file" multiple style={{ display: 'none' }} onChange={handlePickAttachment} disabled={!selectedConversation || sendingMessage} />
                </label>
                <button
                  onClick={handleSend}
                  disabled={!selectedConversation || sendingMessage || (!messageText.trim() && attachments.length === 0)}
                  style={{ border: 'none', borderRadius: '8px', padding: '8px 12px', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: selectedConversation && (messageText.trim() || attachments.length > 0) ? 1 : 0.55 }}
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
    </div>
  );
};

export default MessagesModal;

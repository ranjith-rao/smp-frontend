import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { authService } from '../services/authService';
import { API_CONFIG } from '../config/api';
import apiFetch from '../utils/apiFetch';
import { getUserHandle, getUserDisplayName } from '../utils/userHelpers';
import { normalizePostContent } from '../utils/contentHelpers';
import LexicalEditor from '../components/LexicalEditor';
import Dialog from '../components/Dialog';
import CommentSection from '../components/CommentSection';
import PageCarousel from '../components/PageCarousel';
import PostCard from '../components/PostCard';
import { ToastContainer } from '../components/Toast';
import OnlineIndicator from '../components/OnlineIndicator';
import MessagesModal from '../components/MessagesModal';
import AppHeader from '../components/AppHeader';
import { useSiteSettings } from '../context/SiteSettingsContext';
import shareIcon from '../assets/share.png';
import '../styles/Home.css';
import chatService from '../services/chatService';
import storyService from '../services/storyService';

const PEOPLE_ROW_HEIGHT = 72;
const PEOPLE_PANEL_HEIGHT = 360;
const STORY_PHOTO_DURATION_MS = 5000;
const STORY_TEXT_DURATION_MS = 4500;
const STORY_VIDEO_FALLBACK_DURATION_MS = 10000;

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSiteSettings();
  const appName = settings?.appName || 'NEXUS';
  const [composerText, setComposerText] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [newUsers, setNewUsers] = useState([]);
  const [newUsersError, setNewUsersError] = useState(null);
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [peopleModalMode, setPeopleModalMode] = useState('all');
  const [chatOpenUserId, setChatOpenUserId] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [peopleUsers, setPeopleUsers] = useState([]);
  const [peopleUsersError, setPeopleUsersError] = useState(null);
  const [peopleUsersLoading, setPeopleUsersLoading] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleScrollTop, setPeopleScrollTop] = useState(0);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [pendingFollowRequestIds, setPendingFollowRequestIds] = useState(new Set());
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  const [incomingRequestByUserId, setIncomingRequestByUserId] = useState({});
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    profileImageUrl: '',
  });
  const [saveState, setSaveState] = useState({ loading: false, error: null, success: false });
  const [posts, setPosts] = useState([]);
  const [postsError, setPostsError] = useState(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [pagePostsLoading, setPagePostsLoading] = useState(false);
  const [allPosts, setAllPosts] = useState([]);
  const [sessionOwnPosts, setSessionOwnPosts] = useState([]);
  const [media, setMedia] = useState({ type: null, data: null, name: '' });
  const [feeling, setFeeling] = useState(null);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 860);
  const [postState, setPostState] = useState({ loading: false, error: null });
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMedia, setEditMedia] = useState({ type: null, data: null, name: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [likeLoading, setLikeLoading] = useState({});
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [sharePostId, setSharePostId] = useState(null);
  const [trendingTags, setTrendingTags] = useState([]);
  const [trendingTagsLoading, setTrendingTagsLoading] = useState(true);
  const [trendingTagsError, setTrendingTagsError] = useState(null);
  const [storyGroups, setStoryGroups] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [storySaving, setStorySaving] = useState(false);
  const [storyDraft, setStoryDraft] = useState({
    mediaType: 'TEXT',
    mediaUrl: '',
    textContent: '',
    background: '#0f172a',
  });
  const [storyViewer, setStoryViewer] = useState({
    open: false,
    groupIndex: 0,
    storyIndex: 0,
  });
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyVideoDurationMs, setStoryVideoDurationMs] = useState(null);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [storyDeleting, setStoryDeleting] = useState(false);
  const storyVideoRef = useRef(null);
  const storyHoldTimeoutRef = useRef(null);
  const storyHoldTriggeredRef = useRef(false);
  const dialogActionRef = useRef(null);
  const dialogInputRef = useRef('');
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    variant: 'default',
    showInput: false,
    inputPlaceholder: ''
  });
  const [dialogInput, setDialogInput] = useState('');

  const handleDialogInputChange = (value) => {
    dialogInputRef.current = value;
    setDialogInput(value);
  };
  const [composeEditorKey, setComposeEditorKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [activePostSearch, setActivePostSearch] = useState('');
  const [activeHashtags, setActiveHashtags] = useState([]);
  const [hashtagPosts, setHashtagPosts] = useState([]);
  const [hashtagLoading, setHashtagLoading] = useState(false);
  const [hashtagError, setHashtagError] = useState(null);
  const deepLinkHandledRef = useRef('');
  const engagementLoadedRef = useRef(new Set());
  const engagementInFlightRef = useRef(new Set());
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = (message, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const fetchStories = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setStoriesLoading(true);
      const data = await storyService.getFeed();
      setStoryGroups(Array.isArray(data.groups) ? data.groups : []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      if (!silent) setStoriesLoading(false);
    }
  }, []);

  const markStoryViewed = useCallback(async (storyId) => {
    try {
      await storyService.markViewed(storyId);
      setStoryGroups((prev) => prev.map((group) => {
        const stories = group.stories.map((story) => (
          story.id === storyId ? { ...story, hasViewed: true } : story
        ));
        return {
          ...group,
          stories,
          hasUnviewed: stories.some((story) => !story.hasViewed),
        };
      }));
    } catch (error) {
      console.error('Unable to mark story viewed:', error);
    }
  }, []);

  const openStoryViewer = useCallback((groupIndex) => {
    const group = storyGroups[groupIndex];
    if (!group || !Array.isArray(group.stories) || group.stories.length === 0) return;

    const firstUnviewedIndex = group.stories.findIndex((story) => !story.hasViewed);
    const storyIndex = firstUnviewedIndex >= 0 ? firstUnviewedIndex : 0;

    setStoryViewer({ open: true, groupIndex, storyIndex });
  }, [storyGroups]);

  const closeStoryViewer = useCallback(() => {
    setStoryViewer({ open: false, groupIndex: 0, storyIndex: 0 });
  }, []);

  const currentStoryGroup = storyGroups[storyViewer.groupIndex] || null;
  const currentStory = currentStoryGroup?.stories?.[storyViewer.storyIndex] || null;
  const currentStoryDuration = useMemo(() => {
    if (!currentStory) return STORY_PHOTO_DURATION_MS;
    if (currentStory.mediaType === 'TEXT') return STORY_TEXT_DURATION_MS;
    if (currentStory.mediaType === 'VIDEO') return storyVideoDurationMs || STORY_VIDEO_FALLBACK_DURATION_MS;
    return STORY_PHOTO_DURATION_MS;
  }, [currentStory, storyVideoDurationMs]);
  const effectiveStoryPaused = isStoryPaused || dialogState.open;

  const goToNextStory = useCallback(() => {
    setStoryViewer((prev) => {
      const group = storyGroups[prev.groupIndex];
      if (!group) return prev;

      if (prev.storyIndex < group.stories.length - 1) {
        return { ...prev, storyIndex: prev.storyIndex + 1 };
      }

      if (prev.groupIndex < storyGroups.length - 1) {
        return { ...prev, groupIndex: prev.groupIndex + 1, storyIndex: 0 };
      }

      return { open: false, groupIndex: 0, storyIndex: 0 };
    });
  }, [storyGroups]);

  const goToPrevStory = useCallback(() => {
    setStoryViewer((prev) => {
      if (prev.storyIndex > 0) {
        return { ...prev, storyIndex: prev.storyIndex - 1 };
      }

      if (prev.groupIndex > 0) {
        const previousGroup = storyGroups[prev.groupIndex - 1];
        return {
          ...prev,
          groupIndex: prev.groupIndex - 1,
          storyIndex: Math.max(0, (previousGroup?.stories?.length || 1) - 1),
        };
      }

      return prev;
    });
  }, [storyGroups]);

  const startStoryHold = useCallback(() => {
    storyHoldTriggeredRef.current = false;
    if (storyHoldTimeoutRef.current) {
      window.clearTimeout(storyHoldTimeoutRef.current);
    }

    storyHoldTimeoutRef.current = window.setTimeout(() => {
      storyHoldTriggeredRef.current = true;
      setIsStoryPaused(true);
    }, 140);
  }, []);

  const endStoryHold = useCallback(() => {
    if (storyHoldTimeoutRef.current) {
      window.clearTimeout(storyHoldTimeoutRef.current);
      storyHoldTimeoutRef.current = null;
    }
    setIsStoryPaused(false);
  }, []);

  const handleStoryTap = useCallback((direction) => {
    if (storyHoldTriggeredRef.current) {
      storyHoldTriggeredRef.current = false;
      return;
    }

    if (direction === 'prev') {
      goToPrevStory();
      return;
    }

    goToNextStory();
  }, [goToNextStory, goToPrevStory]);

  useEffect(() => {
    setStoryProgress(0);
    setStoryVideoDurationMs(null);
    setIsStoryPaused(false);
  }, [storyViewer.open, storyViewer.groupIndex, storyViewer.storyIndex]);

  useEffect(() => {
    if (!storyViewer.open || !currentStory || effectiveStoryPaused) return;

    const interval = window.setInterval(() => {
      setStoryProgress((prev) => {
        const next = prev + (100 / (currentStoryDuration / 100));
        if (next >= 100) {
          window.clearInterval(interval);
          goToNextStory();
          return 100;
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [storyViewer.open, currentStory?.id, currentStoryDuration, goToNextStory, effectiveStoryPaused]);

  useEffect(() => {
    const videoEl = storyVideoRef.current;
    if (!videoEl) return;

    if (effectiveStoryPaused) {
      videoEl.pause();
      return;
    }

    videoEl.play().catch(() => {});
  }, [effectiveStoryPaused, currentStory?.id]);

  const handleStoryMediaUpload = (type) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      setStoryDraft((prev) => ({
        ...prev,
        mediaType: type,
        mediaUrl: String(dataUrl || ''),
      }));
    } catch (error) {
      showToast('Unable to read selected media', 'error');
    }
  };

  const handleCreateStory = async () => {
    if (!storyDraft.mediaUrl && !storyDraft.textContent.trim()) {
      showToast('Story needs text or media', 'error');
      return;
    }

    setStorySaving(true);
    try {
      await storyService.createStory({
        mediaType: storyDraft.mediaUrl ? storyDraft.mediaType : 'TEXT',
        mediaUrl: storyDraft.mediaUrl || null,
        textContent: storyDraft.textContent || '',
        background: storyDraft.background || '#0f172a',
      });

      setShowStoryComposer(false);
      setStoryDraft({
        mediaType: 'TEXT',
        mediaUrl: '',
        textContent: '',
        background: '#0f172a',
      });
      await fetchStories();
      showToast('Story added', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to create story', 'error');
    } finally {
      setStorySaving(false);
    }
  };

  const handleDeleteCurrentStory = useCallback(() => {
    if (!currentStory || !currentStoryGroup?.isOwn || storyDeleting) return;

    setDialogState({
      open: true,
      title: 'Delete story',
      message: 'Are you sure you want to delete this story?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      showInput: false,
      inputPlaceholder: '',
    });

    dialogActionRef.current = async () => {
      setStoryDeleting(true);
      try {
        await storyService.deleteStory(currentStory.id);
        showToast('Story deleted', 'success');
        closeStoryViewer();
        await fetchStories({ silent: true });
      } catch (error) {
        showToast(error.message || 'Unable to delete story', 'error');
      } finally {
        setStoryDeleting(false);
        setDialogState((prev) => ({ ...prev, open: false }));
        dialogActionRef.current = null;
      }
    };
  }, [currentStory, currentStoryGroup?.isOwn, storyDeleting, closeStoryViewer, fetchStories]);

  const highlightAndScrollPost = useCallback((postId) => {
    const element = document.getElementById(`post-${postId}`);
    if (!element) return false;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('post-deeplink-highlight');
    window.setTimeout(() => {
      element.classList.remove('post-deeplink-highlight');
    }, 1600);
    return true;
  }, []);

  const fetchPostById = useCallback(async (postId) => {
    const token = authService.getToken();
    if (!token) return null;

    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Unable to open post');
    }

    return data.post || null;
  }, []);

  const currentUserId = useMemo(() => authService.getUserId(), []);

  const postsToRender = useMemo(() => {
    const basePosts = allPosts.length > 0 ? allPosts : posts;
    const merged = [...sessionOwnPosts, ...basePosts];
    const seen = new Set();
    return merged.filter((post) => {
      const key = post?.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sessionOwnPosts, allPosts, posts]);

  const displayedPosts = useMemo(() => {
    if (activeHashtags.length > 0) return hashtagPosts;
    if (activePostSearch) return searchResults;
    return postsToRender;
  }, [activeHashtags, hashtagPosts, activePostSearch, searchResults, postsToRender]);

  const displayName = useMemo(() => {
    if (!profile) return 'Your account';
    const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    if (name) return name;
    if (profile.email) return profile.email.split('@')[0];
    return 'Your account';
  }, [profile]);

  const userHandle = useMemo(() => {
    if (!profile) return '@user';
    if (profile.username) return `@${profile.username}`;
    // Fallback to email-based username
    const prefix = profile.email.split('@')[0];
    const normalized = prefix.replace(/[^a-zA-Z0-9_\.]/g, '').slice(0, 18) || 'user';
    return `@${normalized}`;
  }, [profile]);

  const avatarLetter = useMemo(() => {
    return displayName ? displayName[0].toUpperCase() : 'U';
  }, [displayName]);

  // Handle opening direct chat from Profile page
  useEffect(() => {
    if (location.state?.openDirectChat) {
      const userId = location.state.openDirectChat;
      setChatOpenUserId(parseInt(userId));
      setShowMessagesModal(true);
      // Clear the state so it doesn't trigger again on navigation
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.openDirectChat, navigate]);

  useEffect(() => {
    let isMounted = true;
    authService
      .getProfile()
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setProfileForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            username: data.username || '',
            bio: data.bio || '',
            profileImageUrl: data.profileImageUrl || '',
          });
        }
      })
      .catch((error) => {
        if (isMounted) setProfileError(error.message || 'Unable to load profile');
      })
      .finally(() => {
        if (isMounted) setProfileLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = authService.getToken();

    const fetchTrendingTags = async () => {
      try {
        setTrendingTagsLoading(true);
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/trending-tags?windowDays=14&limit=6`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to fetch trending tags');
        if (cancelled) return;

        setTrendingTags(Array.isArray(data.tags) ? data.tags : []);
        setTrendingTagsError(null);
      } catch (error) {
        if (!cancelled) {
          setTrendingTags([]);
          setTrendingTagsError(error.message || 'Unable to fetch trending tags');
        }
      } finally {
        if (!cancelled) setTrendingTagsLoading(false);
      }
    };

    fetchTrendingTags();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const data = await chatService.getConversations();
        if (!cancelled) {
          const rawConversations = Array.isArray(data.conversations) ? data.conversations : [];
          const uniqueConversations = Array.from(
            new Map(rawConversations.map((conversation) => [conversation.id, conversation])).values()
          );
          const unreadTotal = uniqueConversations.reduce(
            (sum, conversation) => sum + (Number(conversation.unreadCount) || 0),
            0
          );
          setUnreadMessagesCount(unreadTotal);
        }
      } catch {
        if (!cancelled) {
          setUnreadMessagesCount(0);
        }
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchStories();
    const interval = setInterval(() => {
      fetchStories({ silent: true });
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  useEffect(() => {
    if (!storyViewer.open || !currentStory || currentStory.hasViewed) return;
    markStoryViewed(currentStory.id);
  }, [storyViewer.open, currentStory?.id, currentStory?.hasViewed, markStoryViewed]);

  // Close menu when user starts typing
  useEffect(() => {
    if (composerText && openMenuPostId !== null) {
      setOpenMenuPostId(null);
    }
  }, [composerText, openMenuPostId]);

  const fetchNewUsers = useCallback(async (isMountedRef) => {
    const token = authService.getToken();

    try {
      const res = await fetch(`${API_CONFIG.ENDPOINTS.USERS}/new/suggestions?limit=5`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (!isMountedRef?.current) return;
      setNewUsers(Array.isArray(data.users) ? data.users : []);
      setNewUsersError(null);
    } catch (error) {
      if (isMountedRef?.current) setNewUsersError(error.message || 'Unable to load new users');
    }
  }, []);

  const fetchPeopleUsers = useCallback(async (mode = 'all') => {
    setPeopleUsersLoading(true);
    setPeopleUsersError(null);

    try {
      const token = authService.getToken();
      const endpoint = mode === 'friends'
        ? `${API_CONFIG.ENDPOINTS.USERS}/friends/list`
        : mode === 'requests'
          ? `${API_CONFIG.ENDPOINTS.USERS}/follow-requests/incoming`
        : `${API_CONFIG.ENDPOINTS.USERS}/search?q=`;

      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      
      if (!res.ok) {
        throw new Error(
          mode === 'friends'
            ? 'Failed to load friends'
            : mode === 'requests'
              ? 'Failed to load follow requests'
              : 'Failed to load users'
        );
      }
      
      const data = await res.json();
      const users = mode === 'friends'
        ? (Array.isArray(data.friends) ? data.friends : [])
        : mode === 'requests'
          ? (Array.isArray(data.requests)
            ? data.requests.map((request) => ({
              ...request,
              id: request.fromUserId,
              requestId: request.id,
            }))
            : [])
          : (Array.isArray(data.users) ? data.users : []);

      if (mode === 'requests') {
        const requestMap = users.reduce((acc, item) => {
          acc[item.id] = item.requestId;
          return acc;
        }, {});
        setIncomingRequestByUserId(requestMap);
        setIncomingRequestCount(users.length);
      }

      const filtered = users.filter((user) => user.id !== profile?.id && user.role !== 'ADMIN');
      setPeopleUsers(filtered);
    } catch (error) {
      setPeopleUsersError(
        error.message || (
          mode === 'friends'
            ? 'Unable to load friends'
            : mode === 'requests'
              ? 'Unable to load follow requests'
              : 'Unable to load people'
        )
      );
    } finally {
      setPeopleUsersLoading(false);
    }
  }, [profile?.id]);

  const fetchFollowingList = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      setFollowingIds(new Set());
      setPendingFollowRequestIds(new Set());
      return;
    }

    try {
      const [followingRes, outgoingRes] = await Promise.all([
        fetch(`${API_CONFIG.ENDPOINTS.USERS}/following/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_CONFIG.ENDPOINTS.USERS}/follow-requests/outgoing`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const followingData = await followingRes.json();
      const ids = Array.isArray(followingData.following) ? followingData.following.map((u) => u.id) : [];
      setFollowingIds(new Set(ids));

      if (outgoingRes.ok) {
        const outgoingData = await outgoingRes.json();
        const pendingIds = Array.isArray(outgoingData.requests)
          ? outgoingData.requests.map((request) => request.toUserId)
          : [];
        setPendingFollowRequestIds(new Set(pendingIds));
      } else {
        setPendingFollowRequestIds(new Set());
      }

      const incomingRes = await fetch(`${API_CONFIG.ENDPOINTS.USERS}/follow-requests/incoming`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (incomingRes.ok) {
        const incomingData = await incomingRes.json();
        const incomingRequests = Array.isArray(incomingData.requests) ? incomingData.requests : [];
        setIncomingRequestCount(incomingRequests.length);
      } else {
        setIncomingRequestCount(0);
      }
    } catch (error) {
      console.error('Error fetching following list:', error);
    }
  }, []);

  const handleIncomingFollowRequest = async (userId, action) => {
    const requestId = incomingRequestByUserId[userId];
    if (!requestId) return;

    try {
      const token = authService.getToken();
      const response = await apiFetch(`${API_CONFIG.ENDPOINTS.USERS}/follow-requests/${requestId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(responseData.message || `Failed to ${action} request`, 'error');
        return;
      }

      setPeopleUsers((prev) => prev.filter((user) => user.id !== userId));
      setIncomingRequestByUserId((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setIncomingRequestCount((prev) => Math.max(0, prev - 1));
      if (action === 'accept') {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
      }
      showToast(action === 'accept' ? 'Follow request accepted' : 'Follow request rejected', 'success');
    } catch (error) {
      console.error('Error handling follow request:', error);
      showToast('Unable to process request', 'error');
    }
  };

  useEffect(() => {
    if (showPeopleModal) {
      fetchFollowingList();
      fetchPeopleUsers(peopleModalMode);
    }
  }, [showPeopleModal, peopleModalMode, fetchPeopleUsers, fetchFollowingList]);

  useEffect(() => {
    fetchFollowingList();
  }, [fetchFollowingList]);

  useEffect(() => {
    const isMountedRef = { current: true };
    fetchNewUsers(isMountedRef);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchNewUsers]);

  useEffect(() => {
    const hash = location.hash || '';
    if (!hash.startsWith('#post-')) return;

    if (deepLinkHandledRef.current === hash) return;

    const postId = Number(hash.replace('#post-', ''));
    if (!postId || Number.isNaN(postId)) return;

    let cancelled = false;
    let attempts = 0;

    const tryScroll = () => {
      if (cancelled) return true;
      return highlightAndScrollPost(postId);
    };

    if (tryScroll()) {
      deepLinkHandledRef.current = hash;
      return;
    }

    const interval = window.setInterval(async () => {
      if (cancelled) {
        window.clearInterval(interval);
        return;
      }

      attempts += 1;
      if (tryScroll()) {
        deepLinkHandledRef.current = hash;
        window.clearInterval(interval);
        return;
      }

      if (attempts < 10) return;

      window.clearInterval(interval);

      try {
        const post = await fetchPostById(postId);
        if (cancelled || !post) return;

        setSessionOwnPosts((prev) => {
          const exists = prev.some((item) => item.id === post.id);
          if (exists) return prev;
          return [post, ...prev];
        });

        window.setTimeout(() => {
          if (!cancelled && tryScroll()) {
            deepLinkHandledRef.current = hash;
          }
        }, 220);
      } catch (error) {
        if (!cancelled) {
          showToast(error.message || 'Unable to open linked post', 'error');
        }
      }
    }, 140);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [location.hash, highlightAndScrollPost, fetchPostById]);

  const peopleFiltered = useMemo(() => {
    const query = peopleSearch.trim().toLowerCase();
    if (!query) return peopleUsers;
    return peopleUsers.filter((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const handle = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(query) || handle.includes(query) || email.includes(query);
    });
  }, [peopleUsers, peopleSearch]);

  useEffect(() => {
    setPeopleScrollTop(0);
  }, [peopleSearch]);

  const peopleVirtual = useMemo(() => {
    const total = peopleFiltered.length;
    const startIndex = Math.max(0, Math.floor(peopleScrollTop / PEOPLE_ROW_HEIGHT) - 3);
    const endIndex = Math.min(
      total,
      Math.ceil((peopleScrollTop + PEOPLE_PANEL_HEIGHT) / PEOPLE_ROW_HEIGHT) + 3
    );
    return {
      total,
      startIndex,
      endIndex,
      items: peopleFiltered.slice(startIndex, endIndex),
      totalHeight: total * PEOPLE_ROW_HEIGHT,
    };
  }, [peopleFiltered, peopleScrollTop]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuPostId !== null && !event.target.closest('.post-menu-wrapper')) {
        setOpenMenuPostId(null);
      }
      const isEmojiButton = event.target.closest('[data-emoji-toggle]');
      const isEditEmojiButton = event.target.closest('[data-edit-emoji-toggle]');
      const isEmojiArea = event.target.closest('.emoji-picker-wrapper');
      const isComposeCard = event.target.closest('.compose-card');
      
      if (showEmojiPicker && !isEmojiButton && !isEmojiArea && !isComposeCard) {
        setShowEmojiPicker(false);
      }
      if (showEditEmojiPicker && !isEditEmojiButton && !isEmojiArea) {
        setShowEditEmojiPicker(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuPostId, showEmojiPicker, showEditEmojiPicker]);

  const handleFormChange = (field) => (event) => {
    setProfileForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveState({ loading: false, error: 'Image must be under 5MB', success: false });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({ ...prev, profileImageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaveState({ loading: true, error: null, success: false });
    try {
      const updated = await authService.updateProfile(profileForm);
      setProfile(updated.user || updated);
      setSaveState({ loading: false, error: null, success: true });
      setTimeout(() => setSaveState((prev) => ({ ...prev, success: false })), 2000);
    } catch (err) {
      setSaveState({ loading: false, error: err.message || 'Failed to save', success: false });
    }
  };

  const handleSearchPosts = useCallback(async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setSearchError(null);
      setActivePostSearch('');
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setActivePostSearch(trimmedQuery);

    try {
      const token = authService.getToken();
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/search?q=${encodeURIComponent(trimmedQuery)}&limit=25`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResults(Array.isArray(data.posts) ? data.posts : []);
        setSearchError(null);
      } else {
        setSearchResults([]);
        setSearchError(data.message || 'Unable to search posts');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setSearchError('Unable to search posts');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setActivePostSearch('');
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    // Keep feed unfiltered while typing; apply search only on Enter.
    setActiveHashtags([]);
    setActivePostSearch('');
    setSearchLoading(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    handleSearchPosts(searchQuery);
  };

  const handleClearSearchInput = () => {
    setSearchQuery('');
    setActivePostSearch('');
    setSearchResults([]);
    setSearchError(null);
    setSearchLoading(false);
  };

  const handleHashtagClick = useCallback((tag) => {
    if (!tag) return;
    const normalizedTag = (tag.startsWith('#') ? tag : `#${tag}`).toLowerCase();
    setActiveHashtags((prev) => {
      const already = prev.some((t) => t.toLowerCase() === normalizedTag);
      return already ? prev.filter((t) => t.toLowerCase() !== normalizedTag) : [...prev, normalizedTag];
    });
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setActivePostSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchHashtagPosts = async () => {
      if (activeHashtags.length === 0) {
        setHashtagPosts([]);
        setHashtagError(null);
        setHashtagLoading(false);
        return;
      }

      try {
        setHashtagLoading(true);
        setHashtagError(null);
        const token = authService.getToken();
        const fetches = activeHashtags.map((ht) => {
          const tag = ht.replace(/^#/, '');
          return apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/hashtag/${encodeURIComponent(tag)}?windowDays=30&limit=50`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }).then((res) => res.json()).then((data) => Array.isArray(data.posts) ? data.posts : []);
        });
        const results = await Promise.all(fetches);
        if (cancelled) return;
        // Merge and deduplicate by post id
        const seen = new Set();
        const merged = [];
        for (const batch of results) {
          for (const post of batch) {
            const key = post.pageId ? `page-${post.id}` : `user-${post.id}`;
            if (!seen.has(key)) { seen.add(key); merged.push(post); }
          }
        }
        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHashtagPosts(merged);
      } catch (error) {
        if (!cancelled) {
          setHashtagPosts([]);
          setHashtagError(error.message || 'Unable to fetch hashtag posts');
        }
      } finally {
        if (!cancelled) setHashtagLoading(false);
      }
    };

    fetchHashtagPosts();
    return () => {
      cancelled = true;
    };
  }, [activeHashtags]);

  const openPeopleModal = useCallback((mode = 'all') => {
    setPeopleModalMode(mode);
    setPeopleSearch('');
    setPeopleScrollTop(0);
    setShowPeopleModal(true);
  }, []);

  const handleFriendChat = useCallback((userId) => {
    setShowPeopleModal(false);
    setChatOpenUserId(userId);
    setShowMessagesModal(true);
  }, []);

  const handleFollowUser = async (userId) => {
    try {
      const token = authService.getToken();
      const response = await apiFetch(`${API_CONFIG.ENDPOINTS.USERS}/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        const isMountedRef = { current: true };
        fetchNewUsers(isMountedRef);
        if (responseData.status === 'REQUESTED') {
          setPendingFollowRequestIds((prev) => new Set([...prev, userId]));
          showToast('Follow request sent', 'success');
        } else {
          showToast('Now following user', 'success');
        }
      } else {
        showToast(responseData.message || 'Failed to follow user', 'error');
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleToggleFollowUser = async (userId, relationState) => {
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const isFollowing = relationState === 'following';
      const isRequested = relationState === 'requested';

      const response = await apiFetch(`${API_CONFIG.ENDPOINTS.USERS}/${userId}/follow`, {
        method: isFollowing || isRequested ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        if (responseData.status === 'UNFOLLOWED') {
          setFollowingIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
          showToast('Unfollowed user', 'success');
        } else if (responseData.status === 'REQUEST_CANCELLED') {
          setPendingFollowRequestIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
          showToast('Follow request cancelled', 'success');
        } else if (responseData.status === 'REQUESTED') {
          setPendingFollowRequestIds((prev) => {
            const next = new Set(prev);
            next.add(userId);
            return next;
          });
          showToast('Follow request sent', 'success');
        }
      } else {
        showToast(responseData.message || (isFollowing || isRequested ? 'Failed to remove relation' : 'Failed to follow user'), 'error');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 860);
      if (window.innerWidth < 860) {
        setShowEmojiPanel(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = authService.getToken();

    const interleavePostsWithRatio = (userPosts, pagePosts, ratio = 3) => {
      const mixed = [];
      let userIndex = 0;
      let pageIndex = 0;

      while (userIndex < userPosts.length || pageIndex < pagePosts.length) {
        // Add 'ratio' user posts
        for (let i = 0; i < ratio && userIndex < userPosts.length; i++) {
          mixed.push(userPosts[userIndex++]);
        }
        // Add 1 page post
        if (pageIndex < pagePosts.length) {
          mixed.push(pagePosts[pageIndex++]);
        }
      }

      return mixed;
    };

    const fetchAllPosts = async () => {
      try {
        // Fetch regular feed posts (user posts only)
        const feedRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/feed`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const feedData = await feedRes.json();
        const userPosts = Array.isArray(feedData.posts) ? feedData.posts : [];

        // Fetch followed pages posts
        let pagePosts = [];
        try {
          const pagesRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/feed/followed-pages`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const pagesData = await pagesRes.json();
          pagePosts = Array.isArray(pagesData.posts) ? pagesData.posts : [];
        } catch (err) {
          console.warn('Could not fetch page posts:', err);
          pagePosts = [];
        }

        // Interleave with 1:3 ratio (3 user posts for every 1 page post)
        const mixedPosts = interleavePostsWithRatio(userPosts, pagePosts, 3);

        if (isMounted) {
          setPosts(userPosts);
          setAllPosts(mixedPosts);
          setPostsLoading(false);
          setPostsError(null);
        }
      } catch (error) {
        if (isMounted) {
          setPostsError(error.message || 'Unable to load feed');
          setPostsLoading(false);
        }
      }
    };

    fetchAllPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const postsToUse = displayedPosts;
    setLikeCounts((prev) => {
      const next = { ...prev };
      postsToUse.forEach((post) => {
        if (next[post.id] === undefined) next[post.id] = 0;
      });
      return next;
    });
    setCommentsByPost((prev) => {
      const next = { ...prev };
      postsToUse.forEach((post) => {
        if (!next[post.id]) next[post.id] = [];
      });
      return next;
    });
  }, [displayedPosts]);

  // Function to load likes and comment count
  const loadLikeAndCommentInfo = useCallback(async (postId) => {
    try {
      const token = authService.getToken();
      const likesRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/likes`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (likesRes.ok) {
        const likesData = await likesRes.json();
        setLikeCounts((prev) => ({ ...prev, [postId]: likesData.likeCount }));
        setLikedPosts((prev) => ({ ...prev, [postId]: likesData.likedByUser }));
      }

      const commentsRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/comments`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }));
      }
    } catch (error) {
      console.error(`Error loading likes/comments for post ${postId}:`, error);
    }
  }, []);

  const ensureEngagementLoaded = useCallback(async (postId) => {
    if (!postId) return;
    if (engagementLoadedRef.current.has(postId) || engagementInFlightRef.current.has(postId)) return;

    engagementInFlightRef.current.add(postId);
    try {
      await loadLikeAndCommentInfo(postId);
      engagementLoadedRef.current.add(postId);
    } finally {
      engagementInFlightRef.current.delete(postId);
    }
  }, [loadLikeAndCommentInfo]);

  // Load likes and comments from backend when a post's details are requested
  useEffect(() => {
    const postsToUse = displayedPosts;
    if (postsToUse.length === 0) return;

    const unseenIds = postsToUse
      .map((post) => post.id)
      .filter((postId) => !engagementLoadedRef.current.has(postId) && !engagementInFlightRef.current.has(postId));

    if (unseenIds.length === 0) return;

    const timers = unseenIds.map((postId, index) => {
      const delay = index < 8 ? 0 : Math.min((index - 7) * 120, 2000);
      return setTimeout(() => {
        ensureEngagementLoaded(postId);
      }, delay);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [displayedPosts, ensureEngagementLoaded]);



  const handleMediaUpload = (type) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const maxSize = type === 'video' ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setPostState({ loading: false, error: `${type === 'video' ? 'Video' : 'Image'} must be under ${type === 'video' ? '8MB' : '5MB'}` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMedia({ type, data: reader.result, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleFeelingSelect = (item) => {
    setFeeling(item);
  };

  const handleEmojiSelect = (emojiObject) => {
    setComposerText((prev) => `${prev}${emojiObject.emoji}`);
  };

  const handleEditEmojiSelect = (emojiObject) => {
    setEditContent((prev) => `${prev}${emojiObject.emoji}`);
  };



  const getPostLink = (postId) => `${window.location.origin}/home#post-${postId}`;

  const handleToggleLike = async (postId) => {
    setLikeLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      let isCurrentlyLiked = likedPosts[postId];
      const token = authService.getToken();

      if (typeof isCurrentlyLiked === 'undefined') {
        const likesRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/likes`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });

        if (likesRes.ok) {
          const likesData = await likesRes.json();
          isCurrentlyLiked = Boolean(likesData.likedByUser);
          setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
          setLikeCounts((prev) => ({ ...prev, [postId]: likesData.likeCount || 0 }));
          engagementLoadedRef.current.add(postId);
        } else {
          isCurrentlyLiked = false;
        }
      }

      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/like`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setLikeCounts((prev) => ({ ...prev, [postId]: data.likeCount }));
      } else {
        await ensureEngagementLoaded(postId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleComments = (postId) => {
    setOpenCommentsPostId((prev) => (prev === postId ? null : postId));
    ensureEngagementLoaded(postId);
  };

  const handleCommentChange = (postId, value) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  const handleAddComment = async (postId) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const token = authService.getToken();
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        const comment = await res.json();
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment],
        }));
        setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleShare = async (post) => {
    const url = getPostLink(post.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${appName} Post`,
          text: post.content?.slice(0, 120) || `Check this post on ${appName}`,
          url,
        });
        return;
      } catch (error) {
        // fall back to custom share modal
      }
    }
    setSharePostId(post.id);
  };

  const handleCopyShareLink = async (postId) => {
    try {
      await navigator.clipboard.writeText(getPostLink(postId));
      showToast('Link copied to clipboard!', 'success');
      setSharePostId(null);
    } catch (error) {
      showToast('Unable to copy link', 'error');
    }
  };

  // Markdown to HTML converter
  const markdownToHtml = (text) => {
    const normalized = normalizePostContent(text);
    if (!normalized) return '';
    let html = normalized
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
      .replace(/`(.*?)`/g, '<code>$1</code>')           // `code`
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')          // ### heading3
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')           // ## heading2
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')            // # heading1
      .replace(/^- (.*?)$/gm, '<li>$1</li>')            // - list
      .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>')       // wrap in ul
      .replace(/\n/g, '<br/>');
    html = html.replace(/(^|[\s>])#([a-zA-Z0-9_]+)/g, '$1<a href="#" data-hashtag="#$2">#$2</a>');
    return html;
  };

  const handlePostSubmit = async () => {
    if (!composerText.trim() && !media.data) {
      setPostState({ loading: false, error: 'Write something or attach media.' });
      return;
    }

    setPostState({ loading: true, error: null });
    try {
      // Extract plain text from Lexical editor HTML
      const plainText = composerText
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();

      const payload = {
        content: plainText || null,
        feeling: feeling ? `${feeling.emoji} ${feeling.label}` : null,
        mediaType: media.type,
        mediaUrl: media.data,
      };

      const token = authService.getToken();
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to create post');
      }

      setSessionOwnPosts((prev) => [data, ...prev]);
      setComposerText('');
      setComposeEditorKey((prev) => prev + 1);
      setMedia({ type: null, data: null, name: '' });
      setFeeling(null);
      setShowEmojiPanel(false);
      setPostState({ loading: false, error: null });
      showToast('Post published successfully!', 'success');
    } catch (error) {
      setPostState({ loading: false, error: error.message || 'Unable to create post' });
    }
  };

  const timeAgo = (dateValue) => {
    if (!dateValue) return '';
    const diff = Date.now() - new Date(dateValue).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false, showInput: false }));
    setDialogInput('');
    dialogActionRef.current = null;
    if (storyViewer.open) {
      setIsStoryPaused(false);
    }
  };

  const openAlert = (message, title = 'Notice') => {
    setDialogState({
      open: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      variant: 'default',
      showInput: false,
      inputPlaceholder: ''
    });
    dialogActionRef.current = () => closeDialog();
  };

  const openConfirm = (message, onConfirm, title = 'Confirm', confirmText = 'Confirm') => {
    setDialogState({
      open: true,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      variant: 'danger',
      showInput: false,
      inputPlaceholder: ''
    });
    dialogActionRef.current = async () => {
      closeDialog();
      await onConfirm();
    };
  };

  const openPrompt = (title, message, onConfirm, placeholder = 'Type here...') => {
    dialogInputRef.current = '';
    setDialogInput('');
    setDialogState({
      open: true,
      title,
      message,
      confirmText: 'Submit',
      cancelText: 'Cancel',
      variant: 'default',
      showInput: true,
      inputPlaceholder: placeholder
    });
    dialogActionRef.current = async () => {
      const value = dialogInputRef.current.trim();
      closeDialog();
      await onConfirm(value);
    };
  };

  const handleDialogConfirm = async () => {
    if (dialogActionRef.current) {
      await dialogActionRef.current();
    } else {
      closeDialog();
    }
  };

  const handleDeletePost = async (postId) => {
    openConfirm('Delete this post?', async () => {
      const token = authService.getToken();
      try {
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to delete');
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setAllPosts((prev) => prev.filter((p) => p.id !== postId));
        setSessionOwnPosts((prev) => prev.filter((p) => p.id !== postId));
        setOpenMenuPostId(null);
        showToast('Post deleted successfully', 'success');
      } catch (error) {
        openAlert(error.message || 'Unable to delete post');
      }
    }, 'Delete post', 'Delete');
  };

  const handleReportPost = async (postId) => {
    openPrompt('Report post', 'Share the reason for reporting this post.', async (reason) => {
      if (!reason) return;
      const token = authService.getToken();
      try {
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason }),
        });
        if (!res.ok) throw new Error('Unable to report');
        showToast('Post reported successfully', 'success');
        setOpenMenuPostId(null);
      } catch (error) {
        showToast(error.message || 'Failed to report post', 'error');
      }
    }, 'Tell us why you are reporting this post');
  };

  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || '');
    setEditMedia({
      type: post.mediaType || null,
      data: post.mediaUrl || null,
      name: '',
    });
    setOpenMenuPostId(null);
  };

  const handleEditMediaUpload = (type) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const maxSize = type === 'video' ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      openAlert(`${type === 'video' ? 'Video' : 'Image'} must be under ${type === 'video' ? '8MB' : '5MB'}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditMedia({ type, data: reader.result, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditMedia = () => {
    setEditMedia({ type: null, data: null, name: '' });
  };

  const handleSaveEdit = async (postId) => {
    const normalizedContent = (editContent || '').trim();
    if (!normalizedContent && !editMedia.data) {
      openAlert('Post content or media is required');
      return;
    }
    const token = authService.getToken();
    try {
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: normalizedContent || null,
          mediaType: editMedia.type,
          mediaUrl: editMedia.data,
        }),
      });
      if (!res.ok) throw new Error('Unable to update');
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? {
        ...p,
        content: updated.content,
        mediaType: updated.mediaType,
        mediaUrl: updated.mediaUrl,
      } : p)));
      setAllPosts((prev) => prev.map((p) => (p.id === postId ? {
        ...p,
        content: updated.content,
        mediaType: updated.mediaType,
        mediaUrl: updated.mediaUrl,
      } : p)));
      setSessionOwnPosts((prev) => prev.map((p) => (p.id === postId ? {
        ...p,
        content: updated.content,
        mediaType: updated.mediaType,
        mediaUrl: updated.mediaUrl,
      } : p)));
      setEditingPostId(null);
      setEditContent('');
      setEditMedia({ type: null, data: null, name: '' });
      setShowEditEmojiPicker(false);
      showToast('Post updated successfully!', 'success');
    } catch (error) {
      openAlert(error.message || 'Unable to update post');
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
    setEditMedia({ type: null, data: null, name: '' });
    setShowEditEmojiPicker(false);
  };

  return (
    <div className="home-page">
      <AppHeader showPageNav={false}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearchInput}
              aria-label="Clear search"
              title="Clear"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                fontSize: '18px',
                lineHeight: 1,
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              ×
            </button>
          )}
        </div>
      </AppHeader>

      <main className="home-shell">
        {/* Left Sidebar */}
        <aside className="side-panel">
          <div className="panel-card">
            <div className="profile-card">
              {profileLoading ? (
                <>
                  <div className="profile-avatar skeleton-block" />
                  <div className="profile-details" style={{ width: '100%' }}>
                    <div className="skeleton-line" style={{ width: '140px', height: '16px' }} />
                    <div className="skeleton-line" style={{ width: '96px', height: '12px' }} />
                    <div className="skeleton-line" style={{ width: '92px', height: '30px', borderRadius: '999px', marginTop: '8px' }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-avatar">
                    {profile?.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt={displayName} loading="eager" decoding="async" />
                    ) : (
                      avatarLetter
                    )}
                  </div>
                  <div className="profile-details">
                    <div
                      className="profile-name"
                      onClick={() => profile?.id && navigate(`/profile/${profile.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {displayName}
                    </div>
                    <div className="profile-handle">{userHandle}</div>
                    <button className="profile-link" onClick={() => setIsAccountOpen(true)}>My Account</button>
                    {profileError && (
                      <div className="profile-error">{profileError}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-title">Quick Links</div>
            <div className="nav-list">
              <div className="nav-item" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>🏠 Home Feed</div>
              <div className="nav-item" onClick={() => navigate('/my-posts')} style={{ cursor: 'pointer' }}>📝 My Posts</div>
              <div className="nav-item" onClick={() => navigate('/pages/my-pages')} style={{ cursor: 'pointer' }}>📄 Pages</div>
              <div className="nav-item" onClick={() => {
                setChatOpenUserId(null);
                setShowMessagesModal(true);
              }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span>💬 Messages</span>
                {unreadMessagesCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '999px',
                    minWidth: '20px',
                    height: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 6px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </div>
              <div className="nav-item" onClick={() => openPeopleModal('friends')} style={{ cursor: 'pointer' }}>👥 Friends</div>
              <div className="nav-item" onClick={() => openPeopleModal('requests')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span>✅ Follow Requests</span>
                {incomingRequestCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '999px',
                    minWidth: '20px',
                    height: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 6px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {incomingRequestCount > 99 ? '99+' : incomingRequestCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Feed */}
        <section className="feed">
          <div className="stories-strip">
            <button className="story-add-card" onClick={() => setShowStoryComposer(true)}>
              <span className="story-add-plus">＋</span>
              <span>Add Story</span>
            </button>

            {storiesLoading && <div className="stories-loading">Loading stories...</div>}

            {!storiesLoading && storyGroups.map((group, groupIndex) => {
              const profileName = getUserDisplayName(group.user);
              const latestStory = group.stories[group.stories.length - 1];
              const hasUnviewed = Boolean(group.hasUnviewed);

              return (
                <button
                  key={group.user.id}
                  className={`story-bubble ${hasUnviewed ? 'unviewed' : 'viewed'}`}
                  onClick={() => openStoryViewer(groupIndex)}
                >
                  <div className="story-avatar-wrap">
                    <div className="story-avatar">
                      {group.user.profileImageUrl ? (
                        <img src={group.user.profileImageUrl} alt={profileName} />
                      ) : (
                        profileName[0]
                      )}
                    </div>
                  </div>
                  <span className="story-name">{group.isOwn ? 'Your story' : profileName}</span>
                  {latestStory && <span className="story-time">{timeAgo(latestStory.createdAt)}</span>}
                </button>
              );
            })}
          </div>

          <div className="compose-card">
            <LexicalEditor
              key={composeEditorKey}
              placeholder="Share something with your community..."
              onChange={setComposerText}
            />
            {media.data && (
              <div className="compose-media-preview">
                {media.type === 'image' ? (
                  <img src={media.data} alt={media.name || 'Upload'} />
                ) : (
                  <video src={media.data} controls />
                )}
                <button className="media-remove" onClick={() => setMedia({ type: null, data: null, name: '' })}>
                  Remove
                </button>
              </div>
            )}
            {feeling && (
              <div className="compose-feeling">Feeling {feeling.emoji} {feeling.label}</div>
            )}
            {postState.error && <div className="compose-error">{postState.error}</div>}
            <div className="compose-actions">
              <div className="compose-tools">
                <label className="compose-tool">
                  📷 Photo
                  <input type="file" accept="image/*" onChange={handleMediaUpload('image')} />
                </label>
                <label className="compose-tool">
                  🎥 Video
                  <input type="file" accept="video/*" onChange={handleMediaUpload('video')} />
                </label>
                <div className="emoji-popover-anchor">
                  <button className="compose-tool" type="button" data-emoji-toggle onClick={() => setShowEmojiPicker((prev) => !prev)}>
                    😊 Emoji
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-picker-wrapper">
                      <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                  )}
                </div>
              </div>
              <button className="compose-btn" onClick={handlePostSubmit} disabled={postState.loading}>
                {postState.loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {postsLoading && (
            <div className="feed-skeleton-list" aria-label="Loading feed">
              {[1, 2, 3].map((item) => (
                <div key={item} className="post-card feed-skeleton-card">
                  <div className="feed-skeleton-header">
                    <div className="feed-skeleton-avatar" />
                    <div className="feed-skeleton-meta">
                      <div className="skeleton-line" style={{ width: '120px', height: '14px' }} />
                      <div className="skeleton-line" style={{ width: '90px', height: '11px' }} />
                    </div>
                  </div>
                  <div className="skeleton-line" style={{ width: '100%', height: '12px' }} />
                  <div className="skeleton-line" style={{ width: '86%', height: '12px' }} />
                  <div className="feed-skeleton-media" />
                </div>
              ))}
            </div>
          )}
          {postsError && (
            <div className="feed-status error">{postsError}</div>
          )}
          {!postsLoading && displayedPosts.length === 0 && !postsError && activeHashtags.length === 0 && !activePostSearch && (
            <div className="feed-status">No posts yet. Start the conversation!</div>
          )}
          {!postsLoading && !hashtagLoading && !hashtagError && displayedPosts.length === 0 && activeHashtags.length > 0 && (
            <div className="feed-status">No posts found for {activeHashtags.join(', ')}</div>
          )}
          {!postsLoading && hashtagLoading && activeHashtags.length > 0 && (
            <div className="feed-status">Loading posts for {activeHashtags.join(', ')}...</div>
          )}
          {!postsLoading && hashtagError && activeHashtags.length > 0 && (
            <div className="feed-status error">{hashtagError}</div>
          )}
          {!postsLoading && !searchLoading && !searchError && displayedPosts.length === 0 && activePostSearch && activeHashtags.length === 0 && (
            <div className="feed-status">No posts found for "{activePostSearch}"</div>
          )}
          {!postsLoading && searchLoading && activePostSearch && activeHashtags.length === 0 && (
            <div className="feed-status">Searching posts for "{activePostSearch}"...</div>
          )}
          {!postsLoading && searchError && activePostSearch && activeHashtags.length === 0 && (
            <div className="feed-status error">{searchError}</div>
          )}

          {activeHashtags.length > 0 && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #c7d2fe', borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#334155', marginRight: '4px' }}>Filtering by:</span>
              {activeHashtags.map((ht) => (
                <span
                  key={ht}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e0e7ff', color: '#3730a3', borderRadius: '999px', padding: '3px 10px', fontSize: '13px', fontWeight: 600 }}
                >
                  {ht}
                  <button
                    onClick={() => setActiveHashtags((prev) => prev.filter((t) => t !== ht))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, fontSize: '14px', lineHeight: 1, padding: '0 0 0 2px' }}
                    title={`Remove ${ht}`}
                  >×</button>
                </span>
              ))}
              <button
                onClick={() => setActiveHashtags([])}
                aria-label="Clear all hashtags"
                title="Clear all hashtags"
                style={{ marginLeft: 'auto', width: '24px', height: '24px', border: '1px solid #c7d2fe', background: '#fff', borderRadius: '999px', padding: 0, fontSize: '16px', lineHeight: 1, cursor: 'pointer', color: '#6366f1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
          )}

          {activePostSearch && activeHashtags.length === 0 && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ fontSize: '13px', color: '#334155' }}>Showing posts for <strong>"{activePostSearch}"</strong></div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setSearchError(null);
                  setActivePostSearch('');
                }}
                style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          )}

          {(() => {
            const renderedElements = [];

            displayedPosts.forEach((post, index) => {
              // Count all comments including nested replies
              const countAllComments = (comments) => {
                if (!comments || comments.length === 0) return 0;
                return comments.reduce((total, comment) => {
                  return total + 1 + (countAllComments(comment.replies) || 0);
                }, 0);
              };
              
              // Create unique key for posts (differentiate page posts from user posts)
              const uniqueKey = post.pageId ? `page-${post.id}` : `user-${post.id}`;

              const postElement = (
                <PostCard
                  key={uniqueKey}
                  post={post}
                  openMenuPostId={openMenuPostId}
                  editingPostId={editingPostId}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  editMedia={editMedia}
                  onEditMediaUpload={handleEditMediaUpload}
                  onRemoveEditMedia={handleRemoveEditMedia}
                  onMenuToggle={setOpenMenuPostId}
                  onEditStart={handleEditPost}
                  onEditCancel={handleCancelEdit}
                  onEditSave={handleSaveEdit}
                  onDelete={handleDeletePost}
                  onReport={handleReportPost}
                  onToggleLike={handleToggleLike}
                  onToggleComments={handleToggleComments}
                  onShare={handleShare}
                  onEditEmojiSelect={handleEditEmojiSelect}
                  showEditEmojiPicker={showEditEmojiPicker}
                  setShowEditEmojiPicker={setShowEditEmojiPicker}
                  likeCount={likeCounts[post.id] ?? 0}
                  commentCount={countAllComments(commentsByPost[post.id]) || 0}
                  isLiked={Boolean(likedPosts[post.id])}
                  currentUserId={currentUserId}
                  formatDate={timeAgo}
                  markdownToHtml={markdownToHtml}
                  shareIcon={shareIcon}
                  onCommentAdded={() => loadLikeAndCommentInfo(post.id)}
                  openCommentsPostId={openCommentsPostId}
                  showToast={showToast}
                  onHashtagClick={handleHashtagClick}
                />
              );

              renderedElements.push(postElement);

              // Add PageCarousel after 3rd post
              if (activeHashtags.length === 0 && index === 2) {
                renderedElements.push(<PageCarousel key="page-carousel" />);
              }
            });

            return renderedElements;
          })()}
        </section>

        {/* Right Panel */}
        <aside className="side-panel right-panel">
          <div className="panel-card right-card">
            <div className="panel-title">People on {appName}</div>
            {newUsers
              .filter((user) => user.id !== profile?.id && user.role !== 'ADMIN')
              .slice(0, 5)
              .map((user) => {
              const name = getUserDisplayName(user);
              const handle = `@${getUserHandle(user)}`;

              return (
                <div key={user.id} className="suggestion">
                  <div 
                    className="suggestion-info"
                    onClick={() => navigate(`/profile/${user.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="suggestion-avatar">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt={name} />
                      ) : (
                        name[0]
                      )}
                    </div>
                    <div>
                      <div className="suggestion-name">{name}</div>
                      <div className="suggestion-handle">{handle}</div>
                    </div>
                  </div>
                  <button 
                    className="suggestion-btn"
                    onClick={() => handleFollowUser(user.id)}
                  >
                    Follow
                  </button>
                </div>
              );
            })}
            {newUsers
              .filter((user) => user.id !== profile?.id && user.role !== 'ADMIN')
              .slice(0, 5).length > 0 && (
              <button
                onClick={() => openPeopleModal('all')}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                View more
              </button>
            )}
            {newUsers.length === 0 && !newUsersError && (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>No new members yet.</div>
            )}
            {newUsersError && (
              <div style={{ fontSize: 12, color: '#ef4444' }}>{newUsersError}</div>
            )}
          </div>

          <div className="panel-card">
            <div className="panel-title">Trending</div>
            <div className="nav-list">
              {trendingTagsLoading && <div className="nav-item">Loading trends...</div>}
              {!trendingTagsLoading && trendingTags.map((trend) => (
                <div
                  key={trend.tag}
                  className="nav-item"
                  title={`${trend.postCount} posts this week`}
                  onClick={() => handleHashtagClick(trend.tag)}
                  style={{
                    cursor: 'pointer',
                    background: activeHashtags.some((t) => t.toLowerCase() === trend.tag.toLowerCase()) ? '#e0e7ff' : undefined,
                    color: activeHashtags.some((t) => t.toLowerCase() === trend.tag.toLowerCase()) ? '#3730a3' : undefined,
                    fontWeight: activeHashtags.some((t) => t.toLowerCase() === trend.tag.toLowerCase()) ? 700 : undefined,
                  }}
                >
                  {trend.tag}
                </div>
              ))}
              {!trendingTagsLoading && !trendingTagsError && trendingTags.length === 0 && (
                <div className="nav-item">No trends yet</div>
              )}
              {!trendingTagsLoading && trendingTagsError && (
                <div className="nav-item">Unable to load trends</div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {sharePostId && (
        <div className="share-overlay" onClick={() => setSharePostId(null)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-header">
              <h3>Share post</h3>
              <button className="share-close" onClick={() => setSharePostId(null)}>✕</button>
            </div>
            <div className="share-actions">
              <button className="share-action" onClick={() => handleCopyShareLink(sharePostId)}>
                📋 Copy link
              </button>
              <a
                className="share-action"
                href={`https://wa.me/?text=${encodeURIComponent(getPostLink(sharePostId))}`}
                target="_blank"
                rel="noreferrer"
              >
                🟢 WhatsApp
              </a>
              <a
                className="share-action"
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getPostLink(sharePostId))}`}
                target="_blank"
                rel="noreferrer"
              >
                🐦 Twitter
              </a>
              <a
                className="share-action"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getPostLink(sharePostId))}`}
                target="_blank"
                rel="noreferrer"
              >
                💼 LinkedIn
              </a>
              <a
                className="share-action"
                href={`mailto:?subject=${encodeURIComponent(`${appName} Post`)}&body=${encodeURIComponent(getPostLink(sharePostId))}`}
              >
                ✉️ Email
              </a>
            </div>
          </div>
        </div>
      )}

      {showPeopleModal && (
        <div
          onClick={() => setShowPeopleModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '80vh',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 20px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  {peopleModalMode === 'friends'
                    ? 'My Friends'
                    : peopleModalMode === 'requests'
                      ? 'Follow Requests'
                      : `People on ${appName}`}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {peopleModalMode === 'friends'
                    ? 'Chat or view your friends'
                    : peopleModalMode === 'requests'
                      ? 'Accept or reject incoming follow requests'
                      : 'Browse and follow members'}
                </div>
              </div>
              <button
                onClick={() => setShowPeopleModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <input
                type="text"
                placeholder={peopleModalMode === 'friends'
                  ? 'Search friends by name, username, or email...'
                  : peopleModalMode === 'requests'
                    ? 'Search follow requests by name, username, or email...'
                    : 'Search people by name, username, or email...'}
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ padding: '0 20px 20px 20px' }}>
              {peopleUsersLoading && (
                <div style={{ fontSize: '13px', color: '#64748b', padding: '12px 0' }}>
                  {peopleModalMode === 'friends'
                    ? 'Loading friends...'
                    : peopleModalMode === 'requests'
                      ? 'Loading follow requests...'
                      : 'Loading people...'}
                </div>
              )}
              {peopleUsersError && (
                <div style={{ fontSize: '13px', color: '#ef4444', padding: '12px 0' }}>{peopleUsersError}</div>
              )}
              {!peopleUsersLoading && !peopleUsersError && peopleVirtual.total === 0 && (
                <div style={{ fontSize: '13px', color: '#64748b', padding: '12px 0' }}>
                  {peopleModalMode === 'friends'
                    ? 'No friends found.'
                    : peopleModalMode === 'requests'
                      ? 'No follow requests found.'
                      : 'No people found.'}
                </div>
              )}

              {!peopleUsersLoading && !peopleUsersError && peopleVirtual.total > 0 && (
                <div
                  style={{
                    height: PEOPLE_PANEL_HEIGHT,
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px 12px'
                  }}
                  onScroll={(e) => setPeopleScrollTop(e.currentTarget.scrollTop)}
                >
                  <div style={{ height: peopleVirtual.totalHeight, position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: peopleVirtual.startIndex * PEOPLE_ROW_HEIGHT,
                        left: 0,
                        right: 0
                      }}
                    >
                      {peopleVirtual.items.map((user) => {
                        const name = getUserDisplayName(user);
                        const handle = `@${getUserHandle(user)}`;
                        const isFollowing = followingIds.has(user.id);
                        const isRequested = pendingFollowRequestIds.has(user.id);
                        const relationState = isFollowing ? 'following' : (isRequested ? 'requested' : 'none');

                        return (
                          <div
                            key={user.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              padding: '10px 0',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                          >
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                              onClick={() => navigate(`/profile/${user.id}`)}
                            >
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: '#e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '600',
                                  color: '#475569',
                                  overflow: 'visible',
                                  position: 'relative'
                                }}
                              >
                                {user.profileImageUrl ? (
                                  <img src={user.profileImageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                ) : (
                                  name[0]
                                )}
                                <div style={{ position: 'absolute', bottom: 0, right: 0, transform: 'translate(25%, 25%)' }}>
                                  <OnlineIndicator userId={user.id} size="medium" />
                                </div>
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{name}</div>
                                <div style={{ color: '#64748b', fontSize: '12px' }}>{handle}</div>
                              </div>
                            </div>
                            {peopleModalMode === 'friends' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  onClick={() => handleFriendChat(user.id)}
                                  title="Chat"
                                  aria-label="Open chat"
                                  style={{
                                    padding: '6px',
                                    borderRadius: '6px',
                                    border: '1px solid #c7d2fe',
                                    background: '#eef2ff',
                                    color: '#4338ca',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '34px',
                                    height: '34px'
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                  </svg>
                                </button>
                              </div>
                            ) : peopleModalMode === 'requests' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  onClick={() => handleIncomingFollowRequest(user.id, 'accept')}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #10b981',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleIncomingFollowRequest(user.id, 'reject')}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#0f172a',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleToggleFollowUser(user.id, relationState)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: isFollowing
                                    ? '1px solid #fca5a5'
                                    : (isRequested ? '1px solid #cbd5e1' : '1px solid #cbd5e1'),
                                  background: isFollowing
                                    ? '#fee2e2'
                                    : (isRequested ? '#f1f5f9' : '#ffffff'),
                                  color: isFollowing
                                    ? '#b91c1c'
                                    : (isRequested ? '#334155' : '#0f172a'),
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                {isFollowing ? 'Unfollow' : (isRequested ? 'Cancel Request' : 'Follow')}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStoryComposer && (
        <div className="story-modal-overlay" onClick={() => setShowStoryComposer(false)}>
          <div className="story-composer-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Story</h3>
            <textarea
              placeholder="Share a quick update..."
              value={storyDraft.textContent}
              onChange={(e) => setStoryDraft((prev) => ({ ...prev, textContent: e.target.value }))}
              rows={4}
            />

            <div className="story-composer-row">
              <label className="story-upload-btn" title="Add photo" aria-label="Add photo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <input type="file" accept="image/*" onChange={handleStoryMediaUpload('IMAGE')} />
              </label>
              <label className="story-upload-btn" title="Add video" aria-label="Add video">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <input type="file" accept="video/*" onChange={handleStoryMediaUpload('VIDEO')} />
              </label>
              <input
                type="color"
                value={storyDraft.background}
                onChange={(e) => setStoryDraft((prev) => ({ ...prev, background: e.target.value }))}
                title="Story background"
                aria-label="Story background"
              />
            </div>

            {storyDraft.mediaUrl && (
              <div className="story-preview-media">
                {storyDraft.mediaType === 'VIDEO' ? (
                  <video src={storyDraft.mediaUrl} controls />
                ) : (
                  <img src={storyDraft.mediaUrl} alt="Story preview" />
                )}
              </div>
            )}

            <div className="story-modal-actions">
              <button onClick={() => setShowStoryComposer(false)} title="Close" aria-label="Close story composer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <button onClick={handleCreateStory} disabled={storySaving} title="Post" aria-label="Post story">
                {storySaving ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {storyViewer.open && currentStory && currentStoryGroup && (
        <div className="story-modal-overlay" onClick={closeStoryViewer}>
          <div className="story-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-header">
              <div className="story-viewer-user">
                {currentStoryGroup.user.profileImageUrl ? (
                  <img src={currentStoryGroup.user.profileImageUrl} alt={getUserDisplayName(currentStoryGroup.user)} />
                ) : (
                  <div className="story-viewer-fallback">{getUserDisplayName(currentStoryGroup.user)[0]}</div>
                )}
                <div>
                  <strong>{currentStoryGroup.isOwn ? 'Your story' : getUserDisplayName(currentStoryGroup.user)}</strong>
                  <span>{timeAgo(currentStory.createdAt)}</span>
                </div>
              </div>
              <div className="story-viewer-header-actions">
                {currentStoryGroup.isOwn && (
                  <span className="story-view-count" title="Views" aria-label={`Story views: ${currentStory.viewCount || 0}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>{currentStory.viewCount || 0}</span>
                  </span>
                )}

                {currentStoryGroup.isOwn && (
                  <button
                    onClick={handleDeleteCurrentStory}
                    title="Delete story"
                    aria-label="Delete story"
                    disabled={storyDeleting}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                  </button>
                )}

                <button onClick={closeStoryViewer} title="Close story" aria-label="Close story">✕</button>
              </div>
            </div>

            <div className="story-viewer-content" style={{ background: currentStory.background || '#0f172a' }}>
              <div className="story-progress-track" aria-hidden="true">
                {currentStoryGroup.stories.map((story, index) => {
                  const isPast = index < storyViewer.storyIndex;
                  const isCurrent = index === storyViewer.storyIndex;
                  const width = isPast ? 100 : (isCurrent ? storyProgress : 0);

                  return (
                    <div key={story.id} className="story-progress-segment">
                      <div className="story-progress-fill" style={{ width: `${width}%` }} />
                    </div>
                  );
                })}
              </div>

              <button
                className="story-tap-zone left"
                onClick={() => handleStoryTap('prev')}
                onMouseDown={startStoryHold}
                onMouseUp={endStoryHold}
                onMouseLeave={endStoryHold}
                onTouchStart={startStoryHold}
                onTouchEnd={endStoryHold}
                onTouchCancel={endStoryHold}
                aria-label="Previous story"
                title="Previous"
              >
                <span className="story-nav-arrow" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </span>
              </button>

              <div key={`${currentStoryGroup.user.id}-${currentStory.id}`} className="story-media-stage">
                {currentStory.mediaUrl ? (
                  currentStory.mediaType === 'VIDEO' ? (
                    <video
                      ref={storyVideoRef}
                      src={currentStory.mediaUrl}
                      autoPlay
                      muted
                      playsInline
                      onLoadedMetadata={(event) => {
                        const durationSec = Number(event.currentTarget.duration || 0);
                        if (durationSec > 0) {
                          setStoryVideoDurationMs(Math.min(durationSec * 1000, 20000));
                        }
                      }}
                      onEnded={goToNextStory}
                    />
                  ) : (
                    <img src={currentStory.mediaUrl} alt="Story" />
                  )
                ) : (
                  <div className="story-viewer-text-only">{currentStory.textContent || 'Story'}</div>
                )}
              </div>

              <button
                className="story-tap-zone right"
                onClick={() => handleStoryTap('next')}
                onMouseDown={startStoryHold}
                onMouseUp={endStoryHold}
                onMouseLeave={endStoryHold}
                onTouchStart={startStoryHold}
                onTouchEnd={endStoryHold}
                onTouchCancel={endStoryHold}
                aria-label="Next story"
                title="Next"
              >
                <span className="story-nav-arrow" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </span>
              </button>

              {currentStory.textContent && currentStory.mediaUrl && (
                <div className="story-viewer-caption">{currentStory.textContent}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <MessagesModal
        isOpen={showMessagesModal}
        onClose={() => {
          setShowMessagesModal(false);
          setChatOpenUserId(null);
        }}
        currentUserId={currentUserId}
        openDirectUserId={chatOpenUserId}
        onUnreadChange={setUnreadMessagesCount}
        onOpenProfile={(userId) => {
          setShowMessagesModal(false);
          setChatOpenUserId(null);
          navigate(`/profile/${userId}`);
        }}
      />

      <Dialog
        isOpen={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        showInput={dialogState.showInput}
        inputValue={dialogInput}
        onInputChange={handleDialogInputChange}
        inputPlaceholder={dialogState.inputPlaceholder}
        onConfirm={handleDialogConfirm}
        onCancel={dialogState.showInput || dialogState.cancelText ? closeDialog : undefined}
      />

      {isAccountOpen && (
        <div className="account-overlay" onClick={() => setIsAccountOpen(false)}>
          <div className="account-panel" onClick={(e) => e.stopPropagation()}>
            <div className="account-panel-header">
              <div>
                <div className="account-title">My Account</div>
                <div className="account-subtitle">Manage your profile details</div>
              </div>
              <button className="account-close" onClick={() => setIsAccountOpen(false)}>✕</button>
            </div>

            <div className="account-avatar-row">
              <div className="account-avatar-preview">
                {profileForm.profileImageUrl ? (
                  <img src={profileForm.profileImageUrl} alt="Profile" />
                ) : (
                  avatarLetter
                )}
              </div>
              <div>
                <div className="account-upload-title">Profile picture</div>
                <div className="account-upload-subtitle">PNG, JPG up to 5MB</div>
                <label className="account-upload-btn">
                  Upload
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>
            </div>

            <div className="account-form">
              <div className="form-row">
                <label>First name</label>
                <input value={profileForm.firstName} onChange={handleFormChange('firstName')} placeholder="First name" />
              </div>
              <div className="form-row">
                <label>Last name</label>
                <input value={profileForm.lastName} onChange={handleFormChange('lastName')} placeholder="Last name" />
              </div>
              <div className="form-row">
                <label>Username</label>
                <input value={profileForm.username} onChange={handleFormChange('username')} placeholder="username" />
                <span className="form-help">3-20 chars, letters/numbers/._ only</span>
              </div>
              <div className="form-row full">
                <label>Bio</label>
                <textarea rows={3} value={profileForm.bio} onChange={handleFormChange('bio')} placeholder="Tell your community about you" />
              </div>
            </div>

            {saveState.error && <div className="account-error">{saveState.error}</div>}
            {saveState.success && <div className="account-success">Profile updated.</div>}

            <div className="account-actions">
              <button className="account-secondary" onClick={() => setIsAccountOpen(false)}>Cancel</button>
              <button className="account-primary" onClick={handleSaveProfile} disabled={saveState.loading}>
                {saveState.loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Home;

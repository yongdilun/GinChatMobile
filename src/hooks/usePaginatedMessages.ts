import { useState, useCallback, useRef } from 'react';
import { Message, chatAPI } from '@/services/api';

interface PaginatedMessagesState {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  firstUnreadMessageId?: string;
  unreadMessageIndex?: number;
}

interface UsePaginatedMessagesReturn extends PaginatedMessagesState {
  loadInitialMessages: (currentUserId?: number) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  addNewMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  reset: () => void;
}

export function usePaginatedMessages(chatroomId: string): UsePaginatedMessagesReturn {
  const [state, setState] = useState<PaginatedMessagesState>({
    messages: [],
    hasMore: false,
    nextCursor: undefined,
    unreadCount: 0,
    totalCount: 0,
    loading: false,
    loadingMore: false,
    error: null,
    firstUnreadMessageId: undefined,
    unreadMessageIndex: undefined,
  });

  // Track if we've loaded initial messages to prevent duplicate calls
  const hasLoadedInitial = useRef(false);
  const isLoadingRef = useRef(false);

  // Function to find the first unread message for the current user
  const findFirstUnreadMessage = useCallback((messages: Message[], currentUserId?: number) => {
    if (!currentUserId || !messages.length) return null;

    // Sort messages chronologically (oldest first) for finding the first unread
    const sortedMessages = [...messages].sort((a, b) =>
      new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );

    // Find the first message that the current user hasn't read
    for (let i = 0; i < sortedMessages.length; i++) {
      const message = sortedMessages[i];

      // Skip own messages
      if (message.sender_id === currentUserId) continue;

      // Check if current user has read this message
      const userReadStatus = message.read_status?.find(
        status => status.user_id === currentUserId && status.is_read === true
      );

      if (!userReadStatus) {
        // Found the oldest unread message
        // Find its index in the display order (newest first)
        const displayIndex = messages.findIndex(m => m.id === message.id);
        return {
          messageId: message.id,
          displayIndex,
        };
      }
    }

    return null;
  }, []);

  const loadInitialMessages = useCallback(async (currentUserId?: number) => {
    if (isLoadingRef.current || hasLoadedInitial.current) {
      console.log('[usePaginatedMessages] Skipping initial load - already loading or loaded');
      return;
    }

    isLoadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[usePaginatedMessages] Loading initial messages for chatroom:', chatroomId);

      // Load initial messages (50 by default, or all unread if > 50)
      const response = await chatAPI.getMessagesPaginated(chatroomId, { limit: 50 });

      console.log('[usePaginatedMessages] Initial load response:', {
        messageCount: response.messages.length,
        hasMore: response.has_more,
        unreadCount: response.unread_count,
        totalCount: response.total_count
      });

      // Sort messages in reverse chronological order (newest first) for inverted FlatList
      const sortedMessages = response.messages.sort((a, b) =>
        new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      );

      // Find the first unread message position (only set once when entering the room)
      const firstUnreadInfo = findFirstUnreadMessage(sortedMessages, currentUserId);

      setState(prev => ({
        ...prev,
        messages: sortedMessages,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
        unreadCount: response.unread_count,
        totalCount: response.total_count,
        loading: false,
        error: null,
        firstUnreadMessageId: firstUnreadInfo?.messageId,
        unreadMessageIndex: firstUnreadInfo?.displayIndex,
      }));

      hasLoadedInitial.current = true;
      console.log('[usePaginatedMessages] ✅ Initial messages loaded successfully', {
        firstUnreadMessageId: firstUnreadInfo?.messageId,
        unreadMessageIndex: firstUnreadInfo?.displayIndex,
      });

    } catch (error) {
      console.error('[usePaginatedMessages] Error loading initial messages:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load messages',
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [chatroomId, findFirstUnreadMessage]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingRef.current || !state.hasMore || !state.nextCursor) {
      console.log('[usePaginatedMessages] Skipping load more - conditions not met');
      return;
    }

    isLoadingRef.current = true;
    setState(prev => ({ ...prev, loadingMore: true, error: null }));

    try {
      console.log('[usePaginatedMessages] Loading more messages before:', state.nextCursor);

      // Load 50 more messages before the cursor
      const response = await chatAPI.getMessagesPaginated(chatroomId, {
        limit: 50,
        before: state.nextCursor
      });

      console.log('[usePaginatedMessages] Load more response:', {
        messageCount: response.messages.length,
        hasMore: response.has_more
      });

      // Sort new messages in reverse chronological order (newest first)
      const sortedNewMessages = response.messages.sort((a, b) =>
        new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      );

      setState(prev => ({
        ...prev,
        // Append older messages to the end of the array (since we're using newest first order)
        messages: [...prev.messages, ...sortedNewMessages],
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
        loadingMore: false,
        error: null,
      }));

      console.log('[usePaginatedMessages] ✅ More messages loaded successfully');

    } catch (error) {
      console.error('[usePaginatedMessages] Error loading more messages:', error);
      setState(prev => ({
        ...prev,
        loadingMore: false,
        error: 'Failed to load more messages',
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [chatroomId, state.hasMore, state.nextCursor]);

  const addNewMessage = useCallback((message: Message) => {
    setState(prev => ({
      ...prev,
      // Add new message at the beginning since we're using newest first order
      messages: [message, ...prev.messages],
      totalCount: prev.totalCount + 1,
    }));
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }));
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId),
      totalCount: Math.max(0, prev.totalCount - 1),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      messages: [],
      hasMore: false,
      nextCursor: undefined,
      unreadCount: 0,
      totalCount: 0,
      loading: false,
      loadingMore: false,
      error: null,
      firstUnreadMessageId: undefined,
      unreadMessageIndex: undefined,
    });
    hasLoadedInitial.current = false;
    isLoadingRef.current = false;
  }, []);

  return {
    ...state,
    loadInitialMessages,
    loadMoreMessages,
    addNewMessage,
    updateMessage,
    removeMessage,
    reset,
  };
}

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
}

interface UsePaginatedMessagesReturn extends PaginatedMessagesState {
  loadInitialMessages: () => Promise<void>;
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
  });

  // Track if we've loaded initial messages to prevent duplicate calls
  const hasLoadedInitial = useRef(false);
  const isLoadingRef = useRef(false);

  const loadInitialMessages = useCallback(async () => {
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

      // Sort messages chronologically (oldest first for proper chat order)
      const sortedMessages = response.messages.sort((a, b) => 
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );

      setState(prev => ({
        ...prev,
        messages: sortedMessages,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
        unreadCount: response.unread_count,
        totalCount: response.total_count,
        loading: false,
        error: null,
      }));

      hasLoadedInitial.current = true;
      console.log('[usePaginatedMessages] ✅ Initial messages loaded successfully');

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
  }, [chatroomId]);

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

      // Sort new messages chronologically
      const sortedNewMessages = response.messages.sort((a, b) => 
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );

      setState(prev => ({
        ...prev,
        // Prepend older messages to the beginning of the array
        messages: [...sortedNewMessages, ...prev.messages],
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
      messages: [...prev.messages, message],
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

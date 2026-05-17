import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../../store/useChatStore';

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      activeConversation: null,
      messages: [],
      onlineUsers: new Set(),
    });
  });

  it('conversations are empty initially', () => {
    expect(useChatStore.getState().conversations).toEqual([]);
  });

  it('setConversations updates the list', () => {
    const convs = [{ _id: 'c1' }, { _id: 'c2' }];
    useChatStore.getState().setConversations(convs);
    expect(useChatStore.getState().conversations).toEqual(convs);
  });

  it('setActiveConversation sets active', () => {
    const conv = { _id: 'c1', name: 'Test' };
    useChatStore.getState().setActiveConversation(conv);
    expect(useChatStore.getState().activeConversation).toEqual(conv);
  });

  it('addMessage appends to messages if active conversation matches', () => {
    const conv = { _id: 'c1' };
    useChatStore.getState().setActiveConversation(conv);
    useChatStore.getState().setConversations([conv]);

    const msg = { _id: 'm1', conversationId: 'c1', content: 'Hi' };
    useChatStore.getState().addMessage(msg);

    expect(useChatStore.getState().messages).toEqual([msg]);
  });

  it('addMessage does NOT append if active conversation does not match', () => {
    const conv = { _id: 'c2' };
    useChatStore.getState().setActiveConversation(conv);
    useChatStore.getState().setConversations([conv]);

    const msg = { _id: 'm1', conversationId: 'c1', content: 'Hi' };
    useChatStore.getState().addMessage(msg);

    expect(useChatStore.getState().messages).toEqual([]);
  });

  it('addMessage updates lastMessage on the conversation', () => {
    const conv = { _id: 'c1', lastMessage: null };
    useChatStore.getState().setConversations([conv]);
    useChatStore.getState().setActiveConversation(conv);

    const msg = { _id: 'm1', conversationId: 'c1', content: 'New' };
    useChatStore.getState().addMessage(msg);

    expect(useChatStore.getState().conversations[0].lastMessage).toEqual(msg);
  });

  it('updateMessage replaces an existing message', () => {
    useChatStore.setState({ messages: [{ _id: 'm1', content: 'Old' }] });

    useChatStore.getState().updateMessage({ _id: 'm1', content: 'Updated' });
    expect(useChatStore.getState().messages[0].content).toBe('Updated');
  });

  it('removeMessage filters out a message', () => {
    useChatStore.setState({ messages: [{ _id: 'm1' }, { _id: 'm2' }] });

    useChatStore.getState().removeMessage('m1');
    expect(useChatStore.getState().messages).toEqual([{ _id: 'm2' }]);
  });

  it('addOnlineUser adds a user to the set', () => {
    useChatStore.getState().addOnlineUser('u1');
    expect(useChatStore.getState().onlineUsers.has('u1')).toBe(true);
  });

  it('removeOnlineUser removes a user from the set', () => {
    useChatStore.getState().addOnlineUser('u1');
    useChatStore.getState().removeOnlineUser('u1');
    expect(useChatStore.getState().onlineUsers.has('u1')).toBe(false);
  });

  it('setOnlineUsers replaces the entire set', () => {
    useChatStore.getState().setOnlineUsers(['u1', 'u2', 'u3']);
    const online = useChatStore.getState().onlineUsers;
    expect(online.size).toBe(3);
    expect(online.has('u1')).toBe(true);
    expect(online.has('u2')).toBe(true);
    expect(online.has('u3')).toBe(true);
  });
});

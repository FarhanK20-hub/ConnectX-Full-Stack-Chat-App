const { sendMessage, deleteMessage, reactToMessage, getMessages } = require('../../controllers/messageController');
const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');

jest.mock('../../models/Message');
jest.mock('../../models/Conversation');

describe('Message Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { _id: 'user1' },
      body: {},
      params: {},
      query: {},
      io: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should create a message and return it via res.json', async () => {
      req.body = { conversationId: 'conv1', content: 'Hello', type: 'text' };

      const mockMessage = {
        _id: 'msg1',
        sender: 'user1',
        content: 'Hello',
        conversationId: 'conv1',
        populate: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
      };
      Message.create.mockResolvedValue(mockMessage);
      Conversation.findByIdAndUpdate.mockResolvedValue({});

      await sendMessage(req, res, next);

      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        sender: 'user1',
        conversationId: 'conv1',
        content: 'Hello',
      }));
      expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith('conv1', { lastMessage: 'msg1' });
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 400 if content is missing', async () => {
      req.body = { conversationId: 'conv1' }; // no content

      await sendMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 400 if conversationId is missing', async () => {
      req.body = { content: 'Hello' }; // no conversationId

      await sendMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteMessage', () => {
    it('should return 404 if message does not exist', async () => {
      req.params = { id: 'msg1' };
      Message.findById.mockResolvedValue(null);

      await deleteMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 403 if deleting another users message', async () => {
      req.params = { id: 'msg1' };
      const mockMessage = { sender: { toString: () => 'user2' } };
      Message.findById.mockResolvedValue(mockMessage);

      await deleteMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should soft-delete own message', async () => {
      req.params = { id: 'msg1' };
      req.user = { _id: { toString: () => 'user1' } };
      const mockMessage = {
        sender: { toString: () => 'user1' },
        conversationId: { toString: () => 'conv1' },
        isDeleted: false,
        content: 'hello',
        save: jest.fn().mockResolvedValue(true),
      };
      Message.findById.mockResolvedValue(mockMessage);

      await deleteMessage(req, res, next);

      expect(mockMessage.isDeleted).toBe(true);
      expect(mockMessage.content).toBe('Message deleted');
      expect(mockMessage.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('reactToMessage', () => {
    it('should add a new reaction to a message', async () => {
      req.params = { id: 'msg1' };
      req.body = { emoji: '👍' };
      req.user = { _id: { toString: () => 'user1' } };
      const mockMessage = {
        _id: 'msg1',
        conversationId: { toString: () => 'conv1' },
        reactions: [],
        save: jest.fn().mockResolvedValue(true),
      };
      Message.findById.mockResolvedValue(mockMessage);

      await reactToMessage(req, res, next);

      expect(mockMessage.reactions.length).toBe(1);
      expect(mockMessage.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should toggle off reaction if same emoji sent again', async () => {
      req.params = { id: 'msg1' };
      req.body = { emoji: '👍' };
      req.user = { _id: { toString: () => 'user1' } };
      const mockMessage = {
        _id: 'msg1',
        conversationId: { toString: () => 'conv1' },
        reactions: [{ userId: { toString: () => 'user1' }, emoji: '👍' }],
        save: jest.fn().mockResolvedValue(true),
      };
      Message.findById.mockResolvedValue(mockMessage);

      await reactToMessage(req, res, next);

      expect(mockMessage.reactions.length).toBe(0);
      expect(mockMessage.save).toHaveBeenCalled();
    });

    it('should return 404 if message not found', async () => {
      req.params = { id: 'msg1' };
      req.body = { emoji: '👍' };
      Message.findById.mockResolvedValue(null);

      await reactToMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages for a conversation', async () => {
      req.params = { conversationId: 'conv1' };
      req.query = { limit: '20' };
      const mockMessages = [{ _id: 'msg1', createdAt: 2 }, { _id: 'msg2', createdAt: 1 }];

      Message.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockMessages)
            })
          }),
        }),
      });

      await getMessages(req, res, next);

      expect(Message.find).toHaveBeenCalledWith({ conversationId: 'conv1' });
      expect(res.json).toHaveBeenCalledWith({
        messages: mockMessages.sort((a, b) => a.createdAt - b.createdAt),
        nextCursor: 'msg2', // oldest message initially
        hasMore: false,
      });
    });
  });
});

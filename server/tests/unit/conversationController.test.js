const { createConversation, getConversations, updateGroup, leaveGroup } = require('../../controllers/conversationController');
const Conversation = require('../../models/Conversation');

jest.mock('../../models/Conversation');

describe('Conversation Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { _id: { toString: () => 'user1' } },
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createConversation - DM', () => {
    it('should return 400 if no members provided', async () => {
      req.body = { isGroup: false, members: [] };

      await createConversation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return existing DM if one already exists', async () => {
      req.body = { isGroup: false, members: ['user2'] };

      const existingConv = { _id: 'conv1', isGroup: false };
      Conversation.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([existingConv]),
        }),
      });

      await createConversation(req, res, next);

      expect(res.json).toHaveBeenCalledWith(existingConv);
    });

    it('should create a new DM if none exists', async () => {
      req.body = { isGroup: false, members: ['user2'] };

      // No existing conversation
      Conversation.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      });

      const newConv = { _id: 'conv2' };
      Conversation.create.mockResolvedValue(newConv);
      Conversation.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(newConv),
      });

      await createConversation(req, res, next);

      expect(Conversation.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newConv);
    });
  });

  describe('createConversation - Group', () => {
    it('should create a group with name and set creator as admin', async () => {
      req.body = { isGroup: true, members: ['user2', 'user3'], name: 'My Group' };

      const newGroup = { _id: 'group1' };
      Conversation.create.mockResolvedValue(newGroup);
      Conversation.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(newGroup),
        }),
      });

      await createConversation(req, res, next);

      expect(Conversation.create).toHaveBeenCalledWith(expect.objectContaining({
        isGroup: true,
        name: 'My Group',
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateGroup', () => {
    it('should update group name', async () => {
      req.params = { id: 'group1' };
      req.body = { name: 'New Name' };

      const updated = { _id: 'group1', name: 'New Name' };
      Conversation.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updated),
        }),
      });

      await updateGroup(req, res, next);

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('should return 404 if conversation not found', async () => {
      req.params = { id: 'group1' };
      req.body = { name: 'New Name' };

      Conversation.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await updateGroup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('leaveGroup', () => {
    it('should remove user from members via $pull', async () => {
      req.params = { id: 'group1' };
      req.user = { _id: 'user1' };

      const group = {
        _id: 'group1',
        isGroup: true,
        members: ['user1', 'user2', 'user3'],
        includes: function (id) { return this.members.includes(id); },
      };
      Conversation.findById.mockResolvedValue(group);

      // leaveGroup uses Conversation.findByIdAndUpdate with $pull
      const updatedGroup = { _id: 'group1', members: ['user2', 'user3'] };
      Conversation.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedGroup),
        }),
      });

      // Mock members.includes for the isMember check
      group.members.includes = jest.fn().mockReturnValue(true);

      await leaveGroup(req, res, next);

      expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith(
        'group1',
        { $pull: { members: 'user1' } },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedGroup);
    });

    it('should return 404 if conversation not found', async () => {
      req.params = { id: 'group1' };
      Conversation.findById.mockResolvedValue(null);

      await leaveGroup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 400 if trying to leave a 1-on-1 conversation', async () => {
      req.params = { id: 'dm1' };
      const dm = { _id: 'dm1', isGroup: false };
      Conversation.findById.mockResolvedValue(dm);

      await leaveGroup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getConversations', () => {
    it('should return conversations for the user', async () => {
      const mockConvs = [{ _id: 'c1' }, { _id: 'c2' }];
      Conversation.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockConvs),
            }),
          }),
        }),
      });

      await getConversations(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockConvs);
    });
  });
});

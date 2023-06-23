import express from 'express';
import { Room, Message, MessageSeen } from '../utils/collection';
import { authentication } from './middlewares/authentication';
/* GET users listing. */
import { ObjectId } from 'bson';
const router = express.Router();

router.get('/:id', authentication, async (req, res) => {
  const { id } = req.params;
  try {
    const messages = await Message.find({ roomId: id });
    res.status(200).json({ messages });
  } catch {
    res.status(500);
  }
});

router.patch('/', authentication, async (req, res) => {
  const { roomId, receiverId } = req.body;
  if (!(receiverId && roomId)) {
    return res.status(400).json({ message: 'missing required fields' });
  }
  try {
    const updatedMessage = await Message.updateMany(
      { roomId, senderId: receiverId, status: { $ne: 'seen' } },
      { $set: { status: 'seen' } }
    );
    res.status(200).json({ updatedMessage });
  } catch (error) {
    res.status(500);
  }
});

router.patch('/:id', authentication, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedMessage = await Message.updateOne(
      { _id: ObjectId(id) },
      { $set: { status: 'seen' } }
    );
    res.status(200).json({ updatedMessage });
  } catch (error) {
    res.status(500);
  }
});

router.post('/', authentication, async (req, res) => {
  const { message, senderId, senderName, roomId, createdOn } = req.body;
  if (!(message && senderId && senderName && roomId && createdOn)) {
    return res.status(400).json({ message: 'missing required fields' });
  }
  try {
    const lastMessage = await Message.findOne(
      { isLastMessage: true, roomId },
      { _id: 1 }
    );
    if (lastMessage) {
      await Message.updateOne(
        { _id: lastMessage._id },
        { $set: { isLastMessage: false } }
      );
    }

    const messageObject = await Message.insertMany([
      {
        message,
        senderId,
        senderName,
        roomId,
        createdOn,
        isLastMessage: true,
        status: 'delivered',
      },
    ]);
    const messageInfo = [];
    const currentRoomMembers = await Room.findOne(
      { _id: ObjectId(roomId) },
      { users: 1, isGroup: 1 }
    );
    if (
      currentRoomMembers &&
      currentRoomMembers.isGroup &&
      currentRoomMembers.users &&
      currentRoomMembers.users.length
    ) {
      currentRoomMembers.users.forEach((userId) => {
        if (userId != senderId) {
          messageInfo.push({
            messageId: messageObject[0]._id.toString(),
            receiverId: userId,
            roomId: currentRoomMembers._id.toString(),
            seen: false,
          });
        }
      });
      if (messageInfo.length) {
        await MessageSeen.insertMany(messageInfo);
      }
    }
    return res.status(200).json({ message: messageObject[0] });
  } catch (error) {
    res.status(500);
  }
});

module.exports = router;

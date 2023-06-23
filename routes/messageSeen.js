import express from 'express';
import { MessageSeen } from '../utils/collection';
import { authentication } from './middlewares/authentication';
import { ObjectId } from 'mongoose';
/* GET users listing. */
const router = express.Router();

router.get('/', function (req, res) {
  res.status('respond with a resource');
});

router.patch('/', authentication, async (req, res) => {
  const { roomId, receiverId } = req.body;
  if (!(receiverId && roomId)) {
    return res.status(400).json({ message: 'missing required fields' });
  }
  try {
    const updatedMessage = await MessageSeen.updateMany(
      { roomId: ObjectId(roomId), receiverId, seen: { $ne: true } },
      { $set: { seen: true } }
    );
    res.status(200).json({ updatedMessage });
  } catch (error) {
    res.status(500);
  }
});

router.patch('/:id', authentication, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedMessage = await MessageSeen.updateOne(
      { messageId: ObjectId(id) },
      { $set: { seen: true } }
    );
    res.status(200).json({ updatedMessage });
  } catch (error) {
    res.status(500);
  }
});

router.post('/', authentication, async (req, res) => {
  const { receiverId, roomId } = req.body;
  if (!(receiverId && roomId)) {
    return res.status(400).json({ message: 'missing required fields' });
  }
  try {
    let messageInfoIds = await MessageSeen.find(
      { roomId, receiverId, seen: false },
      { _id: 1 }
    );
    messageInfoIds = messageInfoIds.map((messageInfoId) => messageInfoId._id);
    await MessageSeen.updateMany(
      { _id: { $in: messageInfoIds } },
      { $set: { seen: true } }
    );
    return res.status(200).json({ message: 'Message sent !' });
  } catch (error) {
    res.status(500);
  }
});

module.exports = router;

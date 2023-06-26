import express from 'express';
import bcrypt from 'bcrypt';
import { User, Room, Message, MessageSeen } from '../utils/collection';
import jwt from 'jsonwebtoken';
import { authentication } from './middlewares/authentication';
/* GET users listing. */
import { ObjectId } from 'bson';
import _ from 'underscore';
import moment from 'moment-timezone';
const router = express.Router();

router.get('/', function (req, res, next) {
  res.status('respond with a resource');
});

router.get('/:id', authentication, async (req, res) => {
  try {
    const { id } = req.params;
    const rooms = await Room.find({ users: id });
    const newRoomsObject = [];
    for (let i = 0; i < rooms.length; i += 1) {
      const temp = await Message.findOne({
        roomId: rooms[i]._id.toString(),
        isLastMessage: true,
      });
      if (temp) {
        temp.message =
          temp.message.length > 30
            ? temp.message.substring(0, 36) + '...'
            : temp.message;
      }
      let notSeenCount = 0;
      let receiverName = 'Amir';
      let photoUrl = rooms[i].photoUrl;
      if (rooms[i].isGroup) {
        notSeenCount = await MessageSeen.find({
          roomId: rooms[i]._id.toString(),
          receiverId: id,
          seen: false,
        }).count();
      } else {
        notSeenCount = await Message.find({
          roomId: rooms[i]._id.toString(),
          senderId: { $ne: id },
          status: { $ne: 'seen' },
        }).count();
        const currUserId =
          rooms[i].users[0] === id ? rooms[i].users[1] : rooms[i].users[0];
        ({ photoUrl } = await User.findOne(
          { _id: ObjectId(currUserId) },
          { photoUrl: 1 }
        ));
        const receiverId =
          rooms[i].users[0] === id ? rooms[i].users[1] : rooms[i].users[0];
        const receiver = await User.findOne({ _id: ObjectId(receiverId) });
        receiverName = receiver.name;
      }
      const obj = {
        _id: rooms[i]._id,
        name: rooms[i].name,
        photoUrl,
        createdOn: rooms[i].createdOn,
        admins: rooms[i].admins,
        users: rooms[i].users,
        lastMessage: temp || {},
        isGroup: rooms[i].isGroup,
        notSeenCount,
        receiverName,
      };
      newRoomsObject.push(obj);
      rooms[i].lastMessage = temp || {};
    }

    newRoomsObject.sort((a, b) => {
      return moment(a.lastMessage.createdOn).isBefore(
        moment(b.lastMessage.createdOn)
      );
    });
    return res.status(201).json({ rooms: newRoomsObject || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error finding any room.' });
  }
});

router.post('/:id/add-user', authentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { userIdToAdd } = req.body;
    const userToAddExists = await User.findOne({ mobile: userIdToAdd });
    if (!userToAddExists) {
      return res.status(404).json({ message: 'User not found' });
    }
    const rooms = await Room.updateOne(
      { _id: ObjectId(id) },
      {
        $addToSet: {
          users: userToAddExists._id.toString(),
        },
      }
    );
    return res.status(201).json({ rooms: rooms || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error finding any room.' });
  }
});

router.post('/:id/remove-user', authentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { userIdToRemove } = req.body;
    const rooms = await Room.updateOne(
      { _id: ObjectId(id) },
      {
        $pull: {
          users: userIdToRemove,
        },
      }
    );
    return res.status(201).json({ rooms: rooms || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error finding any room.' });
  }
});

router.post('/:id/make-admin', authentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { userIdToMakeAdmin } = req.body;
    const rooms = await Room.updateOne(
      { _id: ObjectId(id) },
      {
        $addToSet: {
          admins: userIdToMakeAdmin,
        },
      }
    );
    return res.status(201).json({ rooms: rooms || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error finding any room.' });
  }
});

router.post('/:id/remove-admin', authentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { userIdToRemove } = req.body;
    const rooms = await Room.updateOne(
      { _id: ObjectId(id) },
      {
        $pull: {
          admins: userIdToRemove,
        },
      }
    );
    return res.status(201).json({ rooms: rooms || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error finding any room.' });
  }
});

router.post('/', authentication, async (req, res) => {
  const { name, photoUrl = '', isGroup, user, _id } = req.body;
  if (!(typeof isGroup !== 'undefined' && user)) {
    return res.status(400).json({ message: 'missing required fields' });
  }
  try {
    const currUser = await User.findOne({ mobile: user });
    if (!currUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!isGroup) {
      const currRoom = await Room.findOne({
        isGroup,
        users: {
          $all: [_id, currUser._id.toString()],
        },
      });
      if (currRoom) {
        return res
          .status(200)
          .json({ message: 'Room created successfully!', room: currRoom });
      }
    }

    const roomId = await Room.insertMany([
      {
        name: name || currUser.name,
        photoUrl,
        isGroup,
        createdOn: new Date(),
        admins: [req.user._id],
        users: [req.user._id, currUser._id.toString()],
      },
    ]);
    return res
      .status(200)
      .json({ message: 'Room created successfully!', room: roomId[0] });
  } catch {
    res.status(500);
  }
});

router.patch('/:id', authentication, async (req, res) => {
  const { id } = req.params;
  const { name, photoUrl } = req.body;
  if (name) {
  }
  try {
    await Room.updateOne(
      {
        _id: ObjectId(id),
      },
      {
        $set: {
          name,
          photoUrl,
        },
      }
    );
    return res.status(200).json({ message: 'Room updated successfully!' });
  } catch {
    res.status(500);
  }
});

module.exports = router;

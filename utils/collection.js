import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  password: String,
  lastSeen: String,
  verified: Boolean,
  roles: Array,
  photoUrl: String,
});

const User = mongoose.model('User', userSchema);

const roomSchema = new mongoose.Schema({
  name: String,
  photoUrl: String,
  createdOn: Date,
  admins: Array,
  users: Array,
  isGroup: Boolean,
});

const Room = mongoose.model('Room', roomSchema);

const messageSchema = new mongoose.Schema({
  message: String,
  createdOn: Date,
  senderId: Object,
  senderName: String,
  roomId: Object,
  isLastMessage: Boolean,
  status: String,
});

const messageSeenBySchema = new mongoose.Schema({
  messageId: Object,
  receiverId: Object,
  roomId: Object,
  seen: Boolean,
});

const MessageSeen = mongoose.model('MessageSeen', messageSeenBySchema);

const Message = mongoose.model('Message', messageSchema);

export { User, Room, Message, MessageSeen };

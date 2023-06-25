import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../utils/collection';
import jwt from 'jsonwebtoken';
import { authentication } from './middlewares/authentication';
import moment from 'moment-timezone';
import { ObjectId } from 'bson';
/* GET users listing. */
const router = express.Router();

router.get('/:id', authentication, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne(
      { _id: ObjectId(id) },
      { _id: 1, name: 1, mobile: 1, lastSeen: 1, photoUrl: 1 }
    );
    if (!user) {
      res.status(400).json({ message: 'User Not Found' });
      return;
    }
    res.status(200).json({ user });
  } catch {
    return res.status(500);
  }
});

router.post('/', async (req, res) => {
  try {
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      name: req.body.name,
      mobile: req.body.mobile,
      password: hashPassword,
      verified: false,
      lastSeen: moment().format(),
      photoUrl: req.body.photoUrl,
    };
    if (!(user.name && user.mobile && user.password && user.photoUrl)) {
      res.status(400).json({ message: 'Fields missing' });
      return;
    }
    if (req.body.roles) {
      user.roles = [req.body.roles];
    } else user.roles = [];
    const userWithSameEmail = await User.findOne({ mobile: user.mobile });
    if (userWithSameEmail) {
      res.status(403).json({ message: 'User already exist' });
      return;
    }
    if (!(user.name && user.mobile && user.password)) {
      throw Error('Name , mobile or password does not exist');
    }
    const insertedId = await User.insertMany([user]);
    res.status(201).json({
      insertedId: insertedId && insertedId[0]._id,
      message: 'user added successfully',
    });
  } catch (error) {
    res.status(500).status();
  }
});

router.post('/login', async (req, res) => {
  if (!(req.body.mobile && req.body.password)) {
    res.status(400).json({ message: 'missing required fields' });
    return;
  }
  const userFound = await User.findOne({ mobile: req.body.mobile });
  if (!userFound) {
    res.status(400).json({ message: 'User Not Found' });
    return;
  }
  try {
    const correctPass = await bcrypt.compare(
      req.body.password,
      userFound.password
    );
    if (correctPass) {
      const user = {
        mobile: userFound.mobile,
        roles: userFound.roles,
        _id: userFound._id,
        name: userFound.name,
      };
      const accessToken = jwt.sign(user, process.env.SECRET_TOKEN);
      res.status(201).json({ message: 'Successfully logged in', accessToken });
    } else {
      res.status(401).json({ message: 'Unauthorised' });
    }
  } catch {
    res.status(500);
  }
});

module.exports = router;

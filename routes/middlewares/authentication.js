import jwt from 'jsonwebtoken';

const authentication = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'No Access' });
      return;
    }
    req.user = user;
    next();
  });
};

export { authentication };

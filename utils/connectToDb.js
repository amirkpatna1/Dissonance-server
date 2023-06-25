import mongoose from 'mongoose';
require('dotenv').config();

class ConnectToDB {
  connect = () => {
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
      console.log('Connected to MongoDB');
    });
  };
}
export default ConnectToDB;

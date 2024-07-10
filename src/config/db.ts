import mongoose from 'mongoose';
import logger from '../logger';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    logger.error('MONGO_URI is not defined in the environment variables');
    throw new Error('MONGO_URI is not defined in the environment variables');
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    throw error;
  }
};

export default connectDB;

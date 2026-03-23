import mongoose from 'mongoose';

export async function connectMongo(mongodbUri) {
  if (!mongodbUri) {
    // In development we allow missing URI so the scaffold can be started
    // without immediately requiring MongoDB.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production');
    }
    return;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongodbUri);

  console.log('MongoDB connected');
}


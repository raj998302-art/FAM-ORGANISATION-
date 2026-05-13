import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String },
  roles: [{ type: String }],
  user_metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String },
  ffId: { type: String },
  ign: { type: String },
  profilePicture: { type: String },
  rank: { type: String, default: 'bronze' }
}, { timestamps: true });

export const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);

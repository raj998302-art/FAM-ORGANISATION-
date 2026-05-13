import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const seedUsers = async () => {
  const EntityModel = mongoose.model('Entity');
  
  const ownerEmail = 'raj998302@gmail.com';
  let ownerUser = await User.findOne({ email: ownerEmail });
  
  if (!ownerUser) {
    ownerUser = new User({
      email: ownerEmail,
      password: 'RAJ998302', // Mongoose middleware will hash this
      full_name: 'Raj Owner',
      roles: ['owner']
    });
    await ownerUser.save();
    
    // Create profile
    await new EntityModel({ 
      type: 'UserProfile', 
      data: {
         user_id: ownerUser._id.toString(),
         user_email: ownerEmail, 
         username: 'RajOwner',
         ff_id: '',
         ign: '',
         rank: 'diamond',
         referred_by: '',
         referral_code: 'RAJOWN'
      }
    }).save();

    // Create wallet
    await new EntityModel({
      type: 'Wallet',
      data: {
         user_id: ownerUser._id.toString(),
         user_email: ownerEmail,
         balance: 99999,
         bonus_balance: 9999,
         winnings: 9999
      }
    }).save();
    
    console.log('Owner user seeded.');
  } else {
    // Make sure owner role is present
    if (!ownerUser.roles.includes('owner')) {
      ownerUser.roles.push('owner');
      await ownerUser.save();
      console.log('Owner role added to existing user.');
    }
  }
};



import mongoose from 'mongoose';
import './config.mjs';


const UserSchema = new mongoose.Schema({
  username: String,
  hash: String, 
  preferences: { type: mongoose.Schema.Types.ObjectId, ref: 'Preferences' },
  likedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  dislikedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
});



const PreferencesSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dietaryRestrictions: [String],
  dislikedIngredients: [String],
  preferredCuisines: [String],
  minimumProtien: Number
});

const User = mongoose.model('User', UserSchema);
const Preferences = mongoose.model('Preferences', PreferencesSchema);

// mongoose.connect(process.env.DSN, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.DSN, {})
    .then(() => {
        console.log('connected to database');
    })
    .catch(err => {
        console.log(err);
    });

export { User, Preferences };

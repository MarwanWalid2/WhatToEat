

import mongoose from 'mongoose';
import './config.mjs';


const UserSchema = new mongoose.Schema({
  username: String,
  hash: String, 
  preferences: { type: mongoose.Schema.Types.ObjectId, ref: 'Preferences' },
  likedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  dislikedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
});

const RecipeSchema = new mongoose.Schema({
  title: String,
  ingredients: [String],
  dietaryRestrictions: [String],
  preparationTime: Number,
  likes: Number,
  dislikes: Number
});

const PreferencesSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dietaryRestrictions: [String],
  dislikedIngredients: [String],
  preferredCuisines: [String],
  maxPreparationTime: Number
});

const User = mongoose.model('User', UserSchema);
const Recipe = mongoose.model('Recipe', RecipeSchema);
const Preferences = mongoose.model('Preferences', PreferencesSchema);

// mongoose.connect(process.env.DSN, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.DSN, {})
    .then(() => {
        console.log('connected to database');
    })
    .catch(err => {
        console.log(err);
    });

export { User, Recipe, Preferences };

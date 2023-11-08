import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import './config.mjs';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import './db.mjs';
import mongoose from 'mongoose';
import fetch from 'node-fetch';

const User = mongoose.model('User');
const Preferences = mongoose.model('Preferences');
const Recipe = mongoose.model('Recipe');

const saltRounds = 10; 

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'hmmmmm', 
  resave: true,
  saveUninitialized: true
}));


app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());



passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      // Find the user by username
      const user = await User.findOne({ username: username });

      // If user not found or password doesn't match, return false
      if (!user || !await bcrypt.compare(password, user.hash)) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }

      // Otherwise, return the user
      return done(null, user);
    } catch (error) {
      done(error);
    }
  }
));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});



app.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: false
}));

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


app.post('/signup', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const userpreferences = new Preferences({
      dietaryRestrictions: req.body.dietaryRestrictions.split(',').map(s => s.trim()), 
      dislikedIngredients: req.body.dislikedIngredients.split(',').map(s => s.trim()), 
      preferredCuisines: req.body.preferredCuisines.split(',').map(s => s.trim()), 
      maxPreparationTime: parseInt(req.body.maxPreparationTime, 10) 
    });
    

    await userpreferences.save();
    // Create a new user and save to database
    const user = new User({
      username: req.body.username,
      hash: hashedPassword,
      preferences: userpreferences, // or set a default if you have one
      likedRecipes: [],
      dislikedRecipes: []
    });


 
    // user.preferences = preferences;
    await user.save();



    // Respond to the client
    res.redirect('/profile');
  } catch (error) {
    res.render('signup', { error: 'An error occurred. Please try again.' });

  }
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'login' });
});

app.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('preferences');

    if (!user) {
      res.status(404).send('User not found');
      return;
    }

    res.render('profile', {
      title: 'Profile',
      user: user,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error populating preferences:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/', (req, res) => {
  res.render('index');
  });
  

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login'); // or your login route
  }
  





app.get('/recipes', async (req, res) => {
  try {
    const apiUrl = 'https://api.spoonacular.com/recipes/complexSearch';
    const apiKey = '4241c8d138ed4bd391cc7e2866270725'; 
    const queryParams = new URLSearchParams({
      number: 10, 
    });

    const response = await fetch(`${apiUrl}?${queryParams}&apiKey=${apiKey}`);
    if (!response.ok) throw new Error('Failed to fetch recipes');

    const data = await response.json();

    res.render('recipe', {
      title: 'Recipe Suggestions',
      recipes: data.results, 
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Error fetching recipes');
  }
});


app.listen(process.env.PORT ?? 3000);

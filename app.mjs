import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import './config.mjs';
import session from 'express-session';
import exphbs from 'express-handlebars';
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

const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: false,
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});

hbs.handlebars.registerHelper('isCuisineSelected', (preferences, cuisine) => {
  return preferences.includes(cuisine) ? 'selected' : '';
});


app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SECRET, 
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
      preferredCuisines: Array.isArray(req.body.preferredCuisines) 
                         ? req.body.preferredCuisines 
                         : req.body.preferredCuisines.split(',').map(s => s.trim()), 
      maxPreparationTime: parseInt(req.body.maxPreparationTime, 10) 
    });
    
    

    await userpreferences.save();
    // Create a new user and save to database
    const user = new User({
      username: req.body.username,
      hash: hashedPassword,
      preferences: userpreferences, 
      likedRecipes: [],
      dislikedRecipes: []
    });


 
    // user.preferences = preferences;
    await user.save();

    res.redirect('/profile');
  } catch (error) {
    console.error('Error:', error);
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
  



  app.get('/recipes', ensureAuthenticated, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).populate('preferences');
      if (!user) {
        res.status(404).send('User not found');
        return;
      }
  
      let apiUrl;
      let queryParams = new URLSearchParams({ number: 10 });
      const apiKey = process.env.API_KEY;
  
      if (req.query.ingredients) {
        // Search by ingredients
        apiUrl = 'https://api.spoonacular.com/recipes/findByIngredients';
        queryParams.append('ingredients', req.query.ingredients);
      } else {
        // Search by cuisine 
        apiUrl = 'https://api.spoonacular.com/recipes/complexSearch';
        queryParams.append('cuisine', req.query.cuisine || user.preferences.preferredCuisines.join(', '));
      }
  
      const response = await fetch(`${apiUrl}?${queryParams}&apiKey=${apiKey}`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
  
      const data = await response.json();
  
      if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        res.json(data.results || data); 
      } else {
        res.render('recipe', {
          title: 'Recipe Suggestions',
          recipes: data.results || data,
          userPreferredCuisines: user.preferences.preferredCuisines.join(', ')
        }); 
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  
app.get('/edit-preferences', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('preferences');
    if (!user) {
      res.status(404).send('User not found');
      return;
    }

    const preferences = {
      ...user.preferences.toObject(),
      dietaryRestrictions: user.preferences.dietaryRestrictions.join(', '),
      dislikedIngredients: user.preferences.dislikedIngredients.join(', '),
      preferredCuisines: user.preferences.preferredCuisines.join(', '),
    };

    res.render('edit_preferences', {
      title: 'Edit Preferences',
      user: user,
      preferences: preferences
    });
  } catch (error) {
    console.error('Error accessing preferences:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/update-preferences', ensureAuthenticated, async (req, res) => {
  try {
    const { dietaryRestrictions, dislikedIngredients, preferredCuisines, maxPreparationTime } = req.body;
    
    await Preferences.updateOne(
      { _id: req.user.preferences },
      {
        dietaryRestrictions: dietaryRestrictions.split(',').map(s => s.trim()),
        dislikedIngredients: dislikedIngredients.split(',').map(s => s.trim()),
        preferredCuisines: preferredCuisines.split(',').map(s => s.trim()),
        maxPreparationTime: parseInt(maxPreparationTime, 10)
      }
    );

    res.json({ success: true, message: "Preferences updated successfully." });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});






app.listen(process.env.PORT ?? 3000);

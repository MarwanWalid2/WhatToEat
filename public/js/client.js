
// Handler for preferences form
const preferencesForm = document.getElementById('preferences-form');
if (preferencesForm) {
    preferencesForm.addEventListener('submit', handlePreferencesFormSubmit);
}

// Handler for signup form
const signupForm = document.getElementById('signup-preferences-form');
if (signupForm) {
    signupForm.addEventListener('submit', handleSignupFormSubmit);
}

function handlePreferencesFormSubmit(event) {
  event.preventDefault();
  const formData = {
      dietaryRestrictions: document.getElementById('dietaryRestrictions').value,
      dislikedIngredients: document.getElementById('dislikedIngredients').value,
      preferredCuisines: getSelectedCuisines('preferredCuisines'),
      minimumProtien: document.getElementById('minimumProtien').value
  };

  fetch('/update-preferences', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          updatePreferencesDisplay(formData);
          showUpdateMessage("Preferences updated successfully.", true);
      } else {
          showUpdateMessage("Failed to update preferences.", false);
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showUpdateMessage("An error occurred while updating preferences.", false);
  });
}

function showUpdateMessage(message, isSuccess) {
  const messageElement = document.getElementById('update-message');
  messageElement.textContent = message;
  messageElement.style.color = isSuccess ? 'green' : 'red';
  messageElement.style.display = 'block';
}

function handleSignupFormSubmit(event) {
    const preferredCuisines = getSelectedCuisines('preferredCuisines');
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'preferredCuisines';
    hiddenInput.value = preferredCuisines;
    event.currentTarget.appendChild(hiddenInput);
}

function getSelectedCuisines(selectId) {
    return Array.from(document.getElementById(selectId).selectedOptions)
                .map(option => option.value)
                .join(', ');
}

function updatePreferencesDisplay(formData) {
    document.querySelector('li#dietaryRestrictions').textContent = `Dietary Restrictions: ${formData.dietaryRestrictions}`;
    document.querySelector('li#dislikedIngredients').textContent = `Disliked Ingredients: ${formData.dislikedIngredients}`;
    document.querySelector('li#preferredCuisines').textContent = `Preferred Cuisines: ${formData.preferredCuisines}`;
    document.querySelector('li#minimumProtien').textContent = `Minimum Protien: ${formData.minimumProtien}`;
}



// Handle the cuisine search form submission
document.getElementById('recipe-search-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const searchQuery = document.getElementById('cuisine-search').value;

  performSearch({ cuisine: searchQuery });
});

// Handle the ingredient search form submission
document.getElementById('ingredient-search-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const ingredients = document.getElementById('ingredient-search').value;

  performSearch({ ingredients: ingredients });
});

// Handle the protein search form submission
document.getElementById('protein-search-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const minProtein = document.getElementById('protein-search').value;
  performSearch({ minProtein: minProtein });
});


function performSearch(params) {
  const query = new URLSearchParams(params).toString();

  fetch(`/recipes?${query}`, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => response.json())
  .then(data => {
    updateRecipesOnPage(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function updateRecipesOnPage(recipes) {
  const recipesContainer = document.getElementById('recipes-container');
  recipesContainer.innerHTML = ''; 

  recipes.forEach(recipe => {
    const recipeElement = document.createElement('div');
    const titleElement = document.createElement('h2');
    titleElement.textContent = recipe.title;
    recipeElement.appendChild(titleElement);

    if (recipe.image) {
      const imageElement = document.createElement('img');
      imageElement.src = recipe.image;
      imageElement.alt = recipe.title;
      recipeElement.appendChild(imageElement);
    }

    // Add nutritional information, if available
    const nutritionInfo = extractNutritionInfo(recipe.nutrition);
    for (const [key, value] of Object.entries(nutritionInfo)) {
      const p = document.createElement('p');
      p.textContent = `${key}: ${value}`;
      recipeElement.appendChild(p);
    }

    recipesContainer.appendChild(recipeElement);
  });
}

function extractNutritionInfo(nutrition) {
  const requiredNutrients = ['Calories', 'Carbohydrates', 'Fat', 'Protein'];
  const nutritionInfo = {};

  if (nutrition && nutrition.nutrients) {
    requiredNutrients.forEach(nutrientName => {
      const nutrient = nutrition.nutrients.find(n => n.name === nutrientName);
      nutritionInfo[nutrientName] = nutrient ? `${nutrient.amount}${nutrient.unit}` : 'Not available';
    });
  }

  return nutritionInfo;
}

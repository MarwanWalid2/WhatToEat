
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
        maxPreparationTime: document.getElementById('maxPreparationTime').value
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
        } else {
            alert('Failed to update preferences.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
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
    document.querySelector('li#maxPreparationTime').textContent = `Max Preparation Time: ${formData.maxPreparationTime}`;
}


document.getElementById('recipe-search-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const searchQuery = document.getElementById('cuisine-search').value;

  fetch(`/recipes?cuisine=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest' // This header indicates an AJAX request
    }
  })
  .then(response => response.json())
  .then(data => {
    updateRecipesOnPage(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
});

function updateRecipesOnPage(recipes) {
  const recipesContainer = document.getElementById('recipes-container');
  recipesContainer.innerHTML = ''; // Clear current content

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

      recipesContainer.appendChild(recipeElement);
  });
}

  document.getElementById('preferences-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const dietaryRestrictionsInput = document.getElementById('dietaryRestrictions');
    const dislikedIngredientsInput = document.getElementById('dislikedIngredients');
    const preferredCuisinesInput = document.getElementById('preferredCuisines');
    const maxPreparationTimeInput = document.getElementById('maxPreparationTime');

    const formData = {
      dietaryRestrictions: dietaryRestrictionsInput.value,
      dislikedIngredients: dislikedIngredientsInput.value,
      preferredCuisines: preferredCuisinesInput.value,
      maxPreparationTime: maxPreparationTimeInput.value
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
        document.querySelector('li#dietaryRestrictions').textContent = `Dietary Restrictions: ${formData.dietaryRestrictions}`;
        document.querySelector('li#dislikedIngredients').textContent = `Disliked Ingredients: ${formData.dislikedIngredients}`;
        document.querySelector('li#preferredCuisines').textContent = `Preferred Cuisines: ${formData.preferredCuisines}`;
        document.querySelector('li#maxPreparationTime').textContent = `Max Preparation Time: ${formData.maxPreparationTime}`;
      } else {
        alert('Failed to update preferences.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  });

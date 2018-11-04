// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

//global state of the app
const state = {}; 

// SEARCH CONTROLLER
const controlSearch = async () => {
	//get query from the view
	const query = searchView.getInput();

	if(query) {
		//new search obj + add to state
		state.search = new Search(query);

		//prepare UI for results
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);
        
  try {
       	//search for recipes
		await state.search.getResults();

		//render results on UI
		  clearLoader();
      searchView.renderResults(state.search.result);
   } catch (err) {
    	alert('Something went wrong...');
    	clearLoader();
   }
		
	}    
}

elements.searchForm.addEventListener('submit', event => {
    event.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline');
    if(btn) {
    	const goToPage = parseInt(btn.dataset.goto, 10);
    	searchView.clearResults();
    	searchView.renderResults(state.search.result, goToPage);
    }
});


// RECIPE CONTROLLER
const controlRecipe = async () => {
	// get id from url
	const id = window.location.hash.replace('#', '');
    
 	if(id) {
      //  prepare UI for changes
      recipeView.clearRecipe();
      renderLoader(elements.recipe);

      //highlight selected search item
      if (state.search) searchView.highlightedSelected(id);

      // create new recipe object
      state.recipe = new Recipe(id);


      try {
      //get recipe data and parse inredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      //calc servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //render recipe
      clearLoader();
      recipeView.renderRecipe(
        state.recipe,
        state.likes.isLiked(id)
        );

      } catch(err) {
      	alert('Error processing recipe!');
      }
      
	};
};

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//LIST CONTROLLER
const controlList = () => {

	//create a new list if there's none yet
    if (!state.list) state.list = new List();

    //add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
    	const item = state.list.addItem(el.count, el.unit, el.ingredient);
    	listView.renderItem(item);

    });

} 

// handling delete and update list item events
 elements.shopping.addEventListener('click', e => {
 	const id = e.target.closest('.shopping__item').dataset.itemid;

 	//handle delete btn
 	if (e.target.matches('.shopping__delete, .shopping__delete *')) {
 		//delete from state
 		state.list.deleteItem(id);

 		//delete from UI
 		listView.deleteItem(id);

 		//handle the count update
 	} else if (e.target.matches('.shopping__count-value')) {
 		const val = parseFloat(e.target.value, 10);
 		state.list.updateCount(id, val);

 	}
 });


//LIKE CONTROLLER
const controlLike = () => {
	if (!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;
    
    // user has not yet liked current recipe
	if(!state.likes.isLiked(currentID)) {
       //add like to state
       const newLike = state.likes.addLike(
       	currentID,
       	state.recipe.title,
       	state.recipe.author,
       	state.recipe.img
       	);

       //toggle like btn
       likesView.toggleLikeBtn(true);

       //add like to UI list
       likesView.renderLike(newLike);


    // user has liked current recipe
	} else {
       //remove like from state
        state.likes.deleteLike(currentID);

       //toggle like btn
       likesView.toggleLikeBtn(false);

       //remove like from UI list
       likesView.deleteLike(currentID);
	}

  likesView.toggleLikeMenu(state.likes.getNumLikes());

};

//restore liked recipes on page load
window.addEventListener('load', () => {
   state.likes = new Likes();
   
   //restore likes
   state.likes.readStorage();
   
   //toggle like menu btn
   likesView.toggleLikeMenu(state.likes.getNumLikes());

   //render the existing likes
   state.likes.likes.forEach(like => likesView.renderLike(like));

});

// handling recipe btn clicks
elements.recipe.addEventListener('click', e => {
	if(e.target.matches('.btn-decrease, .btn-decrease *')) {
		//decrease btn is clicked
		if (state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
        
	} else if (e.target.matches('.btn-increase, .btn-increase *')) {
        //increase btn is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

	} else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //add ingredients to shopping list
        controlList();

	} else if (e.target.matches('.recipe__love, .recipe__love *')) {
		//like controller
		controlLike();
	}
});











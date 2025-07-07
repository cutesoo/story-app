import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import AddStoryPage from '../pages/story/add-story-page';
import DetailStoryPage from '../pages/story/detail-story-page';
import SavedStoriesPage from '../pages/saved-stories/saved-stories-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/add-story': new AddStoryPage(),
  '/stories/:id': new DetailStoryPage(),
  '/stories/:id': new DetailStoryPage(),
  '/saved-stories': new SavedStoriesPage(),
};

export default routes;
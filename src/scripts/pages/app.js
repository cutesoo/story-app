import routes from '../routes/routes';
import { getActiveRoute, parseActivePathname } from '../routes/url-parser';
import StoryApi from '../data/api';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #storyApi = null;
  #loginLink = null;
  #logoutLink = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#storyApi = new StoryApi();

    this._setupDrawer();
    this._setupAuthLinks();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  _setupAuthLinks() {
    this.#loginLink = document.getElementById('loginLink');
    this.#logoutLink = document.getElementById('logoutLink');

    this.#logoutLink.addEventListener('click', async (event) => {
      event.preventDefault();
      if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('authToken');
        this.#storyApi.setAuthToken(null);
        window.location.hash = '#/login';
        this._updateAuthLinksVisibility();
      }
    });

    this._updateAuthLinksVisibility();
  }

  _updateAuthLinksVisibility() {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.#loginLink.style.display = 'none';
      this.#logoutLink.style.display = 'block';
    } else {
      this.#loginLink.style.display = 'block';
      this.#logoutLink.style.display = 'none';
    }
  }

  _checkAuthStatus() {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      this.#storyApi.setAuthToken(storedToken);
    } else {
      this.#storyApi.setAuthToken(null);
    }
    this._updateAuthLinksVisibility();
  }

  async renderPage() {
    const url = getActiveRoute();
    let page = routes[url];

    this._checkAuthStatus();

    const isAuthenticated = this.#storyApi.getAuthToken();
    const protectedRoutes = ['/', '/add-story', '/stories/:id', '/saved-stories'];
    const isProtected = protectedRoutes.includes(url);

    if (isProtected && !isAuthenticated) {
      page = routes['/login'];
      window.location.hash = '#/login';
    } else if (!page) {
      if (isAuthenticated) {
        page = routes['/'];
        window.location.hash = '#/';
      } else {
        page = routes['/login'];
        window.location.hash = '#/login';
      }
    }

    const mainContent = this.#content;
    const newContent = await page.render();

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        mainContent.innerHTML = newContent;
        this._updateAuthLinksVisibility();
        if (page.afterRender) {
          await page.afterRender(this.#storyApi);
        }
      });
    } else {
      mainContent.innerHTML = newContent;
      this._updateAuthLinksVisibility();
      if (page.afterRender) {
        await page.afterRender(this.#storyApi);
      }
    }
  }
}

export default App;
import StoryApi from '../../data/api';
import { sleep } from '../../index';

class LoginPageView {
  constructor() {
    this._loginForm = null;
    this._errorMessageElement = null;
  }

  getTemplate() {
    return `
      <section class="container auth-section">
        <h1 class="auth-title">Login</h1>
        <form id="loginForm" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="current-password">
          </div>
          <p id="loginErrorMessage" class="error-message"></p>
          <button type="submit" id="loginButton">Login</button>
        </form>
        <p class="auth-link">Belum punya akun? <a href="#/register">Register di sini</a></p>
      </section>
    `;
  }

  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    this._loginForm = document.getElementById('loginForm');
    this._errorMessageElement = document.getElementById('loginErrorMessage');
  }

  getLoginData() {
    const email = this._loginForm.querySelector('#email').value;
    const password = this._loginForm.querySelector('#password').value;
    return { email, password };
  }

  setLoginClickListener(callback) {
    this._loginForm.addEventListener('submit', callback);
  }

  showLoading() {
    this._errorMessageElement.textContent = 'Memproses login...';
    this._errorMessageElement.classList.remove('error', 'success');
    this._errorMessageElement.classList.add('loading');
    document.getElementById('loginButton').disabled = true;
  }

  hideLoading() {
    this._errorMessageElement.classList.remove('loading');
    document.getElementById('loginButton').disabled = false;
  }

  showLoginSuccess(message) {
    this._errorMessageElement.textContent = message;
    this._errorMessageElement.classList.remove('error', 'loading');
    this._errorMessageElement.classList.add('success');
  }

  showLoginError(message) {
    this._errorMessageElement.textContent = message;
    this._errorMessageElement.classList.add('error');
    this._errorMessageElement.classList.remove('loading', 'success');
  }
}

class LoginPagePresenter {
  constructor(model, view) {
    this._model = model;
    this._view = view;

    this._view.setLoginClickListener(this._handleLoginSubmit.bind(this));
  }

  async _handleLoginSubmit(event) {
    event.preventDefault();
    this._view.showLoading();

    const { email, password } = this._view.getLoginData();

    try {
      const response = await this._model.login({ email, password });
      localStorage.setItem('authToken', response.loginResult.token);
      this._model.setAuthToken(response.loginResult.token);
      this._view.showLoginSuccess('Login berhasil! Mengarahkan ke beranda...');
      await sleep(1500);
      window.location.hash = '#/';
    } catch (error) {
      this._view.showLoginError(`Login gagal: ${error.message}`);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default class LoginPage {
  async render() {
    const view = new LoginPageView();
    return await view.render();
  }

  async afterRender(storyApiInstance) {
    const view = new LoginPageView();
    await view.afterRender();
    new LoginPagePresenter(storyApiInstance, view);
  }
}
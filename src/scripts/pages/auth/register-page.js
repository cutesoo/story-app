import StoryApi from '../../data/api';
import { sleep } from '../../index';

class RegisterPageView {
  constructor() {
    this._registerForm = null;
    this._errorMessageElement = null;
  }

  getTemplate() {
    return `
      <section class="container auth-section">
        <h1 class="auth-title">Register</h1>
        <form id="registerForm" class="auth-form">
          <div class="form-group">
            <label for="name">Nama</label>
            <input type="text" id="name" name="name" required autocomplete="name">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="new-password">
          </div>
          <div class="form-group">
            <label for="confirmPassword">Konfirmasi Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password">
          </div>
          <p id="registerErrorMessage" class="error-message"></p>
          <button type="submit" id="registerButton">Register</button>
        </form>
        <p class="auth-link">Sudah punya akun? <a href="#/login">Login di sini</a></p>
      </section>
    `;
  }

  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    this._registerForm = document.getElementById('registerForm');
    this._errorMessageElement = document.getElementById('registerErrorMessage');
  }

  getRegisterData() {
    const name = this._registerForm.querySelector('#name').value;
    const email = this._registerForm.querySelector('#email').value;
    const password = this._registerForm.querySelector('#password').value;
    const confirmPassword = this._registerForm.querySelector('#confirmPassword').value;
    return { name, email, password, confirmPassword };
  }

  setRegisterClickListener(callback) {
    this._registerForm.addEventListener('submit', callback);
  }

  showLoading() {
    this._errorMessageElement.textContent = 'Memproses registrasi...';
    this._errorMessageElement.classList.remove('error', 'success');
    this._errorMessageElement.classList.add('loading');
    document.getElementById('registerButton').disabled = true;
  }

  hideLoading() {
    this._errorMessageElement.classList.remove('loading');
    document.getElementById('registerButton').disabled = false;
  }

  showRegisterSuccess(message) {
    this._errorMessageElement.textContent = message;
    this._errorMessageElement.classList.remove('error', 'loading');
    this._errorMessageElement.classList.add('success');
  }

  showRegisterError(message) {
    this._errorMessageElement.textContent = message;
    this._errorMessageElement.classList.add('error');
    this._errorMessageElement.classList.remove('loading', 'success');
  }
}

class RegisterPagePresenter {
  constructor(model, view) {
    this._model = model;
    this._view = view;

    this._view.setRegisterClickListener(this._handleRegisterSubmit.bind(this));
  }

  async _handleRegisterSubmit(event) {
    event.preventDefault();
    this._view.showLoading();

    const { name, email, password, confirmPassword } = this._view.getRegisterData();

    if (password !== confirmPassword) {
      this._view.showRegisterError('Password dan konfirmasi password tidak cocok.');
      this._view.hideLoading();
      return;
    }

    if (password.length < 8) {
      this._view.showRegisterError('Password minimal 8 karakter.');
      this._view.hideLoading();
      return;
    }

    try {
      const response = await this._model.register({ name, email, password });
      this._view.showRegisterSuccess('Registrasi berhasil! Silakan login.');
      await sleep(1500);
      window.location.hash = '#/login';
    } catch (error) {
      this._view.showRegisterError(`Registrasi gagal: ${error.message}`);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default class RegisterPage {
  async render() {
    const view = new RegisterPageView();
    return await view.render();
  }

  async afterRender(storyApiInstance) {
    const view = new RegisterPageView();
    await view.afterRender();
    new RegisterPagePresenter(storyApiInstance, view);
  }
}
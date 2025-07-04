export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1>About Page</h1>
        <p>Aplikasi berbagi cerita ini dibuat sebagai bagian dari submission kelas Web Developer Expert Dicoding.</p>
        <p>Nikmati berbagi momen dan kisah Anda dengan mudah!</p>
      </section>
    `;
  }

  async afterRender(storyApiInstance) {
  }
}
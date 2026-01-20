export class LoginPage {
  constructor(page) {
    this.page = page;

    this.signInButton = page.getByRole('button', { name: 'Sign In', exact: true });
    this.emailInput = page.getByRole('textbox', { name: 'Enter email address' });
    this.passwordInput = page.getByRole('textbox', { name: 'Enter password' });

    this.emailRequiredMsg = page.getByText('Please enter email');
    this.passwordRequiredMsg = page.getByText('Please enter password');
    this.invalidCredentialMsg = page.getByText('Invalid credentials, Please');
    this.invalidEmailMsg = page.getByText('Please enter valid email123');
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async login(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }
}

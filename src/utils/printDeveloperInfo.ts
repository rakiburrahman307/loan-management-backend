import chalk from 'chalk';

// --- FUNCTION: Print developer information ---
export function printDeveloperInfo(): void {
     // Developer info header
     console.log(chalk.bgGreenBright.black.bold(' 👨‍💻 Backend Developer Information '));

     // Motivational message
     console.log(chalk.hex('#00FFFF').bold('✨ Keep Calm and Code On! ✨'));

     // Contact details with emojis
     console.log(chalk.hex('#00FFFF').bold('👤 Name: ') + chalk.white.bold('Md. Rakibur Rahman')); // Changed emoji to 👤
     console.log(
          chalk.hex('#00FFFF').bold('✉️  Email: ') +
               chalk.white.bold('rakiburrahman.dev@gmail.com'),
     );
     console.log(
          chalk.hex('#00FFFF').bold('🚀 GitHub: ') +
               chalk.white.bold('https://github.com/rakiburrahman307'),
     );
}

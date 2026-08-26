import chalk from 'chalk';
// --- FUNCTION: Print version information ---
export function printVersionInfo(): void {
     // Add a box for Version Info
     console.log(chalk.bgCyan.white.bold('╔══════════════════════════════════════╗'));
     console.log(chalk.bgCyan.white.bold('║        VERSION INFO                  ║'));
     console.log(chalk.bgCyan.white.bold('╚══════════════════════════════════════╝'));

     // Print actual version details with colors and effects
     console.log(chalk.hex('#FF6347').bold('Version: ') + chalk.hex('#FF4500').underline('1.0'));
     console.log(chalk.hex('#32CD32').italic('Node.js: ') + chalk.hex('#FF69B4').bold('v22.17.1'));
     console.log(chalk.hex('#8A2BE2').bold('OS: ') + chalk.hex('#ADFF2F').italic('Ubuntu'));
}

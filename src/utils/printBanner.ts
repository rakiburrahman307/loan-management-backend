import * as figlet from 'figlet';
import chalk from 'chalk';
import { printVersionInfo } from './versionInfo';
import { printDeveloperInfo } from './printDeveloperInfo';
import { printFooter } from './printFooter';

// --- FUNCTION: Print banner title ---
export function printBanner(title: string): void {
     figlet.text(title, (err, data) => {
          if (err) {
               console.log(chalk.bgRed.white.bold(' 🔥 Something went wrong... 🔥 '));
               console.dir(err);
               return;
          }
          // Print title in bold with Tomato color
          console.log(chalk.hex('#ff6347').bold(data)); // Tomato color for the title

          // Call other functions to print version info and developer info
          printVersionInfo();
          printDeveloperInfo();
          printFooter();
     });
}

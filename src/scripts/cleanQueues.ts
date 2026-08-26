import colors from 'colors';
import readline from 'readline';
import { cleanAllCompletedJobs, cleanAllFailedJobs } from '../helpers/bullMQ/cleanUpUtility/utils';

const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout,
});

function question(query: string): Promise<string> {
     return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
     console.log(colors.bgYellow.black('\n🧹 Queue Cleanup Utility\n'));

     try {
          const answer = await question(
               'Clean completed jobs older than how many hours? (default: 24): ',
          );
          const hoursCompleted = parseInt(answer) || 24;

          const answer2 = await question(
               'Clean failed jobs older than how many days? (default: 7): ',
          );
          const daysFailed = parseInt(answer2) || 7;

          console.log(
               colors.yellow(`\nCleaning completed jobs older than ${hoursCompleted} hours...`),
          );
          const completed = await cleanAllCompletedJobs(hoursCompleted);

          console.log(colors.yellow(`Cleaning failed jobs older than ${daysFailed} days...`));
          const failed = await cleanAllFailedJobs(daysFailed);

          console.log(colors.bgGreen.black('\n✅ Cleanup Complete\n'));

          Object.entries(completed).forEach(([queue, count]) => {
               console.log(colors.green(`   ${queue}: ${count} completed jobs cleaned`));
          });

          Object.entries(failed).forEach(([queue, count]) => {
               console.log(colors.green(`   ${queue}: ${count} failed jobs cleaned`));
          });

          console.log('\n');
          rl.close();
          process.exit(0);
     } catch (error) {
          console.error(colors.red('Cleanup failed:'), error);
          rl.close();
          process.exit(1);
     }
}

main();

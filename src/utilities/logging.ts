import chalk from 'chalk';

export default class Logging {
    public static log = (args: any) => this.info(args);
    public static info = (args: any) => console.log(chalk.blue(`[${new Date().toLocaleString()}] [INFO]`), typeof args === 'string' ? chalk.blueBright(args) : args);
    public static warning = (args: any) => console.log(chalk.yellow(`[${new Date().toLocaleString()}] [WARN]`), typeof args === 'string' ? chalk.yellowBright(args) : args);
    public static error = (args: any) => console.log(chalk.red(`[${new Date().toLocaleString()}] [ERROR]`), typeof args === 'string' ? chalk.redBright(args) : args);
    public static success = (args: any) => console.log(chalk.green(`[${new Date().toLocaleString()}] [SUCCESS]`), typeof args === 'string' ? chalk.greenBright(args) : args);
    public static debug = (args: any) => console.log(chalk.magenta(`[${new Date().toLocaleString()}] [DEBUG]`), typeof args === 'string' ? chalk.magentaBright(args) : args);
    public static verbose = (args: any) => console.log(chalk.cyan(`[${new Date().toLocaleString()}] [VERBOSE]`), typeof args === 'string' ? chalk.cyanBright(args) : args);
}

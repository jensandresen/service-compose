const Command = require("./command.js");
const path = require("path");

class Runner {

    constructor(runner) {
        this.runner = runner;
    }

    run(component, options = {}) {
        const cmd = this.prepareCommandFor(component);
        const args = this.prepareArgumentsFor(component);
        const env = this.prepareEnvironmentVariablesFor(component);

        let delay = this.runner.delay || 0;
        if (options.ignoreDelay) {
            delay = 0;
        }

        const command = new Command(component.label, component.color, cmd, args, env);

        if (delay > 0) {
            command.print(`Start is delayed ${delay} msec.`);
            setTimeout(() => command.execute(), delay);
        } else {
            command.execute();
        }
    }

    runAsync(component, options = {}) {
        const cmd = this.prepareCommandFor(component);
        const args = this.prepareArgumentsFor(component);
        const env = this.prepareEnvironmentVariablesFor(component);

        let delay = this.runner.delay || 0;
        if (options.ignoreDelay) {
            delay = 0;
        }

        const command = new Command(component.label, component.color, cmd, args, env);

        if (delay > 0) {
            return new Promise(resolve => {
                command.print(`Start is delayed ${delay} msec.`);
                setTimeout(() => {
                    command.execute();
                    resolve();
                }, delay);    
            });
        }
        
        return new Promise(resolve => {
            command.execute();
            resolve();
        });
    }

    extractPlaceholdersFrom(component) {
        const list = new Array();
        for (let key in component.app) {
            if (component.app.hasOwnProperty(key)) {
                list.push({
                    token: `<${key}>`,
                    value: component.app[key]
                });
            }
        }
        return list;
    }

    prepareCommandFor(component) {
        const placeholders = this.extractPlaceholdersFrom(component);
        let cmd = this.runner.cmd;

        placeholders.forEach(ph => {
            cmd = cmd.replace(ph.token, ph.value);
        });

        return cmd;        
    }

    prepareArgumentsFor(component) {
        const placeholders = this.extractPlaceholdersFrom(component);

        let args = this.runner.args.map(x => {
            let arg = x;
            placeholders.forEach(ph => {
                arg = arg.replace(ph.token, ph.value);
            });
            return arg;
        });
    
        args = args.map(arg => {
            const match = arg.match(/MakeAbsolute\((.*?)\)/);
            
            if (match && match.length > 0) {
                const fullPath = path.resolve(match[1]);
                return arg.replace(/MakeAbsolute\((.*?)\)/, fullPath);
            }
                    
            return arg;        
        });

        return args;        
    }

    prepareEnvironmentVariablesFor(component) {
        const env = process.env;
        for (let key in component.environment) {
            if (component.environment.hasOwnProperty(key)) {
                const value = component.environment[key];
                env[key] = value;
            }
        }
        return env;
    }
}

module.exports = Runner;
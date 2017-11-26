const chalk = require("chalk");
const { spawn } = require("child_process");

class Command {
    constructor(label, color, cmd, args, env) {
        this.label = label;
        this.color = color;
        this.cmd = cmd;
        this.args = args || [];
        this.env = env;
    }

    execute() {
        this.print("=".repeat(60));
        this.print(`EXEC: ${this.cmd} ${this.args.join(" ")}`);
    
        const subprocess = spawn(this.cmd, this.args, { env: this.env });
        
        const self = this;

        subprocess.stdout.on("data", data => {
            const line = data
                .toString("utf8")
                .replace('\n', '')
                .replace('\r', '');
    
            self.print(line);
        });
    
        subprocess.stderr.on("data", data => {
            const line = data
                .toString("utf8")
                .replace('\n', '')
                .replace('\r', '');
    
            self.print(line);
        });            
    }

    print(text) {
        const color = this.color;
        const line = `[${this.label}] ${text}`;
    
        const msg = chalk.keyword(this.color)(line);
        console.log(msg);    
    }        
}

module.exports = Command;
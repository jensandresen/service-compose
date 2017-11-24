const {spawn} = require("child_process");
const {setTimeout} = require("timers");
const path = require("path");
const yamlFile = require("yamlfile");
const padright = require("pad-right");
const chalk = require("chalk");

const composeFileName = "./service-compose.yaml";
const data = yamlFile.readFileSync(composeFileName);

function convertToArray(obj) {
    const result = new Array();
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const c = obj[key];
            c.id = key;
            result.push(c);
        }
    }
    return result;
}

function runComponent(component, runner, delay) {
    const delayDuration = delay || 0;
    
    if (delayDuration > 0) {
        setTimeout(() => runComponent(component, runner), delayDuration);
    } else {
        runComponent(component, runner);
    }        
}

function runComponent(component, runner) {
    
    let cmd = runner.cmd;
    
    for (let key in component.app) {
        if (component.app.hasOwnProperty(key)) {
            const token = `<${key}>`;
            const value = component.app[key];
            cmd = cmd.replace(token, value);    
        }
    }

    let args = runner.args.map(x => {
        let arg = x;
        for (let key in component.app) {
            if (component.app.hasOwnProperty(key)) {
                const token = `<${key}>`;
                const value = component.app[key];
                arg = arg.replace(token, value);    
            }
        }
        return arg;
    });

    args = args.map(x => {
        let arg = x;
        
        const match = arg.match(/MakeAbsolute\((.*?)\)/);
        
        if (match && match.length > 0) {
            const fullPath = path.resolve(match[1]);
            arg = arg.replace(/MakeAbsolute\((.*?)\)/, fullPath);
        }
                
        return arg;        
    });

    print(component, "=".repeat(60));
    print(component, `EXEC: ${cmd} ${args.join(" ")}`);

    const subprocess = spawn(cmd, args, {
        encoding: "utf8"
    });

    subprocess.stdout.on("data", data => {
        const line = data
            .toString("utf8")
            .replace('\n', '')
            .replace('\r', '');

        print(component, line);
    });

    subprocess.stderr.on("data", data => {
        const line = data
            .toString("utf8")
            .replace('\n', '')
            .replace('\r', '');

        print(component, line);
    });
}

function print(component, text) {
    const color = component.color;
    const line = `[${component.label}] ${text}`;

    const msg = chalk.keyword(color)(line);
    console.log(msg);    
}

const components = convertToArray(data.components);
const runners = convertToArray(data.runners);

const web = components[0];
const runner = runners[1];

let labelLength = 0;
components.forEach(x => {
    if (x.id.length > labelLength) {
        labelLength = x.id.length;
    }
});

const colors = [
    "green",
    "blue",
    "yellow",
    "pink",
    "orange"
];

components.forEach((x, index) => {
    x.label = padright(x.id, labelLength, " ");
    x.color = colors[index];

    runComponent(x, runner, runner.pause);
});
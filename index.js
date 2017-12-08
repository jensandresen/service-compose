#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const yamlFile = require("yamlfile");
const padright = require("pad-right");
const argsParser = require("minimist");
const RunnerService = require("./runnerservice.js");
const { convertToArray } = require("./utils.js");

const args = argsParser(process.argv.slice(2));

function printHelp() {
    console.log("Usage:");
    console.log("  service-compose [-f|--file <filename>]");
    console.log("  service-compose --version");
    console.log("  service-compose --help");
    console.log("");
    console.log("Options:");
    console.log("  -f, --file <filename>    Specify a compose file (default: service-compose.yml)");
    console.log("  --version                Shows the version of the current installation");
    console.log("  --help                   Shows this help information");
    console.log("");
}

if (args._.length == 0 && args.help === true) {
    printHelp();
    process.exit(0);
}

if (args._.length == 0 && args.version === true) {
    const info = require("./package.json");
    console.log(`Current version is v${info.version}`);
    process.exit(0);
}

let filename = "service-compose.yml";

if (process.argv.slice(2).length == 0 || args.f || args.file) {
    filename = args.f || args.file || "service-compose.yml";
    
    if (filename === true) {
        console.log("Missing filename from the invocation. Try 'service-compose --help' for more information.")
        process.exit(1);
    }
} else {
    console.log("Invalid invocation!")
    console.log("")
    printHelp();
    process.exit(1);
}

if (!fs.existsSync(filename)) {
    console.log(`Unable to locate the compose file: ${filename}`);
    process.exit(1);
}

const data = yamlFile.readFileSync(filename);

if (!data.version) {
    console.log(`Error, missing version information from compose file.`);
    process.exit(1);
}

if (data.version != 1) {
    console.log(`Version "${data.version}" of the compose file is not supported.`);
    process.exit(1);
}

const components = convertToArray(data.components);

// add label to component
let longestLabelLength = 0;
components.forEach(component => {
        if (component.id.length > longestLabelLength) {
            longestLabelLength = component.id.length;
        }
});
components.forEach(component => {
    component.label = padright(component.id, longestLabelLength, " ");
});

// add color to component
const colors = [ "green", "yellow", "cyan", "orange", "blue" ];
components.forEach((component, index) => {
    if (!component.color) {
        component.color = colors[index];        
    }
});

// add runners to component
const runners = convertToArray(data.runners);
const runnerService = new RunnerService(runners);

components.forEach(component => {
    const runner = runnerService.getRunnerFor(component);
    component.runner = runner;    
});

// validate that all components can be run
const notRunnableComponents = components.filter(component => {
    if (component.runner) {
        return false;
    } else {
        return true;
    }
});

if (notRunnableComponents.length > 0) {
    console.log("ERROR - the following components does not have a runner:");
    notRunnableComponents.forEach(component => {
        console.log(`  id: ${component.id} - type: ${component.type}`);
    });
    process.exit(1);
}

components
    .map((component, index) => {
        const runner = runnerService.getRunnerFor(component);
        
        const options = {
            ignoreDelay: index == 0
        };
        
        return () => runner.runAsync(component, options);
    })
    .reduce((p, f) => p.then(f), Promise.resolve());
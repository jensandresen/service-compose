const path = require("path");
const yamlFile = require("yamlfile");
const padright = require("pad-right");

const RunnerService = require("./runnerservice.js");

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
    component.color = colors[index];
});

const runners = convertToArray(data.runners);
const runnerService = new RunnerService(runners);

const notRunnableComponents = components.filter(component => !runnerService.isSupported(component));
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
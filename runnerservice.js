const Runner = require("./runner.js");

class RunnerService {
    constructor(runners) {
        this.runners = runners;
    }

    getRunnerDescriptorFor(component) {
        return this.runners.find(runner => {
            const supportedTypesByRunner = runner.supports || [];
            return supportedTypesByRunner
                .filter(type => component.type == type)
                .length > 0;
        });        
    }

    getRunnerFor(component) {
        const runner = this.getRunnerDescriptorFor(component);

        if (!runner) {
            return null;
        }

        return new Runner(runner);
    }

    isSupported(component) {
        const runner = this.getRunnerDescriptorFor(component);
        if (runner) {
            return true;
        } else {
            return false;
        }
    }
}

module.exports = RunnerService;
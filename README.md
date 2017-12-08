# Service-Compose
---

# Introduction
## What is it?
Service-Compose is a utility that let's you spin up multiple services during development. It has it's striking similarities with the wonderful tool called [Docker Compose](https://docs.docker.com/compose), but without being container based.

## Why should I use it?
If you are not developing in a containerized environment and don't have the luxury/desire to go down that path (for reasons defined by the context that you are in), this could might be an interesting utility for you. You can get the pleasure of spinning up an entire environment with multiple services - in one go!

Please note, if you have the luxury to either pick Docker and Docker Compose, or if you already are in such an environment, by all means do that or stay there! I my self - the author of this utility - would also pick Docker and Docker Compose, but sometimes you find yourself in a setup where you just cannot use that. So consider this utility as an alternative - or _**the**_ alternative - for those situations.

# Getting Started
## Installation
The utility is available on the official npm registry and can be installed by running the following in a command prompt:
```SHELL
$ npm install -g service-compose
```

## Usage

By convention the default name for a compose file is `service-compose.yml` and if no file is specified when executing the service compose utility it will look for that file in the current working directory. So this means that you can execute it the following way:

```SHELL
$ service-compose
```

You can specify another compose file by running the following:

```SHELL
$ service-compose -f <path_to_file>
```

Where you replace `<path_to_file>` with the path (relative or absolute) to your compose file.

For additional help and usage information run the following:
```SHELL
$ service-compose --help
```

# Compose File
A _compose file_ is a __yaml__ file that defines how each service should be configured and executed. The structure of the _compose file_ is very important and _attention to the details_ is required.

The following is an example of how a compose file could look like:
```YAML
version: 1
components:
  frontend:
    type: nodejs
    app:
      root: ./apps/frontend
      start: index.js
    environment:
      backend_url: http://localhost:3001
  backend:
    type: nodejs
    app:
      root: ./apps/backend
      start: server.js
runners:
  nodejs:
    cmd: node
    args: 
      - <root>/<start>
    supports:
      - nodejs
```

## Sections

The following describes each section of the compose file:

### Main sections
|Section name|Is required|Type|Description|
|------------|-----------|----|-----------|
|version|YES|Number|Indicates what version of the compose document structure that should be parsed and interpreted.|
|components|YES|Object (of type Component)|Defines how a component should be configured.|
|runners|YES|Object (of type Runner)|Defines how a component should be run.|

### Types
#### Number
This is just a number e.g. 1. Any constraints really depends on the context.

#### String
This is just a piece of text with which any constraints also really depends on the context.

#### Component
The following describes how a component can be configured:

A component is first and foremost defined by a name (which will be it's identifier throughout e.g. `frontend`). Then the component object is defined by the following properties:

|Property name|Is required|Type|Description|
|-------------|-----------|----|-----------|
|type|YES|String|Identifies what type of component this is. It is used to identify which __runner__ that should be used to run this component.|
|app|YES|Object (of type App)|Describes where the app should be executed from and the main entry point of the app.|
|environment|NO|Object (of type Environment)|Describes any environment variables that should be set in the component execution context.|

#### App
|Property name|Is required|Type|Description|
|-------------|-----------|----|-----------|
|root|YES|String|Defines the root folder where the application should be executed from.|
|start|NO|String|Defines the main entry point for the application (if one such is required).|
|port|NO|Number|Defines what port the application will be available on.|

#### Environment
This is a key/value object where the name of each property will be the name of the environment variable and the value of the property will be the value of the environment variable. Here is an example:

```YAML
environment:
  backend_url: foo
  another_variable: bar
```

This will result in the the environment variable `backend_url=foo` and `another_variable=bar` being available from the application in it's running context.

#### Runner
The following describes how a runner can be configured:

A runner is defined by a name (which will be it's identifier throughout e.g. `nodejs`). Then the runner object is defined by the following properties:

|Property name|Is required|Type|Description|
|-------------|-----------|----|-----------|
|cmd|YES|String|The command that is used to execute the runner on the command line.|
|args|YES|Array (of type String)|The arguments that will pass information about your application to the runner executable. Please see special remarks about this below.|
|delay|NO|Number|Indicates a delay in miliseconds between execution of applications using this runner. Can be useful if the runner or application needs some time to boot before the next one is started.|
|supports|YES|Array (of type String)|Specifies what component types this runner can run. Please note that if multiple runners supports the same component type, the first runner with that support is selected. These types should match the types that your components are configured as.|

##### Special remark
The `args` of a runner has special functionality built around it. To be able to pass executable application information to a specific runner, you can build it up by using all the `app` properties from your components. Take a look at this runner:

```YAML
runners:
  iisexpress:
    cmd: iisexpress
    args:
      - /port:<port>
      - /path:"MakeAbsolute(<root>)"
```

This configures a runner for a development webserver called `iisexpress` (which in this example can be executed by running `iisexpress` on the command line). The webserver can be configured with a port on which the application should be running on and then it needs a full __absolute__ path to the root directory of the application. In the example above the built in function __MakeAbsolute(...)__ can turn a relative path into an absolute path.

The `<port>` and `<root>` are placeholders for the values for `port` and `root` from the component's app configuration. Placeholders can be combined in any way to create a proper command line invocation of the given runner and you component. Placeholders are defined in angle brackets like `<placeholder_name>`.
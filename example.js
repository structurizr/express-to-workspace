var fs = require('fs');
var structurizrExpress = require('./structurizr-express');

// example 1: Structurizr Express JSON to Structurizr workspace JSON
var expressJsonDefinition = fs.readFileSync('example-express.json').toString();
var workspace1 = structurizrExpress.toWorkspace(expressJsonDefinition);

if (!structurizrExpress.hasErrorMessages() && !structurizrExpress.hasWarningMessages()) {
    console.log(JSON.stringify(workspace1, null, '    '));
}

// example 2: Structurizr Express YAML to Structurizr workspace JSON
// const YAML = require('yaml');

// var expressYamlDefinition = fs.readFileSync('example-express.yaml').toString();
// var expressYamlAsJsonDefinition = JSON.stringify(YAML.parse(expressYamlDefinition));
// var workspace2 = structurizrExpress.toWorkspace(expressYamlAsJsonDefinition);

// if (!structurizrExpress.hasErrorMessages() && !structurizrExpress.hasWarningMessages()) {
//     console.log(JSON.stringify(workspace2, null, '    '));
// }
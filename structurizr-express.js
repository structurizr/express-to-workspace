module.exports = {
    toWorkspace: function(expressJson) {
        return parseExpressJson(expressJson); 
    },

    hasErrorMessages: function() {
        return errorMessages.length > 0;
    },

    getErrorMessages: function() {
        return errorMessages;
    },

    hasWarningMessages: function() {
        return warningMessages.length > 0;
    },

    getWarningMessages: function() {
        return warningMessages;
    }
};
  
var workspace;
var view;
var id = 1;
var elements, elementsById, elementsByName, relationships;
var errorMessages = [], warningMessages = [];

function parseExpressJson(definition) {
    clearMessages();
    definition = sanitiseDefinition(definition);

    id = 1;
    elements = [];
    elementsById = [];
    elementsByName = [];
    relationships = [];

    errorMessages = [];
    warningMessages = [];

    workspace = {
        name: 'Structurizr Express'
    };
    workspace.model = {};
    workspace.model.softwareSystems = [];
    workspace.model.people = [];
    workspace.views = {};
    workspace.views.configuration = {};
    workspace.views.configuration.styles = {};
    workspace.views.configuration.styles.elements = [];
    workspace.views.configuration.styles.relationships = [];
    workspace.views.systemLandscapeViews = [];
    workspace.views.systemContextViews = [];
    workspace.views.containerViews = [];
    workspace.views.componentViews = [];
    workspace.views.dynamicViews = [];

    view = undefined;

    try {
        var json = JSON.parse(definition);
    } catch (e) {
        console.log(e);
        logError(e);
        return;
    }

    if (json) {
        if (json.elements) {
            json.elements.forEach(function(element) {
                parseElementFromJson(element);
            });
        }

        if (json.relationships) {
            json.relationships.forEach(function(relationship) {
                parseRelationshipFromJson(relationship);
            })
        }

        if (json.styles) {
            json.styles.forEach(function(style) {
                if (style.type && style.type === 'element') {
                    parseElementStyleFromJson(style);
                } else if (style.type && style.type === 'relationship') {
                    parseRelationshipStyleFromJson(style);
                }
            })
        }

        parseDiagramFromJson(json);
    }

    createView(undefined);

    return workspace;
}

function parseElementFromJson(element) {
    if (element && element.type) {
        if (element.type.toLowerCase() === "software system" || element.type.toLowerCase() === "softwaresystem") {
            parseSoftwareSystemFromJson(element);
        } else if (element.type.toLowerCase() === "person") {
            parsePersonFromJson(element);
        } else {
            logError('Invalid element type of \"' + element.type + '\", top-level elements must have a type of \"Person\" or \"Software System\".')
        }
    } else {
        logError('Top-level elements must have a type of \"Person\" or \"Software System\".')
    }
}

function parseSoftwareSystemFromJson(element) {
    var name = element.name;
    var description = element.description;
    var tags = element.tags;
    var position = element.position;

    if (!name || name.length === 0) {
        logError('Software systems must have a name.');
        return;
    }

    var softwareSystem = {};
    softwareSystem.id = id++;
    softwareSystem.name = name;
    softwareSystem.description = description;
    softwareSystem.type = 'SoftwareSystem';
    softwareSystem.tags = 'Element,Software System';
    if (tags && tags.length > 0) {
        softwareSystem.tags += ',';
        softwareSystem.tags += tags;

        var tagsArray = tags.split(',');
        tagsArray.forEach(function(tag) {
            if (tag.trim().toLowerCase() === 'internal') {
                softwareSystem.location = 'Internal';
            } else if (tag.trim().toLowerCase() === 'external') {
                softwareSystem.location = 'External';
            }
        });
    }

    softwareSystem.containers = [];
    softwareSystem.relationships = [];

    var coordinate = parsePosition(position, 1, undefined);
    softwareSystem.x = coordinate.x;
    softwareSystem.y = coordinate.y;

    workspace.model.softwareSystems.push(softwareSystem);
    addElement(1, undefined, softwareSystem);

    if (element.containers) {
        element.containers.forEach(function(container) {
            parseContainerFromJson(softwareSystem, container);
        });
    }
}

function parseContainerFromJson(softwareSystem, element) {
    var name = element.name;
    var description = element.description;
    var technology = element.technology;
    var tags = element.tags;
    var position = element.position;

    if (!name || name.length === 0) {
        logError('Containers must have a name.');
        return;
    }

    var container = {};
    container.id = id++;
    container.parentId = softwareSystem.id;
    container.name = name;
    container.description = description;
    container.technology = technology;
    container.type = 'Container';
    container.tags = 'Element,Container';
    if (tags && tags.length > 0) {
        container.tags += ',';
        container.tags += tags;
    }

    container.components = [];
    container.relationships = [];

    var coordinate = parsePosition(position, undefined, undefined);
    container.x = coordinate.x;
    container.y = coordinate.y;

    softwareSystem.containers.push(container);
    addElement(undefined, undefined, container);

    if (element.components) {
        element.components.forEach(function(component) {
            parseComponentFromJson(container, component);
        });
    }
}

function parseComponentFromJson(container, element) {
    var name = element.name;
    var description = element.description;
    var technology = element.technology;
    var tags = element.tags;
    var position = element.position;

    if (!name || name.length === 0) {
        logError('Components must have a name.');
        return;
    }

    var component = {};
    component.id = id++;
    component.parentId = container.id;
    component.name = name;
    component.description = description;
    component.technology = technology;
    component.type = 'Component';
    component.tags = 'Element,Component';
    if (tags && tags.length > 0) {
        component.tags += ',';
        component.tags += tags;
    }

    component.relationships = [];

    var coordinate = parsePosition(position, undefined, undefined);
    component.x = coordinate.x;
    component.y = coordinate.y;

    container.components.push(component);
    addElement(undefined, undefined, component);
}

function parsePersonFromJson(element) {
    var name = element.name;
    var description = element.description;
    var tags = element.tags;
    var position = element.position;

    if (!name || name.length === 0) {
        logError('People must have a name.');
        return;
    }

    var person = {};
    person.id = id++;
    person.name = name;
    person.description = description;
    person.type = 'Person';
    person.tags = 'Element,Person';
    if (tags && tags.length > 0) {
        person.tags += ',';
        person.tags += tags;

        var tagsArray = tags.split(',');
        tagsArray.forEach(function(tag) {
            if (tag.trim().toLowerCase() === 'internal') {
                person.location = 'Internal';
            } else if (tag.trim().toLowerCase() === 'external') {
                person.location = 'External';
            }
        });
    }

    person.relationships = [];

    var coordinate = parsePosition(position, 1, undefined);
    person.x = coordinate.x;
    person.y = coordinate.y;

    workspace.model.people.push(person);
    addElement(1, undefined, person);
}

function sanitiseDefinition(definition) {
    definition = definition.replace(/>/g,'&gt');
    definition = definition.replace(/</g,'&lt');

    return definition;
}

function parsePosition(position, lineNumber, line) {
    var coordinate = { x: undefined, y: undefined };
    if (position && position.length > 0) {
        var coordinates = position.split(",");
        if (coordinates.length === 2) {
            var xAsString = coordinates[0].trim();
            var yAsString = coordinates[1].trim();

            if (isInteger(xAsString)) {
                coordinate.x = parseInt(xAsString, 10);
            } else {
                logWarning('The x coordinate of "' + xAsString + '" is not a positive integer.', line, lineNumber);
            }

            if (isInteger(yAsString)) {
                coordinate.y = parseInt(yAsString, 10);
            } else {
                logWarning('The y coordinate of "' + yAsString + '" is not a positive integer.', line, lineNumber);
            }
        } else {
            logWarning('"' + position + '" is not an x,y coordinate.', line, lineNumber);
        }
    }

    return coordinate;
}

function addElement(lineNumber, line, element) {
    if (!elementsByName[element.name]) {
        elements.push(element);
        elementsById[element.id] = element;
        elementsByName[element.name] = element;
    } else {
        logError('An element named "' + element.name + '" already exists.', line, lineNumber)
    }
}

function parseRelationshipFromJson(json) {
    var sourceName = json.source;
    var description = json.description;
    var technology = json.technology;
    var destinationName = json.destination;
    var tags = json.tags;
    var vertices = json.vertices;
    var position = json.position;
    var routing = json.routing;
    var order = json.order;

    if (!sourceName || sourceName.length === 0) {
        logError("The relationship source must be specified.");
        return;
    }

    if (!destinationName || destinationName.length === 0) {
        logError("The relationship destination must be specified.");
        return;
    }
    var sourceElement = elementsByName[sourceName];
    var destinationElement = elementsByName[destinationName];

    if (order !== undefined && order.length > 0) {
        if (isInteger(order)) {
            order = parseInt(order);
        } else {
            logError('The order of "' + order + '" is not an integer.');
        }
    } else {
        order = 1;
    }

    if (sourceElement && destinationElement) {
        var relationship = {};
        relationship.id = id++;
        relationship.sourceId = sourceElement.id;
        relationship.destinationId = destinationElement.id;
        relationship.description = description;
        relationship.technology = technology;
        relationship.order = order;
        relationship.tags = 'Relationship';
        if (tags && tags.length > 0) {
            relationship.tags += ',';
            relationship.tags += tags;
        }
        relationship.vertices = [];

        if (vertices && vertices.length > 0) {
            vertices.forEach(function(position) {
                var coordinate = parsePosition(position, 1, undefined);
                if (coordinate.x && coordinate.y) {
                    relationship.vertices.push(coordinate);
                }
            });
        }

        if (routing !== undefined) {
            relationship.routing = routing;
        }

        if (position !== undefined) {
            relationship.position = position;
        }

        sourceElement.relationships.push(relationship);
        relationships.push(relationship);
    } else if (!sourceElement) {
        logError('The relationship source element named "' + sourceName + '" does not exist.');
    } else if (!destinationElement) {
        logError('The relationship destination element named "' + destinationName + '" does not exist.');
    }
}

function parseDiagramFromJson(json) {
    view = {};

    var viewType = json.type;
    var elementName = json.scope;
    var element;
    var description = json.description;
    var paperSize = json.size;

    if (viewType === 'Enterprise Context' || viewType === 'System Landscape') {
        workspace.model.enterprise = {
            name: elementName
        }
    } else if (viewType === 'System Context' || viewType === 'Container') {
        element = elementsByName[elementName];
        if (!element) {
            logError('Diagram scope: the software system named "' + elementName + '" could not be found.');
            return;
        }
    } else if (viewType === 'Component') {
        element = elementsByName[elementName];
        if (!element) {
            logError('Diagram scope: the contained named "' + elementName + '" could not be found.');
            return;
        }
    } else if (viewType === 'Dynamic') {
        if (elementName) {
            element = elementsByName[elementName];
            if (!element) {
                logError('Diagram scope: the software system or container named "' + elementName + '" could not be found.');
                return;
            }
        }
    }

    var paperSizes = new PaperSizes();
    if (paperSizes.getDimensions(paperSize)) {
        view.paperSize = paperSize;
    } else {
        view.paperSize = "A5_Landscape";
    }

    view.description = description;

    if (viewType === 'Enterprise Context' || viewType === 'System Landscape') {
        view.type = 'SystemLandscape';
        workspace.views.systemLandscapeViews.push(view);
    } else if (viewType === 'System Context') {
        if (element.type === 'SoftwareSystem') {
            workspace.views.systemContextViews.push(view);
            view.type = 'SystemContext';
            view.softwareSystemId = element.id;
        } else {
            logError('The element with the name "' + elementName + '" must be a software system.');
        }
    } else if (viewType === 'Container') {
        if (element.type === 'SoftwareSystem') {
            workspace.views.containerViews.push(view);
            view.type = 'Container';
            view.softwareSystemId = element.id;
        } else {
            logError('The element with the name "' + elementName + '" must be a software system.');
        }
    } else if (viewType === 'Component') {
        if (element.type === 'Container') {
            workspace.views.componentViews.push(view);
            view.type = 'Component';
            view.softwareSystemId = element.parentId;
            view.containerId = element.id;
        } else {
            logError('The element with the name "' + elementName + '" must be a container.');
        }
    } else if (viewType === 'Dynamic') {
        if (element === undefined) {
            workspace.views.dynamicViews.push(view);
            view.type = 'Dynamic';
        } else {
            if (element.type === 'SoftwareSystem' || element.type === 'Container') {
                workspace.views.dynamicViews.push(view);
                view.type = 'Dynamic';
                view.elementId = element.id;
            } else {
                logError('The diagram scope for a dynamic view must be a software system or container.');
            }
        }
    } else {
        logError('The diagram type must be "System Landscape", "System Context", "Container", "Component" or "Dynamic".');
    }
}

function parseElementStyleFromJson(json) {
    var elementStyle = {};
    var tag = json.tag;
    var width = json.width;
    var height = json.height;
    var background = json.background;
    var color = json.color;
    var border = json.border;
    var opacity = json.opacity;
    var fontSize = json.fontSize;
    var shape = json.shape;
    var metadata = json.metadata;
    var description = json.description;

    if (tag && tag.length > 0) {
        elementStyle.tag = tag;
    }

    if (width && width.length > 0) {
        if (isInteger(width)) {
            elementStyle.width = parseInt(width);
        } else {
            logError('The width of "' + width + '" is not an integer.');
        }
    }

    if (height && height.length > 0) {
        if (isInteger(height)) {
            elementStyle.height = parseInt(height);
        } else {
            logError('The height of "' + height + '" is not an integer.');
        }
    }

    if (background && background.length > 0) {
        if (isRGBHexColor(background)) {
            elementStyle.background = background;
        } else {
            logError('The background of "' + background + '" is not valid; must be an RGB hex value, e.g. "#ffffff".');
        }
    }

    if (color && color.length > 0) {
        if (isRGBHexColor(color)) {
            elementStyle.color = color;
        } else {
            logError('The color of "' + color + '" is not valid; must be an RGB hex value, e.g. "#ffffff".');
        }
    }

    if (border && border.length > 0) {
        if (border.toLowerCase() === 'solid') {
            elementStyle.border = 'Solid';
        } else if (border.toLowerCase() === 'dashed') {
            elementStyle.border = 'Dashed';
        } else {
            logError('The border of "' + border + '" is not valid; it must be \"Solid\" or \"Dashed\".');
        }
    }

    if (opacity && opacity.length > 0) {
        if (isInteger(opacity)) {
            elementStyle.opacity = Math.min(100, Math.max(0, parseInt(opacity)));
        } else {
            logError('The opacity of "' + opacity+ '" is not an integer.');
        }
    }

    if (fontSize && fontSize.length > 0) {
        if (isInteger(fontSize)) {
            elementStyle.fontSize = parseInt(fontSize);
        } else {
            logError('The font size of "' + fontSize + '" is not an integer.');
        }
    }

    if (shape && shape.length > 0) {
        if (shape === "Box" || shape === "RoundedBox" || shape === "Circle" || shape === "Ellipse" || shape === "Hexagon" || shape === "Person" || shape === "Robot" || shape === "Folder" || shape === "Cylinder" || shape === "Pipe" || shape === "WebBrowser" || shape === "MobileDevicePortrait" || shape === "MobileDeviceLandscape") {
            elementStyle.shape = shape;
        } else {
            logError('The shape of "' + shape + '" is not valid; must be one of Box, RoundedBox, Circle, Ellipse, Hexagon, Person, Robot, Folder, Cylinder, Pipe, WebBrowser, MobileDevicePortrait or MobileDeviceLandscape.');
        }
    }

    if (metadata !== undefined && metadata.length > 0) {
        metadata = metadata.toLowerCase();
        if (isBoolean(metadata)) {
            elementStyle.metadata = (metadata === 'true');
        } else {
            logError('The metadata value of "' + metadata + '" is not valid; must be one of true or false.');
        }
    }

    if (description !== undefined && description.length > 0) {
        description = description.toLowerCase();
        if (isBoolean(description)) {
            elementStyle.description = (description === 'true');
        } else {
            logError('The description value of "' + description + '" is not valid; must be one of true or false.');
        }
    }

    workspace.views.configuration.styles.elements.push(elementStyle);
}

function parseRelationshipStyleFromJson(json) {
    var relationshipStyle = {};
    var tag = json.tag;
    var width = json.width;
    var thickness = json.thickness;
    var color = json.color;
    var opacity = json.opacity;
    var position = json.position;
    var fontSize = json.fontSize;
    var dashed = json.dashed;
    var routing = json.routing;

    if (tag && tag.length > 0) {
        relationshipStyle.tag = tag;
    }

    if (width && width.length > 0) {
        if (isInteger(width)) {
            relationshipStyle.width = parseInt(width);
        } else {
            logError('The width of "' + width + '" is not an integer.');
        }
    }

    if (color && color.length > 0) {
        if (isRGBHexColor(color)) {
            relationshipStyle.color = color;
        } else {
            logError('The color of "' + color + '" is not valid; must be an RGB hex value, e.g. "#ffffff".');
        }
    }

    if (opacity && opacity.length > 0) {
        if (isInteger(opacity)) {
            relationshipStyle.opacity = Math.min(100, Math.max(0, parseInt(opacity)));
        } else {
            logError('The opacity of "' + opacity+ '" is not an integer.');
        }
    }

    if (position && position.length > 0) {
        if (isInteger(position)) {
            relationshipStyle.position = Math.min(100, Math.max(0, parseInt(position)));
        } else {
            logError('The position of "' + position+ '" is not an integer.');
        }
    }

    if (fontSize && fontSize.length > 0) {
        if (isInteger(fontSize)) {
            relationshipStyle.fontSize = parseInt(fontSize);
        } else {
            logError('The font size of "' + fontSize + '" is not an integer.');
        }
    }

    if (thickness && thickness.length > 0) {
        if (isInteger(thickness)) {
            relationshipStyle.thickness = parseInt(thickness);
        } else {
            logError('The thickness of "' + thickness + '" is not an integer.');
        }
    }

    if (dashed && dashed.length > 0) {
        if (dashed.toLowerCase() === 'true') {
            relationshipStyle.dashed = true;
        } else if (dashed.toLowerCase() === 'false') {
            relationshipStyle.dashed = false;
        } else {
            logError('Dashed must be \"true\" or \"false\".');
        }
    }

    if (routing && routing.length > 0) {
        if (routing.toLowerCase() === 'direct') {
            relationshipStyle.routing = 'Direct';
        } else if (routing.toLowerCase() === 'orthogonal') {
            relationshipStyle.routing = 'Orthogonal';
        } else {
            logError('The routing of "' + routing + '" is not valid; it must be \"Direct\" or \"Orthogonal\".');
        }
    }

    workspace.views.configuration.styles.relationships.push(relationshipStyle);
}

function createView(lineNumber) {
    if (view) {
        var elementIdsInView = [];

        view.key = 'express';
        view.elements = [];
        elements.forEach(function (element) {
            var elementInView =
            {
                'id': element.id,
                x: element.x,
                y: element.y
            };

            if (isAllowedInView(element, view)) {
                view.elements.push(elementInView);
                elementIdsInView.push(element.id);
            }
        });

        view.relationships = [];
        relationships.forEach(function(relationship) {
            if (elementIdsInView.indexOf(relationship.sourceId) > -1 && elementIdsInView.indexOf(relationship.destinationId) > -1) {
                var relationshipInView = {'id': relationship.id};

                if (view.type === 'Dynamic') {
                    relationshipInView.order = relationship.order;
                }

                if (relationship.vertices.length > 0) {
                    relationshipInView.vertices = relationship.vertices;
                }

                if (relationship.routing !== undefined) {
                    relationshipInView.routing = relationship.routing;
                }

                if (relationship.position !== undefined) {
                    relationshipInView.position = relationship.position;
                }

                view.relationships.push(relationshipInView);
            } else {
                console.log("Skipping relationship " + relationship.id  + " because the source/destination elements are not included on the view.");
            }
        });
    } else {
        logError('No diagram has been defined.');
    }
}

function isAllowedInView(element, view) {
    if (view.type === 'SystemLandscape') {
        return  (
            element.type === 'Person' ||
            element.type === 'SoftwareSystem'
            );
    } else if (view.type === 'SystemContext') {
        return  (
                element.type === 'Person' ||
                element.type === 'SoftwareSystem'
                );
    } else if (view.type === 'Container') {
        return  (
            (element.type === 'Person') ||
            (element.type === 'SoftwareSystem' && element.id !== view.softwareSystemId) ||
            (element.type === 'Container' && element.parentId === view.softwareSystemId)
                );
    } else if (view.type === 'Component') {
        var container = elementsById[view.containerId];
        return  (
            (element.type === 'Person') ||
            (element.type === 'SoftwareSystem' && element.id !== container.parentId) ||
            (element.type === 'Container' && element.id !== view.containerId) ||
            (element.type === 'Component' && element.parentId === view.containerId)
                );
    } else if (view.type === 'Dynamic') {
        if (element.type === 'Person') {
            return true;
        }

        if (view.elementId === undefined) {
            if (element.type === 'SoftwareSystem') {
                return true;
            } else {
                console.log('Only people and software systems can be added to this view.');
                return false;
            }
        }
        var elementInScope = elementsById[view.elementId];
        if (elementInScope !== undefined) {
            if (elementInScope.type === 'SoftwareSystem') {
                if (element.id === elementInScope.id) {
                    console.log(element.name + ' is already the scope of this view and cannot be added to it.');
                    return false;
                } else if (element.type === 'Container' && element.parentId !== elementInScope.id) {
                    console.log('Only containers that reside inside ' + elementInScope.name + ' can be added to this view.');
                    return false;
                } else if (element.type === 'Component') {
                    console.log("Components can't be added to a dynamic view when the scope is a software system.");
                    return false;
                }
            }

            if (elementInScope.type === 'Container') {
                if (element.id === elementInScope.id || element.id === elementInScope.parentId) {
                    console.log(element.name + ' is already the scope of this view and cannot be added to it.');
                    return false;
                } else if (element.type === 'Container' && element.parentId !== elementInScope.parentId) {
                    var parentSoftwareSystem = elementsById[elementInScope.parentId];
                    console.log("Only containers that reside inside " + parentSoftwareSystem.name + " can be added to this view.");
                    return false;
                } else if (element.type === 'Component' && element.parentId !== elementInScope.id) {
                    console.log("Only components that reside inside " + elementInScope.name + " can be added to this view.");
                    return false;
                }
            }
        }

        return true;
    }
}

function clearMessages() {
    errorMessages = [];
    warningMessages = [];
}

this.addErrorMessage = function(message) {
    logError(message);
};

function logError(message, line, lineNumber) {
    errorMessages.push({
        message: message,
        line: line,
        lineNumber: lineNumber
    });

    if (lineNumber) {
        console.error('Line ' + lineNumber + ': ' + message);
        console.error(line);
    } else {
        console.error(message);
    }
}

function logWarning(message, line, lineNumber) {
    warningMessages.push({
        message: message,
        line: line,
        lineNumber: lineNumber
    });

    if (lineNumber) {
        console.log('Line ' + lineNumber + ': ' + message);
        console.log(line);
    } else {
        console.log(message);
    }
}

function isInteger(numberAsString) {
    return /^\+?\d+$/.test(numberAsString);
}

function isBoolean(b) {
    return b === 'true' || b === 'false';
}

function isRGBHexColor(hexValue) {
    return /^#[0-9a-f]{6}/i.test(hexValue);
}

PaperSizes = function() {

    var definitions = {};

    definitions['A6_Portrait'] = {
        width: 1240,
        height: 1748
    };

    definitions['A6_Landscape'] = {
        width: 1748,
        height: 1240
    };

    definitions['A5_Portrait'] = {
        width: 1748,
        height: 2480
    };

    definitions['A5_Landscape'] = {
        width: 2480,
        height: 1748
    };

    definitions['A4_Portrait'] = {
        width: 2480,
        height: 3508
    };

    definitions['A4_Landscape'] = {
        width: 3508,
        height: 2480
    };

    definitions['A3_Portrait'] = {
        width: 3508,
        height: 4961
    };

    definitions['A3_Landscape'] = {
        width: 4961,
        height: 3508
    };

    definitions['A2_Portrait'] = {
        width: 4961,
        height: 7016
    };

    definitions['A2_Landscape'] = {
        width: 7016,
        height: 4961
    };

    definitions['A1_Portrait'] = {
        width: 7016,
        height: 9933
    };

    definitions['A1_Landscape'] = {
        width: 9933,
        height: 7016
    };

    definitions['A0_Portrait'] = {
        width: 9933,
        height: 14043
    };

    definitions['A0_Landscape'] = {
        width: 14043,
        height: 9933
    };

    definitions['Letter_Portrait'] = {
        width: 2550,
        height: 3300
    };

    definitions['Letter_Landscape'] = {
        width: 3300,
        height: 2550
    };

    definitions['Legal_Portrait'] = {
        width: 2550,
        height: 4200
    };

    definitions['Legal_Landscape'] = {
        width: 4200,
        height: 2550
    };

    definitions['Slide_4_3'] = {
        width: 3306,
        height: 2480
    };

    definitions['Slide_16_9'] = {
        width: 3508,
        height: 1973
    };

    this.getDimensions = function(paperSize) {
        return definitions[paperSize];
    };

};

let network = null, data = [];
let nodes = [], lateNodes = [], edges = [], lateEdges = [], techTree = [];
let projects, techs, effects;
let techSidebar, searchBox;
let localizationData = {};
let searchIndex;
let modules = {};

function draw() {
    const container = document.getElementById("mynetwork");
    const options = {
        layout: {
            hierarchical: {
                direction: "LR",
                parentCentralization: false,
                levelSeparation: 500
            },
            improvedLayout: false
        },
        interaction: { dragNodes: false },
        physics: {
            enabled: false
        },
        nodes: {
            borderWidth: 5,
            borderWidthSelected: 5,
            size: 20,
            color: {
                background: "#111",
                highlight: {
                    border: "blue",
                    background: "#111"
                }
            },
            font: {
                color: "black",
                face: "Roboto",
                size: 25, 
                multi: 'html',
                bold: "25px Roboto black"
            },
            shapeProperties: {
                useBorderWithImage: true,
            },
            imagePadding: 5
        },
        edges: {
            color: {
                color: "gray",
                highlight: "blue"
            },
            width: 0.5,
            selectionWidth: 5,
            arrows: {
                to: {
                    enabled: true
                }
            }
        }
    };
    network = new vis.Network(container, data, options);

    data.nodes.add(lateNodes);

    let oldPositions = {};
    Object.values(network.body.nodes).forEach(node => {
        oldPositions[node.id] = [node.x, node.y];
    });

    data.edges.add(lateEdges);

    Object.keys(network.body.nodes).forEach(node => {
        network.nodesHandler.body.nodes[node].x = oldPositions[node][0];
        network.nodesHandler.body.nodes[node].y = oldPositions[node][1];
    });

    network.on('selectNode', nodeSelected);
    network.on('deselectNode', nodeDeselected);

    // Disable selecting edges
    network.on('click', ({ nodes, edges }) => {
        if (nodes.length == 0 && edges.length > 0) {
            network.setSelection({
                nodes: [],
                edges: []
            });
        }
    });

    let MIN_ZOOM = 0.35
    let MAX_ZOOM = 2.0
    let lastZoomPosition = { x: 0, y: 0 }
    network.on("zoom", function (params) {
        let scale = network.getScale()
        if (scale <= MIN_ZOOM) {
            network.moveTo({
                position: lastZoomPosition,
                scale: MIN_ZOOM
            });
        }
        else if (scale >= MAX_ZOOM) {
            network.moveTo({
                position: lastZoomPosition,
                scale: MAX_ZOOM,
            });
        }
        else {
            lastZoomPosition = network.getViewPosition()
        }
    });
    network.moveTo({
        scale: 0.35,
    });

    network.on("dragEnd", function (params) {
        lastZoomPosition = network.getViewPosition()
    });

    const handleFinishDrawing = () => {
        document.getElementById("loading").style.display = "none";
        network.off("afterDrawing", handleFinishDrawing);
    };
    network.on('afterDrawing', handleFinishDrawing)
}

function initSidebar() {
    if (!techSidebar) {
        techSidebar = ReactDOM.render(React.createElement(TechSidebar, {
            data: localizationData,
            techTree: techTree,
            effects: effects
        }), document.getElementById("sidebar"));
    }
}

function nodeSelected(event) {
    if (event.nodes.length !== 1) {
        return;
    }

    const selectedNodeId = event.nodes[0];
    const selectedNode = findTechByName(selectedNodeId);

    const sidebar = showSidebar();

    techSidebar.setState({ node: selectedNode });
    updateLocationHash(selectedNodeId);
}

function updateLocationHash(newHash) {
    history.replaceState(undefined, undefined, "#" + newHash);
}

function nodeDeselected() {
    hideSidebar();
}

function showSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.style.display = "block";
    return sidebar;
}

function hideSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.style.display = "none";
}

window.onload = init();
// window.onkeydown = function (e) {
//     if (e.keyCode == 70 && e.ctrlKey) {
//         e.preventDefault();
//     }
// }

function init() {
    const fetchLocPaths = [
        'TITechTemplate.en',
        'TIProjectTemplate.en',
        'TIEffectTemplate.en',
        'TIBatteryTemplate.en',
        'TIDriveTemplate.en',
        'TIGunTemplate.en',
        'TIHabModuleTemplate.en',
        'TIHeatSinkTemplate.en',
        'TILaserWeaponTemplate.en',
        'TIMagneticGunTemplate.en',
        'TIMissileTemplate.en',
        'TIParticleWeaponTemplate.en',
        'TIPlasmaWeaponTemplate.en',
        'TIPowerPlantTemplate.en',
        'TIRadiatorTemplate.en',
        'TIShipArmorTemplate.en',
        'TIShipHullTemplate.en',
        'TIUtilityModuleTemplate.en',
    ];
    let fetchedTexts = [];

    const fetchLocPromises = fetchLocPaths.map(url => fetch("data/" + url).then(res => res.text()));
    Promise.all(fetchLocPromises).then(results => {
        results.forEach(result => {
            parseText(result);
        });
    }).then(() => {
        hideSidebar();
        parseDefaults(() => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                nodeSelected({ nodes: [hash] });
                network.selectNodes([hash]);
                network.focus(hash);
                network.moveTo({
                    scale: 1.0,
                });
            }
        });

        initSidebar();
    });

    fetchModule("TITechTemplate.json", "tech", () => {
        techs = modules.tech;
    });
    fetchModule("TIProjectTemplate.json", "project", () => {
        projects = modules.project;
    });
    fetchModule("TIEffectTemplate.json", "effect", () => {
        effects = modules.effect;
    });
    fetchModule("TIDriveTemplate.json", "drive");
    fetchModule("TIGunTemplate.json", "gun");
    fetchModule("TIHabModuleTemplate.json", "hab");
    fetchModule("TIHeatSinkTemplate.json", "heatsink");
    fetchModule("TILaserWeaponTemplate.json", "laser");
    fetchModule("TIMagneticGunTemplate.json", "magnetic");
    fetchModule("TIMissileTemplate.json", "missile");
    fetchModule("TIParticleWeaponTemplate.json", "particle");
    fetchModule("TIPlasmaWeaponTemplate.json", "plasma");
    fetchModule("TIPowerPlantTemplate.json", "power");
    fetchModule("TIRadiatorTemplate.json", "radiator");
    fetchModule("TIShipArmorTemplate.json", "armor");
    fetchModule("TIShipHullTemplate.json", "hull");
    fetchModule("TIUtilityModuleTemplate.json", "utility");
}

function fetchModule(path, modType, callback) {
    fetch("data/" + path).then(res => res.text()).then(module => {
        parseModule(module, modType);

        if (callback) callback();
    });
}

function parseModule(module, modType) {
    modules[modType] = JSON.parse(module);
}

function findModule(moduleName) {
    let results = [];
    for (let modTypes in modules) {
        modules[modTypes].forEach(module => {
            if (module.requiredProjectName === moduleName)
                results.push(module);
        });
    }
    return results;
}

function initSearchBox() {
    searchBox = ReactDOM.render(React.createElement(Searchbox), document.getElementById("options"));

    // Build index
    searchIndex = elasticlunr(function () {
        this.addField("friendlyName");
        this.addField("dataName");
        this.setRef("dataName");
    });
    techTree.forEach(tech => searchIndex.addDoc(tech));
    techSidebar.setState({ techTree: techTree, effects: effects });
}

function clearTree() {
    document.getElementById("loading").style.display = "block";

    if (data.nodes) data.nodes.clear();
    if (data.edges) data.edges.clear();

    nodes = [];
    lateNodes = [];

    edges = [];
    lateEdges = [];
}

function parseDefaults(callback) {
    clearTree();
    setTimeout(() => {
        techTree = techs.concat(projects);

        parseNode(techTree);
        data.nodes = new vis.DataSet(nodes);
        data.edges = new vis.DataSet(edges);

        draw();

        initSearchBox();

        if (callback)
            callback();
    }, 1);
}

function parseTechsOnly(callback) {
    clearTree();
    setTimeout(() => {
        parseNode(techs);
        data.nodes = new vis.DataSet(nodes);
        data.edges = new vis.DataSet(edges);

        draw();

        if (callback)
            callback();
    }, 1);
}

function parseSpecifiedNodes(group, callback) {
    clearTree();
    setTimeout(() => {
        parseNode(group, group.length < 20);
        data.nodes = new vis.DataSet(nodes);
        data.edges = new vis.DataSet(edges);

        draw();

        if (callback)
            callback();
    }, 1);
}

function parseText(text) {
    const lines = text.split("\n");

    const displayNameRegex = new RegExp("displayName");
    const summaryRegex = new RegExp("summary");
    const descriptionRegex = new RegExp("description");

    lines.forEach(line => {
        line = line.split("//")[0].trim();

        const splitter = line.split(/=(.*)/s);
        const key = splitter[0];
        const value = splitter[1];

        const keySplit = key.split(".");
        const keyId = keySplit[2];

        if (!localizationData[keyId]) {
            localizationData[keyId] = {};
        }

        if (displayNameRegex.test(keySplit[1])) {
            localizationData[keyId].displayName = value;
        } else if (summaryRegex.test(keySplit[1])) {
            localizationData[keyId].summary = value;
        } else if (descriptionRegex.test(keySplit[1])) {
            localizationData[keyId].description = value;
        }
    });
}

function getTechIconFile(techCategory) {
    let shortName;
    if (techCategory === "Energy") {
        shortName = "energy";
    } else if (techCategory === "InformationScience") {
        shortName = "info";
    } else if (techCategory === "LifeScience") {
        shortName = "life";
    } else if (techCategory === "Materials") {
        shortName = "material";
    } else if (techCategory === "MilitaryScience") {
        shortName = "military";
    } else if (techCategory === "SocialScience") {
        shortName = "social";
    } else if (techCategory === "SpaceScience") {
        shortName = "space";
    } else if (techCategory === "Xenology") {
        shortName = "xeno";
    }
    return "icons/tech_" + shortName + "_icon.png";
}

function getTechBorderColor(techCategory) {
    if (techCategory === "Energy") {
        return "#ff7008";
    } else if (techCategory === "InformationScience") {
        return "#e87474";
    } else if (techCategory === "LifeScience") {
        return "#3cc478";
    } else if (techCategory === "Materials") {
        return "#fbcb4b";
    } else if (techCategory === "MilitaryScience") {
        return "#393c3c";
    } else if (techCategory === "SocialScience") {
        return "#74bddc";
    } else if (techCategory === "SpaceScience") {
        return "#6270d0";
    } else if (techCategory === "Xenology") {
        return "#906cdc";
    }

    return "black";
}

function parseNode(nodeType, dumpAllEdges) {
    nodeType.forEach(tech => {
        let nodeBucket = false;
        if (tech.repeatable || tech.endGameTech) {
            nodeBucket = lateNodes;
        } else {
            nodeBucket = nodes;
        }

        nodeBucket.push({
            label: "<b>" + tech.friendlyName + "</b>",
            id: tech.dataName,
            shape: "circularImage",
            image: getTechIconFile(tech.techCategory),
            level: determineLevel(tech, nodeType),
            color: { border: getTechBorderColor(tech.techCategory) }
        });

        let prereqCopy = [];
        tech.prereqs.forEach(prereq => {
            if (prereq === "" || !isValidNode(nodeType, prereq)) {
                return;
            }
            prereqCopy.push(findTechByName(prereq));
        });

        prereqCopy.sort((a, b) => {
            const catA = a.techCategory === tech.techCategory;
            const catB = b.techCategory === tech.techCategory;
            if (catA && !catB) {
                return -1;
            }
            if (catB && !catA) {
                return 1;
            }

            return b.researchCost - a.researchCost;
        });

        if (dumpAllEdges) {
            prereqCopy.forEach((prereq, index) => {
                edges.push({
                    "from": prereq.dataName,
                    "to": tech.dataName
                });
            });

            return;
        }

        if (prereqCopy.length > 0) {
            edges.push({
                "from": prereqCopy[0].dataName,
                "to": tech.dataName
            });
        }

        prereqCopy.forEach((prereq, index) => {
            if (index !== -1) {
                lateEdges.push({
                    "from": prereq.dataName,
                    "to": tech.dataName
                });
            }
        });
    });
}

function isValidNode(validNodes, checkNode) {
    return validNodes.find(node => node.dataName === checkNode);
}

function determineLevel(tech, validNodes) {
    let validPrereqs = [];

    tech.prereqs.forEach(prereq => {
        if (prereq === "" || !isValidNode(validNodes, prereq)) {
            return;
        }
        validPrereqs.push(prereq);
    })

    if (validPrereqs.length === 0) {
        return 0;
    }

    let level = 0;
    validPrereqs.forEach(prereq => {
        let tech = findTechByName(prereq);
        if (!tech) {
            return;
        }
        level = Math.max(determineLevel(tech, validNodes) + 1, level);
    });
    return level;
}

function findTechByName(techName) {
    let tech = techTree.find(tech => tech.dataName === techName);
    return tech;
}

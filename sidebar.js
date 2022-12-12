class TechSidebar extends React.Component {
    constructor(props) {
        super(props)
        this.state = { node: {}, isolated: false, techTree: props.techTree, effects: props.effects };
    }

    findTechByName(techName) {
        return this.state.techTree.find(tech => tech.dataName === techName);
    }

    findEffectByName(effectName) {
        return this.state.effects.find(effect => effect.dataName === effectName);
    }

    findBlockingTechs(techToSearch) {
        return this.state.techTree.filter(tech => tech.prereqs.find(prereq => prereq === techToSearch.dataName));
    }

    findPrereqTechs(techToSearch) {
        return techToSearch.prereqs.filter(prereq => prereq !== "").map(prereq => {
            return this.state.techTree.find(tech => tech.dataName === prereq);
        });
    }

    getAncestorTechs(techToSearch) {
        return this.findPrereqTechs(techToSearch)
            .reduce((arr, curr) => arr.concat(this.getAncestorTechs(curr)), [])
            .concat(this.findPrereqTechs(techToSearch));
    }

    getDescendentTechs(techToSearch) {
        return this.findBlockingTechs(techToSearch)
            .reduce((arr, curr) => arr.concat(this.getDescendentTechs(curr)), [])
            .concat(this.findBlockingTechs(techToSearch));
    }

    getReadableFactionName(faction) {
        if (faction === "ResistCouncil") {
            return "The Resistance";
        } else if (faction === "DestroyCouncil") {
            return "Humanity First";
        } else if (faction === "ExploitCouncil") {
            return "The Initiative";
        } else if (faction === "EscapeCouncil") {
            return "Project Exodus";
        } else if (faction === "CooperateCouncil") {
            return "The Academy";
        } else if (faction === "AppeaseCouncil") {
            return "The Protectorate";
        } else if (faction === "SubmitCouncil") {
            return "The Servants";
        } else {
            return "Aliens";
        }
    }

    getReadableCountryName(countryCode) {

    }

    getReadableControlPointName(controlPointCode) {

    }

    getReadableEffect(effect) {
        const data = this.props.data
        if (!data[effect] || !data[effect].description) {
            return effect;
        }
        const effectObj = this.findEffectByName(effect);
        const effectQuantityString = effectObj ?
            effectObj.value + " (" + effectObj.operation.toLowerCase() + ")" : "";
        const effectTemplateString = data[effect].description
            .replace(/^-/g, "")
            .replace(/\{[0-9]*\}/g, effectQuantityString)
            .replace('<color=#FFFFFFFF><sprite name="mission_control">', "Mission Control")
            .replace('<color=#FFFFFFFF><sprite name="water"></color>', "Water")
            .replace('<color=#FFFFFFFF><sprite name="volatiles"></color>', "Volatiles")
            .replace('<color=#FFFFFFFF><sprite name="metal"></color>', "Metals")
            .replace('<color=#FFFFFFFF><sprite name="metal_noble"></color>', "Noble Metals")
            .replace('<color=#FFFFFFFF><sprite name="radioactive"></color>', "Fissiles");


        return effectTemplateString;
    }

    getReadableSummary() {
        const node = this.state.node;
        const data = this.props.data;

        if (!node || !data[node.dataName] || !data[node.dataName].summary) {
            return "";
        }

        if (data[node.dataName].summary.match(/<.*module>/)) {
            let summaryElements = [React.createElement(
                'p',
                null,
                data[node.dataName].summary.replace(/<.*module>/, "")
            )];

            const dataModules = findModule(node.dataName);
            dataModules.forEach(dataModule => {
                let icon = dataModule.iconResource ? dataModule.iconResource : dataModule.baseIconResource;
                summaryElements.push(React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'img',
                        { src: "./icons/" + icon + ".png" }
                    ),
                    React.createElement(
                        'pre',
                        null,
                        JSON.stringify(dataModule, null, 2)
                    )
                ));
            });
            return summaryElements;
        } else {
            return React.createElement(
                'p',
                null,
                data[node.dataName].summary
            );
        }
    }

    render() {
        const node = this.state.node;
        const data = this.props.data;

        if (!node || !node.dataName) {
            return React.createElement(
                "h2",
                null,
                "Error!"
            );
        }

        const isolateButton = React.createElement(
            MaterialUI.Button,
            {
                variant: "contained",
                onClick: event => {
                    let isolatedTree = this.getAncestorTechs(node).concat(this.getDescendentTechs(node)).concat(node);
                    isolatedTree = [...new Map(isolatedTree.map(v => [v.dataName, v])).values()];
                    parseSpecifiedNodes(isolatedTree, () => {
                        network.selectNodes([node.dataName]);
                        network.focus(node.dataName);
                        updateLocationHash(node.dataName);
                    });

                    this.setState({ isolated: true });
                },
                className: "topTechbarButton"
            },
            "See tree for this node"
        );

        const seeWholeTreeButton = React.createElement(
            MaterialUI.Button,
            {
                variant: "contained",
                onClick: event => {
                    this.setState({ isolated: false });
                    const showToggle = searchBox.state.showProjects;
                    if (showToggle) {
                        parseDefaults();
                    } else {
                        parseTechsOnly();
                    }
                },
                className: this.state.isolated ? "topTechbarButton" : "hideButton"
            },
            "See entire tree"
        );

        const doneButtonText = node.researchDone ? "Mark undone" : "Mark done";
        const markDone = React.createElement(
            MaterialUI.Button,
            {
                variant: "contained",
                onClick: event => {
                    if (node.researchDone) {
                        node.researchDone = false;
                    } else {
                        node.researchDone = true;
                        this.getAncestorTechs(node).forEach(tech => tech.researchDone = true);
                    }
                    this.setState({ node: node });
                    this.saveTechTree();
                },
                className: "topTechbarButton",
                color: node.researchDone ? "error" : "success"
            },
            doneButtonText
        );

        const friendlyName = node.friendlyName;

        const summaryLabel = React.createElement(
            "h4",
            null,
            "Summary"
        );
        const summaryText = this.getReadableSummary();

        const researchCost = node.researchCost ? node.researchCost : 0;
        const ancestorTree = this.getAncestorTechs(node);
        const ancestorTreeIds = ancestorTree.map(o => o.id);
        const uniqueAncestorTree = ancestorTree.filter(({ id }, index) => !ancestorTreeIds.includes(id, index + 1));
        const ancestorTreeProcessed = uniqueAncestorTree.filter(tech => !tech.researchDone);

        const treeCost = uniqueAncestorTree.reduce((acc, curr) => acc + (curr.researchCost ? curr.researchCost : 0), 0)
            + (node.researchDone ? 0 : researchCost);
        const treeCostProcessed = ancestorTreeProcessed.reduce((acc, curr) => acc + (curr.researchCost ? curr.researchCost : 0), 0)
            + (node.researchDone ? 0 : researchCost);
        const treeCostString = treeCost == treeCostProcessed ? treeCost.toLocaleString() : treeCostProcessed.toLocaleString() + "/" + treeCost.toLocaleString();

        const costText = [React.createElement(
            'h4',
            null,
            "Cost: ",
            researchCost.toLocaleString()
        ), React.createElement(
            'h5',
            null,
            "Total Tree Cost: ",
            treeCostString
        )];

        let resourceLabel, resourceText;
        if (node.resourcesGranted && node.resourcesGranted.filter(resource => resource.resource !== "").length > 0) {
            let resourceString = "";
            node.resourcesGranted.filter(resource => resource.resource !== "").forEach(resource => {
                resourceString += resource.resource + " (" + resource.value + ")";
            });

            resourceLabel = React.createElement(
                "h4",
                null,
                "Resources Granted"
            );

            resourceText = React.createElement(
                "p",
                null,
                resourceString
            );
        }

        let org;
        if (node.orgGranted && node.orgGranted !== "") {
            org = React.createElement(
                "h4",
                null,
                "Org granted: ",
                node.orgGranted
            );
        }

        let prereqsText, prereqsList;
        if (node.prereqs && node.prereqs.filter(prereq => prereq !== "").length > 0) {
            let prereqElements = [];
            node.prereqs.filter(prereq => prereq !== "").forEach(prereq => {
                let tech = this.findTechByName(prereq);
                prereqElements.push(
                    React.createElement(
                        MaterialUI.Button,
                        {
                            key: prereq,
                            onClick: () => {
                                this.setState({ node: tech });
                                network.selectNodes([prereq]);
                                network.focus(prereq);
                                updateLocationHash(prereq);
                            },
                            variant: "contained",
                            className: "prereqButton" + (tech.researchDone ? " researchDone" : ""),
                            size: "small",
                            title: tech.isProject ? "Faction Project" : "Global Research",
                            'aria-label': tech ? (tech.friendlyName + " "  + (tech.isProject ? "Faction Project" : "Global Research")) : "",
                            color: tech.isProject ? "success" : "primary"
                        },
                        tech ? tech.friendlyName : ""
                    )
                );
            });


            prereqsText = React.createElement(
                "h4",
                null,
                "Required Research"
            );

            prereqsList = React.createElement(
                "div",
                { className: "hideBullets" },
                prereqElements
            );
        }

        let blockingText, blockingList;
        let blockingTechs = this.findBlockingTechs(node);
        if (blockingTechs.length > 0) {
            let blockerElements = [];
            blockingTechs.forEach(blocked => {
                blockerElements.push(
                    React.createElement(
                        MaterialUI.Button,
                        {
                            key: blocked.dataName,
                            onClick: () => {
                                this.setState({ node: blocked });
                                if (network.body.nodes[blocked.dataName]) {
                                    network.selectNodes([blocked.dataName]);
                                    network.focus(blocked.dataName);
                                    updateLocationHash(blocked.dataName);
                                }
                            },
                            variant: "contained",
                            className: "prereqButton",
                            size: "small",
                            title: blocked.isProject ? "Faction Project" : "Global Research",
                            'aria-label': blocked ? (blocked.friendlyName + " "  + (blocked.isProject ? "Faction Project" : "Global Research")) : "",
                            color: blocked.isProject ? "success" : "primary"
                        },
                        blocked.friendlyName
                    )

                );
            });


            blockingText = React.createElement(
                "h4",
                null,
                "Unblocks Research"
            );

            blockingList = React.createElement(
                "div",
                { className: "hideBullets" },
                blockerElements
            );
        }

        let milestones;
        if (node.requiredMilestone && node.requiredMilestone !== "") {
            milestones = React.createElement(
                "h4",
                null,
                "Milestones Needed: ",
                node.requiredMilestone
            );
        }

        let requiredObjectives;
        if (node.requiredObjectiveNames && node.requiredObjectiveNames.filter(objective => objective !== "").length > 0) {
            let objString = node.requiredObjectiveNames.filter(objective => objective !== "").join(", ");

            requiredObjectives = React.createElement(
                "h4",
                null,
                "Objectives Required: ",
                objString
            );
        }

        let factionReq;
        if (node.factionPrereq && node.factionPrereq.filter(faction => faction !== "").length > 0) {
            let factionString = node.factionPrereq.filter(faction => faction !== "")
                .map(this.getReadableFactionName).join(", ");

            factionReq = React.createElement(
                "h4",
                null,
                "Only Available to Factions: ",
                factionString
            );
        }

        let nationReq;
        if (node.requiresNation && node.requiresNation !== "") {
            nationReq = React.createElement(
                "h4",
                null,
                "Required Nations: ",
                node.requiresNation
            );
        }

        let regionReq;
        if (!nationReq && node.requiredControlPoint && node.requiredControlPoint.filter(region => region !== "").length > 0) {
            let regionString = node.requiredControlPoint.filter(region => region !== "").join(", ");

            regionReq = React.createElement(
                "h4",
                null,
                "Required Control Points: ",
                regionString
            );
        }

        let effectDescription, effectList;
        if (node.effects && node.effects.filter(effect => effect !== "").length > 0) {
            let effectElements = node.effects.filter(effect => effect !== "").map(effect => {
                return React.createElement(
                    "li",
                    { key: effect },
                    this.getReadableEffect(effect)
                );
            });

            effectDescription = React.createElement(
                "h4",
                null,
                "Effects"
            );
            effectList = React.createElement(
                "ul",
                null,
                effectElements
            );
        }

        let completionLabel, completionText;
        if (data[node.dataName] && data[node.dataName].description) {
            completionLabel = React.createElement(
                'h4',
                null,
                "Completion Text"
            );

            completionText = React.createElement(
                'p',
                null,
                data[node.dataName].description
            );
        }

        return React.createElement(
            MaterialUI.Paper,
            { elevation: 3, id: "sidebar-react" },

            // Controls
            isolateButton,
            seeWholeTreeButton,
            markDone,

            // Heading
            React.createElement(
                "h2",
                null,
                friendlyName
            ),
            costText,

            // Requirements
            prereqsText,
            prereqsList,
            blockingText,
            blockingList,
            milestones,
            requiredObjectives,
            factionReq,
            nationReq,
            regionReq,

            // Summary
            summaryLabel,
            summaryText,

            // Rewards
            resourceLabel,
            resourceText,
            org,

            effectDescription,
            effectList,

            // Completion
            completionLabel,
            completionText
        );
    }

    saveTechTree() {
        let trimmedTechTree = {};
        techTree.forEach(tech => {
            trimmedTechTree[tech.dataName] = {
                'researchDone': !!tech.researchDone
            }
        });
        localStorage.techTree = JSON.stringify(trimmedTechTree);
    }
}


class Searchbox extends React.Component {
    constructor(props) {
        super(props);
        this.state = { results: [], showProjects: true };
    }

    componentDidMount() {
    }

    componentDidUpdate() {

    }

    render() {
        return React.createElement(
            MaterialUI.Paper,
            { elevation: 3, id: "searchBox" },
            React.createElement(
                MaterialUI.Autocomplete,
                {
                    options: this.state.results,
                    renderInput: (params) => {
                        params.label = "Search";
                        params.ref = inputEl => { this.searchInput = inputEl };
                        params.autoFocus = true;

                        return React.createElement(
                            MaterialUI.TextField,
                            params
                        )
                    },
                    freeSolo: true,
                    onInputChange: (event, value) => {
                        const results = documentSearchIndex.search(value, { pluck: "friendlyName", enrich: true }).map(result => result.doc.friendlyName);
                        this.setState({ results: results });
                    },
                    onChange: (event, value) => {
                        showSidebar();

                        let navigateToNode = techTree.find(tech => tech.friendlyName === value);
                        techSidebar.setState({ node: navigateToNode });

                        if (navigateToNode && network.body.nodes[navigateToNode.dataName]) {
                            network.selectNodes([navigateToNode.dataName]);
                            network.focus(navigateToNode.dataName);
                            updateLocationHash(navigateToNode.dataName);
                        }
                    }
                }
            ),
            React.createElement(
                MaterialUI.FormControlLabel,
                {
                    label: "Show Projects",
                    control: React.createElement(
                        MaterialUI.Switch,
                        {
                            defaultChecked: true,
                            onChange: (event) => {
                                const showToggle = event.target.checked;
                                if (showToggle) {
                                    this.setState({ showProjects: true });
                                    parseDefaults();
                                } else {
                                    this.setState({ showProjects: false });
                                    parseTechsOnly();
                                }
                            }
                        }
                    ),
                    id: "showProjects"
                }
            ),
            React.createElement(
                MaterialUI.Button,
                {
                    variant: "contained",
                    onClick: event => {
                        let input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = _ => {
                            let reader = new FileReader();

                            reader.onload = (event) => {
                                let compressedData = new Uint8Array(event.target.result);
                                let saveData, saveState, finishedTechs, finishedProjects;

                                try {
                                    saveData = pako.ungzip(compressedData, {to: "string"});
                                } catch {
                                    alert("Failed to unpack save data - it should be a gzipped file with a '.gz' extension");
                                    return;
                                }
                                try {
                                    saveState = JSON5.parse(saveData);
                                    finishedTechs = saveState.gamestates["PavonisInteractive.TerraInvicta.TIGlobalResearchState"][0].Value.finishedTechsNames;
                                    finishedProjects = saveState.gamestates["PavonisInteractive.TerraInvicta.TIFactionState"][0].Value.finishedProjectNames;
                                } catch {
                                    alert("Failed to parse JSON save data - your save file might be corrupted?");
                                    return;
                                }

                                let finishedTechsAndProjects = new Set(finishedTechs.concat(finishedProjects));
                                techTree.forEach(tech => {
                                    if (finishedTechsAndProjects.has(tech.dataName)) {
                                        tech.researchDone = true;
                                        finishedTechsAndProjects.delete(tech.dataName);
                                    } else {
                                        tech.researchDone = false;
                                    };
                                });

                                if (finishedTechsAndProjects.size != 0){
                                    alert("Some technologies weren't recognised:\n" + Array.from(finishedTechsAndProjects).join('\n'));
                                } else {
                                    alert("Successfully loaded " + (finishedTechs.length + finishedProjects.length) + " techs")
                                };

                                saveTechTree();
                            };

                            reader.readAsArrayBuffer(input.files[0])
                        };
                        input.click();
                    },
                    className: "readFileButton"
                },
                "Parse Save File"
            )
        )
    }
}

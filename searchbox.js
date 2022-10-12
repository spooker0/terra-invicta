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
                        let results = searchIndex.search(value, { expand: true }).map(result => searchIndex.documentStore.getDoc(result.ref).friendlyName);
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
            )
        )
    }
}
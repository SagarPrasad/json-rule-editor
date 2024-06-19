import { sortBy } from 'lodash/collection';
import { has } from 'lodash/object';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { PLACEHOLDER } from '../../constants/data-types';
import ApperanceContext from '../../context/apperance-context';
import operator from '../../data-objects/operator.json';
import { transformTreeToRule } from '../../utils/transform';
import { getNodeDepth, getNodeDepthDetails } from '../../utils/treeutils';
import decisionValidations, { validateAttribute } from '../../validations/decision-validation';
import Button from '../button/button';
import ButtonGroup from '../button/button-groups';
import Dialog from '../forms/dialog';
import InputField from '../forms/input-field';
import SelectField from '../forms/selectmenu-field';
import Panel from '../panel/panel';
import Tree from '../tree/tree';

const nodeStyle ={
    shape: 'circle',
    shapeProps: {
        fill: '#1ABB9C',
        r: 10,
    },
  };

const factsButton = [{ label : 'Add Facts', disable: false },
                     { label : 'Add All', disable: false },
                     { label : 'Add Any', disable: false },
                     { label : 'Remove', disable: false }];

const topLevelOptions = [{ label : 'All', active: false, disable: false },
                         { label : 'Any', active: false, disable: false }];

const outcomeOptions = [{ label : 'Add Outcome', active: false, disable: false },
                        { label : 'Edit Conditions', active: false, disable: false }];

class AddDecision extends Component {
    constructor(props) {
        super(props);

        const outcome = props.editDecision ? props.outcome : ({ value: '', error: {}, params: []});
        const addAttribute = { error: {}, name: '', operator: '', value: ''};
        const node = props.editDecision ? props.editCondition.node : {};
        const activeNode = { index: 0, depth: 0 };

        this.state = { attributes: props.attributes,
             outcome,
             addAttribute,
             enableTreeView: props.editDecision, 
             enableFieldView: false,
             enableOutcomeView: false,
             node,
             topLevelOptions,
             factsButton: factsButton.map(f => ({ ...f, disable: true })),
             outcomeOptions: outcomeOptions.map(f => ({ ...f, disable: true })),
             formError: '',
             addPathflag: false,
             showDialog: false,
             jsonInput:'',
             paths:[],
             selectedPath:'',
             activeNodeDepth: [activeNode] };
        this.handleAdd = this.handleAdd.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.onChangeNewFact = this.onChangeNewFact.bind(this);
        this.onChangeOutcomeValue = this.onChangeOutcomeValue.bind(this);
        this.handleTopNode = this.handleTopNode.bind(this);
        this.handleActiveNode = this.handleActiveNode.bind(this);
        this.handleChildrenNode = this.handleChildrenNode.bind(this);
        this.handleFieldCancel = this.handleFieldCancel.bind(this);
        this.handleOutputPanel = this.handleOutputPanel.bind(this);
        this.handleOutputParams = this.handleOutputParams.bind(this);
        this.addParams = this.addParams.bind(this);
        this.addPath = this.addPath.bind(this);
        this.handleClickOpen = this.handleClickOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleJsonInputChange = this.handleJsonInputChange.bind(this);
        this.extractPathsFromJson = this.extractPathsFromJson.bind(this);
        this.handlePathSelect = this.handlePathSelect.bind(this);
        this.getAllPaths = this.getAllPaths.bind(this);
    }


    handleAdd(e) {
        e.preventDefault();
        const error = decisionValidations(this.state.node, this.state.outcome);

        if (error.formError) {
            this.setState({ formError: error.formError, outcome: { ...this.state.outcome, error: error.outcome } });
        } else {
            let outcomeParams = {};
            this.state.outcome.params.forEach(param => {
                outcomeParams[param.pkey] = param.pvalue;
            });
            const condition = transformTreeToRule(this.state.node, this.state.outcome, outcomeParams);
            this.props.addCondition(condition);
        }
    }

    handleCancel() {
        this.props.cancel();
    }

    onChangeNewFact(e, name) {
        const addAttribute = { ...this.state.addAttribute };
        addAttribute[name] = e.target.value;
        this.setState({ addAttribute });
    }

    onChangeOutcomeValue(e, type) {
        const outcome = { ...this.state.outcome };
        outcome[type] = e.target.value;
        this.setState({ outcome });
    }

    addParams() {
        const { outcome } = this.state;
        const newParams = outcome.params.concat({ pkey: '', pvalue: '' });
        this.setState({ outcome: { ...outcome, params: newParams } });
    }

    
    handleOutputParams(e, type, index) {
        const { outcome } = this.state;
        const params = [...outcome.params];
        const newParams = params.map((param, ind) => {
            if (index === ind) {
                if (type === 'pkey') {
                    return { ...param, pkey: e.target.value };
                } else {
                    return { ...param, pvalue: e.target.value };
                }
            }
            return param;
        });
        this.setState({ outcome: { ...outcome, params: newParams } });
    }

    handleTopNode(value) {
        let parentNode = { ...this.state.node };
        const activeNode = { index: 0, depth: 0 };
        if (has(parentNode, 'name')) {
            parentNode.name = value === 'All' ? 'all' : 'any';
        } else {
            parentNode = { name: value === 'All' ? 'all' : 'any', nodeSvgShape: nodeStyle, children: [] };
        }
        const topLevelOptions = this.state.topLevelOptions.map(option => {
            if (option.label === value) {
                return { ...option, active: true };
            }
            return { ...option, active: false };
        });

        const factsButton = this.state.factsButton.map(button => ({ ...button, disable: false }));
        const outcomeOptions = this.state.outcomeOptions.map(button => ({ ...button, disable: false }));

        this.setState({ enableTreeView: true, topNodeName: value, node: parentNode, activeNodeDepth: [activeNode], topLevelOptions, factsButton, outcomeOptions });
    }

    mapNodeName(val) {
        const node = {};
        const { addAttribute: { name, operator, value, path }, attributes } = this.state;
        if (val === 'Add All' || val === 'Add Any') {
            node['name'] = val === 'Add All' ? 'all' : 'any';
            node['nodeSvgShape'] = nodeStyle;
            node['children'] = [];
        } else {
            node['name'] = name;
            let factValue = value.trim();
            const attProps = attributes.find(att => att.name === name);
            if (attProps.type === 'number') {
                factValue = Number(value.trim());
            }
            let fact = { [operator]: factValue };
            if (path) {
                fact['path'] = `.${path}`;
            }
            node['attributes'] = { ...fact };
        }
        return node;
    }

    handleChildrenNode(value) {
        let factOptions = [...this.state.factsButton];
        if (value === 'Add Facts') {
            this.setState({ enableFieldView: true });
        } else {
            const { activeNodeDepth, node, attributes } = this.state;
            const addAttribute = { error: {}, name: '', operator: '', value: '' };
            if (value === 'Add fact node') {
                const error = validateAttribute(this.state.addAttribute, attributes);
                if (Object.keys(error).length > 0) {
                    let addAttribute = this.state.addAttribute;
                    addAttribute.error = error;
                    this.setState({ addAttribute });
                    return undefined;
                }
            }
            if (activeNodeDepth && node) {
                const newNode = { ...node };

                const getActiveNode = (pNode, depthIndex) => pNode[depthIndex];

                let activeNode = newNode;
                const cloneDepth = value === 'Remove' ? activeNodeDepth.slice(0, activeNodeDepth.length - 1) : [...activeNodeDepth];
                cloneDepth.forEach(nodeDepth => {
                    if (nodeDepth.depth !== 0) {
                        activeNode = getActiveNode(activeNode.children, nodeDepth.index);
                    }
                });
                const childrens = activeNode['children'] || [];
                if (value !== 'Remove') {
                    activeNode['children'] = childrens.concat(this.mapNodeName(value));
                } else {
                    const lastNode = activeNodeDepth[activeNodeDepth.length - 1];
                    childrens.splice(lastNode.index, 1);
                    factOptions = this.state.factsButton.map(button => ({ ...button, disable: true }));
                }

                this.setState({ node: newNode, enableFieldView: false, addAttribute, factsButton: factOptions });
            }
        }
    }

    handleActiveNode(node) {
        const depthArr = getNodeDepthDetails(node);
        const sortedArr = sortBy(depthArr, 'depth');

        const factsNodemenu = this.state.factsButton.map(button => {
            if (button.label !== 'Remove') {
                return { ...button, disable: true };
            }
            return { ...button, disable: false };
        });

        const parentNodeMenu = this.state.factsButton.map(button => {
            if (sortedArr.length < 1 && button.label === 'Remove') {
                return { ...button, disable: true };
            }
            return { ...button, disable: false };
        });

        const mergedMenu = sortedArr.length > 0 ? parentNodeMenu : factsNodemenu;
        this.setState({ factsButton: mergedMenu, activeNodeDepth: sortedArr });
    }

    handleFieldCancel() {
        const addAttribute = { error: {}, name: '', operator: '', value: '' };
        this.setState({ enableFieldView: false, addAttribute });
    }

    handleOutputPanel(value) {
        if (value === 'Add Outcome') {
            const factsOptions = this.state.factsButton.map(fact => ({ ...fact, disable: true }));
            const options = this.state.outcomeOptions.map(opt => {
                if (opt.label === 'Add Outcome') {
                    return { ...opt, active: true };
                }
                return { ...opt, active: false };
            });
            this.setState({
                enableOutcomeView: true,
                enableTreeView: false,
                enableFieldView: false,
                outcomeOptions: options,
                factsButton: factsOptions
            });
        }
        if (value === 'Edit Conditions') {
            const options = this.state.outcomeOptions.map(opt => {
                if (opt.label === 'Edit Conditions') {
                    return { ...opt, active: true };
                }
                return { ...opt, active: false };
            });
            this.setState({ enableOutcomeView: false, enableTreeView: true, enableFieldView: false, outcomeOptions: options });
        }
    }

    topPanel() {
        const { topLevelOptions, factsButton, outcomeOptions } = this.state;

        return (
            <div className="add-decision-step">
                <div className="step1">
                    <div>Step 1: Add Toplevel</div>
                    <ButtonGroup buttons={topLevelOptions} onConfirm={this.handleTopNode} />
                </div>
                <div className="step2">
                    <div>Step 2: Add / Remove facts</div>
                    <ButtonGroup buttons={factsButton} onConfirm={this.handleChildrenNode} />
                </div>
                <div className="step3">
                    <div>Step 3: Add Outcome</div>
                    <ButtonGroup buttons={outcomeOptions} onConfirm={this.handleOutputPanel} />
                </div>
            </div>
        );
    }

    handleClickOpen() {
        this.setState({ showDialog: true });
    }

    handleClose() {
        this.setState({ showDialog: false });
    }

    handleJsonInputChange(e) {
        this.setState({ jsonInput: e.target.value });
    }

    extractPathsFromJson() {
        try {
            const json = JSON.parse(this.state.jsonInput);
            const paths = this.getAllPaths(json);
            this.setState({ paths });
        } catch (error) {
            console.error('Invalid JSON input:', error);
            this.setState({ paths: [] });
        }
    }

    handlePathSelect(e) {
        this.setState({ selectedPath: e.target.value });
    }
    
    addPath() {
        this.setState({ addPathflag: true, showDialog: false });
        const userInput = this.state.jsonInput;
        try {
            const jsonInput = JSON.parse(userInput);
            const paths = this.getAllPaths(jsonInput);
            console.log('All paths:', paths);
        } catch (error) {
            console.error('Invalid JSON input:', error);
        }
    }

    // getAllPaths(obj, currentPath = '') {
    //     let paths = [];

    //     for (let key in obj) {
    //         if (obj.hasOwnProperty(key)) {
    //             const value = obj[key];
    //             const newPath = currentPath ? `${currentPath}.${key}` : key;
    //             paths.push(newPath);
    //             if (typeof value === 'object' && value !== null) {
    //                 paths = paths.concat(this.getAllPaths(value, newPath));
    //             }
    //         }
    //     }

    //     return paths;
    // }

    getAllPaths = (obj, currentPath = '') => {
        let paths = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newPath = currentPath ? `${currentPath}.${key}` : key;
                paths.push(newPath);

                if (Array.isArray(value)) {
                    const arrayPath = `${newPath}[*]`;
                    paths.push(arrayPath);

                    value.forEach((item, index) => {
                        if (typeof item === 'object' && item !== null) {
                            paths = paths.concat(this.getAllPaths(item, `${arrayPath}`));
                        }
                    });
                } else if (typeof value === 'object' && value !== null) {
                    paths = paths.concat(this.getAllPaths(value, newPath));
                }
            }
        }
        return paths;
    }

    
    handleInputChange = (event) => {
        this.setState({ jsonInput: event.target.value });
    }


    fieldPanel() {
        const { attributes, addAttribute, addPathflag } = this.state;
        const attributeOptions = attributes.map(attr => attr.name);
        const attribute = addAttribute.name && attributes.find(attr => attr.name === addAttribute.name);
        const operatorOptions = attribute && operator[attribute.type];
        const { background } = this.context;

        const placeholder = addAttribute.operator === 'between' ? PLACEHOLDER['Between'] : PLACEHOLDER[attribute.type];

        return (
            <Panel>
                <div className={`attributes-header ${background}`}>
                    <div className="attr-link" onClick={this.handleClickOpen}>
                        <span className="plus-icon" /><span className="text">Add Path</span>
                    </div>
                    <Dialog open={this.state.showDialog} onClose={this.handleClose}>
                        <div style={{ textAlign: 'center' }}>
                            <textarea
                                value={this.state.jsonInput}
                                onChange={this.handleJsonInputChange}
                                placeholder="Input your JSON"
                                style={{ width: '80%', height: '100px', marginBottom: '10px' }}
                            />
                            <br />
                            <button onClick={this.extractPathsFromJson} style={{ marginBottom: '10px' }}>
                                Extract Paths
                            </button>
                            {/* {this.state.paths.length > 0 && (
                                <select onChange={this.handlePathSelect} value={this.state.selectedPath} style={{ marginBottom: '10px' }}>
                                    {this.state.paths.map((path, index) => (
                                        <option key={index} value={path}>{path}</option>
                                    ))}
                                </select>
                            )} */}
                            <div className="attr-link" onClick={this.addPath} style={{ display: 'inline-block', cursor: 'pointer' }}>
                                <span className="plus-icon"></span><span className="text">Choose Path</span>
                            </div>
                        </div>
                    </Dialog>
                </div>

                <div className="add-field-panel">
                    <div>
                        <SelectField options={attributeOptions} onChange={(e) => this.onChangeNewFact(e, 'name')}
                            value={addAttribute.name} error={addAttribute.error.name} label="Facts" />
                    </div>
                    <div>
                        <SelectField options={operatorOptions} onChange={(e) => this.onChangeNewFact(e, 'operator')}
                            value={addAttribute.operator} error={addAttribute.error.operator} label="Operator" />
                    </div>
                    {!["empty", "not_empty"].includes(addAttribute.operator) && (
                        <div>
                            <InputField
                                onChange={(value) => this.onChangeNewFact(value, 'value')}
                                value={addAttribute.value}
                                error={addAttribute.error.value}
                                label="Value"
                                placeholder={placeholder}
                            />
                        </div>
                    )}
                </div>

                {addPathflag && this.state.paths.length > 0 && (
                    <div className="add-field-panel half-width">
                        <div>
                            <SelectField options={this.state.paths} onChange={(e) => this.onChangeNewFact(e, 'path')} value={addAttribute.path} label="Path">
                                {this.state.paths.map((path, index) => (
                                    <option key={index} value={path}>{path}</option>
                                ))}
                            </SelectField>
                        </div>
                    </div>
                )}
                <div className="btn-group">
                    <Button label={'Add'} onConfirm={() => this.handleChildrenNode('Add fact node')} classname="btn-toolbar" type="submit" />
                    <Button label={'Cancel'} onConfirm={this.handleFieldCancel} classname="btn-toolbar" />
                </div>
            </Panel>
        );
    }

    outputPanel() {
        const { outcome } = this.state;
        const { editDecision } = this.props;
        const { background } = this.context;

        return (<Panel>
            <div className={`attributes-header ${background}`}>
                    <div className="attr-link" onClick={this.addParams}>
                        <span className="plus-icon" /><span className="text">Add Params</span> 
                    </div>
            </div>
            <div className="add-field-panel half-width">
                <div>
                    <InputField onChange={(value) => this.onChangeOutcomeValue(value, 'value')} value={outcome.value}
                        error={outcome.error && outcome.error.value} label="Type" readOnly={editDecision}/>
                </div>
            </div>
            <div>
                { outcome.params.length > 0 && outcome.params.map((param, ind) => 
                    (<div key={ind} className="add-field-panel">
                        <InputField onChange={(value) => this.handleOutputParams(value, 'pkey', ind)} value={param.pkey} label="key" />
                        <InputField onChange={(value) => this.handleOutputParams(value, 'pvalue', ind)} value={param.pvalue} label="Value" />
                    </div>)) } 
            </div>
        </Panel>)
    }

    treePanel() {
        const { node } = this.state;
        const depthCount = getNodeDepth(node);

        return(<Panel>
                <Tree treeData={node} count={depthCount} onConfirm={this.handleActiveNode} />
            </Panel>)
    }


    addPanel() {
        const { enableTreeView, enableFieldView, enableOutcomeView } = this.state;

        return (<div>
            {this.topPanel()}
            {enableFieldView && this.fieldPanel()}
            {enableOutcomeView && this.outputPanel()}
            {enableTreeView && this.treePanel()}
        </div>);

    }

    render() {
        const { buttonProps } = this.props;

        return (
            <form>
                <div className="add-rulecase-wrapper">
                    {this.addPanel()}
                    {this.state.formError && <p className="form-error"> {this.state.formError}</p>}
                    <div className="btn-group">
                        <Button label={buttonProps.primaryLabel} onConfirm={this.handleAdd} classname="primary-btn" type="submit" />
                        <Button label={buttonProps.secondaryLabel} onConfirm={this.handleCancel} classname="cancel-btn"/>
                    </div>
                    
                </div>
            </form>
        );
    }
}

AddDecision.contextType = ApperanceContext;

AddDecision.defaultProps = ({
    addCondition: () => false,
    cancel: () => false,
    attribute: {},
    buttonProps: {},
    attributes: [],
    outcome: {},
    editDecision: false,
    editCondition: {}
});

AddDecision.propTypes = ({
    addCondition: PropTypes.func,
    cancel: PropTypes.func,
    attribute: PropTypes.object,
    buttonProps: PropTypes.object,
    attributes: PropTypes.array,
    outcome: PropTypes.object,
    editDecision: PropTypes.bool,
    editCondition: PropTypes.object
});


export default AddDecision;
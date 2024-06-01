
/* eslint-disable no-undef */
import { groupBy } from 'lodash/collection';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SweetAlert from 'react-bootstrap-sweetalert';
import { connect } from 'react-redux';
import { handleAttribute } from '../../actions/attributes';
import { handleDecision } from '../../actions/decisions';
import Attributes from '../../components/attributes/attributes';
import Decisions from '../../components/decisions/decision';
import RuleErrorBoundary from '../../components/error/ruleset-error';
import Banner from '../../components/panel/banner';
import Tabs from '../../components/tabs/tabs';
import PageTitle from '../../components/title/page-title';
import ValidateRules from '../../components/validate/validate-rules';
import * as Message from '../../constants/messages';

const tabs = [{name: 'Facts'}, {name: 'Decisions'}, {name: 'Validate'}, {name: 'Generate'}];
class RulesetContainer extends Component {

    constructor(props) {
        super(props);
        this.state = {activeTab: 'Facts', generateFlag: false };
        this.generateFile = this.generateFile.bind(this);
        this.cancelAlert = this.cancelAlert.bind(this);
    }

    handleTab = (tabName) => {
        this.setState({activeTab: tabName});
    }

    generateFile() {
      const { ruleset } = this.props;
    
      // Make a copy of the ruleset to avoid mutating the original props
      const modifiedRuleset = { ...ruleset };
    
      // Recursive function to transform conditions
      const transformConditions = (conditions) => {
        if (!conditions) return null;
    
        if (conditions.all) {
          return {
            type: 'all',
            children: conditions.all.map(condition => transformCondition(condition))
          };
        } else if (conditions.any) {
          return {
            type: 'any',
            children: conditions.any.map(condition => transformCondition(condition))
          };
        } else {
          return null;
        }
      };
      // Function to transform an individual condition
      const transformCondition = (condition) => {
        if (condition.fact && condition.operator) {
          return {
            path: condition.fact,
            type: condition.operator,   
            value: condition.value
          };
        } else {
          // Handle nested conditions
          return transformConditions(condition);
        }
      };
    
      // Transform the conditions structure in the decisions array
      if (modifiedRuleset.decisions) {
        modifiedRuleset.decisions = modifiedRuleset.decisions.map(decision => {
          if (decision.conditions) {
            return {
              ...decision,
              conditions: transformConditions(decision.conditions)
            };
          }
          return decision;
        });
      }
    
      // Extract only the conditions part
      const conditionsOnly = modifiedRuleset.decisions.map(decision => decision.conditions)[0]; // Accessing the first (and only) object
      
      // Convert only the conditions part to JSON string
      const fileData = JSON.stringify(conditionsOnly, null, '\t');
      console.log(fileData); // This will log the final JSON format with only the conditions part
    
      const blob = new Blob([fileData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = modifiedRuleset.name + '.json';
      link.href = url;
      link.click();
      this.setState({ generateFlag: true });
    }
    
    cancelAlert() {
      this.setState({ generateFlag: false })
    }

    successAlert = () => {
      const { name } = this.props.ruleset;
      return (<SweetAlert
          success
          title={"File generated!"}
          onConfirm={this.cancelAlert}
        > {`${name} rule is succefully generated at your default download location`}
        </SweetAlert>);
    }

    render() {
      const { attributes, decisions, name } = this.props.ruleset;

      const indexedDecisions = decisions && decisions.length > 0 && 
          decisions.map((decision, index) => ({ ...decision, index }));
  
      let outcomes;
      if (indexedDecisions && indexedDecisions.length > 0) {
          outcomes = groupBy(indexedDecisions, data => data.event.type);
      }

      const message = this.props.updatedFlag ? Message.MODIFIED_MSG : Message.NO_CHANGES_MSG;
  
      return <div>
        <RuleErrorBoundary>
          <PageTitle name={name} />
          <Tabs tabs={tabs} onConfirm={this.handleTab} activeTab={this.state.activeTab} />
          <div className="tab-page-container">
              {this.state.activeTab === 'Facts' && <Attributes attributes={attributes} 
                handleAttribute={this.props.handleAttribute }/>}
              {this.state.activeTab === 'Decisions' && <Decisions decisions={indexedDecisions || []} attributes={attributes}
              handleDecisions={this.props.handleDecisions} outcomes={outcomes}/>}
              {this.state.activeTab === 'Validate' && <ValidateRules attributes={attributes} decisions={decisions} />}
              {this.state.activeTab === 'Generate' && <Banner message={message} ruleset={this.props.ruleset} onConfirm={this.generateFile}/> }
              {this.state.generateFlag && this.successAlert()}
          </div>
        </RuleErrorBoundary>
      </div>
    }
}

RulesetContainer.propTypes = {
  ruleset: PropTypes.object,
  handleAttribute: PropTypes.func,
  handleDecisions: PropTypes.func,
  updatedFlag: PropTypes.bool,
  runRules: PropTypes.func,
}

RulesetContainer.defaultProps = {
  ruleset: {},
  handleAttribute: () => false,
  handleDecisions: () => false,
  updatedFlag: false,
}

const mapStateToProps = (state) => ({
  ruleset: state.ruleset.rulesets[state.ruleset.activeRuleset],
  updatedFlag: state.ruleset.updatedFlag,
});

const mapDispatchToProps = (dispatch) => ({
  handleAttribute: (operation, attribute, index) => dispatch(handleAttribute(operation, attribute, index)),
  handleDecisions: (operation, decision) => dispatch(handleDecision(operation, decision)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RulesetContainer);
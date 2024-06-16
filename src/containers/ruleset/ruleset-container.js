
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
      const modifiedRuleset = { ...ruleset };
    
      const fileData1 = JSON.stringify(ruleset, null, '\t');
      const blob1 = new Blob([fileData1], { type: "application/json" });
      const url1 = URL.createObjectURL(blob1);
      const link1 = document.createElement('a');
      link1.download = ruleset.name + '_upload.json';
      link1.href = url1;
      link1.click();
    
      this.setState({ generateFlag: true });
    
      const transformConditions = (conditions) => {
        if (!conditions) return null;
    
        if (conditions.all) {
          return {
            type: 'and',
            children: conditions.all.map(condition => transformCondition(condition))
          };
        } else if (conditions.any) {
          return {
            type: 'or',
            children: conditions.any.map(condition => transformCondition(condition))
          };
        } else {
          return null;
        }
      };
    
      const transformCondition = (condition) => {
        if (condition.fact && condition.operator) {
          let value = condition.value;
          if (Array.isArray(value) && value.length > 1) {
            return {
              //fact: condition.fact,
              type: condition.operator,
              path: condition.path,
              values: value
            };
          } else {
            return {
              //fact: condition.fact,
              type: condition.operator,
              path: condition.path,
              value: value
            };
          }
        } else {
          return transformConditions(condition);
        }
      };
    
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
    
      const conditionsOnly = modifiedRuleset.decisions.map(decision => decision.conditions)[0];
      
      const fileData2 = JSON.stringify(conditionsOnly, null, '\t');
      console.log(fileData2);
    
      const blob2 = new Blob([fileData2], { type: "application/json" });
      const url2 = URL.createObjectURL(blob2);
      const link2 = document.createElement('a');
      link2.download = modifiedRuleset.name + '.json';
      link2.href = url2;
      link2.click();
      
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
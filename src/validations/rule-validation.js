import { Engine } from 'json-rules-engine';

// Function to add custom operators to the rules engine
const addCustomOperators = (engine) => {
  engine.addOperator('equals', (factValue, jsonValue) => factValue === jsonValue);

  engine.addOperator('not_equals', (factValue, jsonValue) => factValue !== jsonValue);

  engine.addOperator('less_than', (factValue, jsonValue) => factValue < jsonValue);

  engine.addOperator('less_than_equals', (factValue, jsonValue) => factValue <= jsonValue);

  engine.addOperator('greater_than', (factValue, jsonValue) => factValue > jsonValue);

  engine.addOperator('greater_than_equals', (factValue, jsonValue) => factValue >= jsonValue);

  engine.addOperator('between', (factValue, [min, max]) => factValue >= min && factValue <= max);

  engine.addOperator('empty', (factValue) => {
    return factValue === undefined || factValue === null || factValue === '';
  });

  engine.addOperator('not_empty', (factValue) => {
    return factValue !== undefined && factValue !== null && factValue !== '';
  });

  engine.addOperator('starts_with', (factValue, jsonValue) => {
    if (typeof factValue !== 'string' || typeof jsonValue !== 'string') {
      return false;
    }
    return factValue.startsWith(jsonValue);
  });

  engine.addOperator('ends_with', (factValue, jsonValue) => {
    if (typeof factValue !== 'string' || typeof jsonValue !== 'string') {
      return false;
    }
    return factValue.endsWith(jsonValue);
  });

  engine.addOperator('matches', (factValue, jsonValue) => {
    const re = new RegExp(jsonValue);
    return re.test(factValue);
  });

  engine.addOperator('exists', (factValue) => factValue !== undefined && factValue !== null);

  engine.addOperator('not_exists', (factValue) => factValue === undefined || factValue === null);

  engine.addOperator('contains_any', (factValue, jsonValue) => jsonValue.some(val => factValue.includes(val)));

  engine.addOperator('contains_all', (factValue, jsonValue) => jsonValue.every(val => factValue.includes(val)));

  engine.addOperator('in', (factValue, jsonValue) => jsonValue.includes(factValue));

  engine.addOperator('not_in', (factValue, jsonValue) => !jsonValue.includes(factValue));
  
  engine.addOperator('and', (factValue, jsonValue) => Array.isArray(jsonValue));

  engine.addOperator('or', (factValue, jsonValue) => Array.isArray(jsonValue));
  
  engine.addOperator('not', (factValue, jsonValue) => Array.isArray(jsonValue));
};

// Function to process the rules engine with given facts and conditions
export const processEngine = (facts, conditions) => {
  const engine = new Engine(conditions);
  addCustomOperators(engine);

  return engine.run(facts)
    .then(results => results.events)
    .catch((e) => {
      console.error('Problem occurred when processing the rules', e);
      return Promise.reject({ error: e.message });
    });
};

// Function to validate the ruleset
export const validateRuleset = async (facts, conditions) => {
  try {
    const result = await processEngine(facts, conditions);
    return result;
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
};

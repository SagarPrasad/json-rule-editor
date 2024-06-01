import { Engine } from 'json-rules-engine';


const addCustomOperators = (engine) => {
  engine.addOperator('startsWith', (factValue, jsonValue) => {
      if (typeof factValue !== 'string' || typeof jsonValue !== 'string') {
          return false;
      }
      return factValue.startsWith(jsonValue);
  });

  engine.addOperator('endsWith', (factValue, jsonValue) => {
      if (typeof factValue !== 'string' || typeof jsonValue !== 'string') {
          return false;
      }
      return factValue.endsWith(jsonValue);
  });

};

export const processEngine = (fact, conditions) => {
    const engine = new Engine(conditions);
    addCustomOperators(engine);
    return engine.run(fact)
        .then(results => {
          return results.events
        })
        .catch((e) => {
          console.error('Problem occured when processing the rules', e);
          return Promise.reject({ error: e.message });
        });
};
  
export const validateRuleset = async (facts, conditions) => {
    const result = await processEngine(facts, conditions);
    return result;
}
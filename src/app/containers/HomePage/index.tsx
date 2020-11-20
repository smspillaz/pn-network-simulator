import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import styled from 'styled-components';

import { Graph } from 'react-d3-graph';

const Container = styled.div`
  margin: auto;

  padding: 10px 0;

  @media (min-width: 200px) {
    max-width: calc(min(90%, 450px));
  }

  @media (min-width: 500px) {
    max-width: calc(min(90%, 850px));
  }

  @media (min-width: 960px) {
    max-width: 900px;
  }
`;

const Heading = styled.h1`
  font-family: Helvetica Neue;
`;

const filterJSON = (str, next) => {
  try {
    next(JSON.parse(str));
  } catch (e) {}
};

const filterValidJS = (expectedArgs, str, next) => {
  try {
    console.log(`Trying to eval ${str}`);
    const c = eval(str); // eslint-disable-line no-eval

    if (typeof c === 'function' && c.length && expectedArgs) next(c);
  } catch (e) {
    console.log(`Eval ${str}: ${e}`);
  }
};

const filterValidJSArray = (str, next) => {
  try {
    console.log(`Trying to eval ${str}`);
    const c = eval(str); // eslint-disable-line no-eval

    if (Array.isArray(c)) next(c);
  } catch (e) {
    console.log(`Eval ${str}: ${e}`);
  }
};

const fontSize = 14;
const radius = 15;

const Node = ({ node }) => {
  // sizes
  const sizes = {
    radius: radius,
    textSize: fontSize,
    textX: radius * 1.5,
    textY: radius / 2,
  };
  const sizesImg = {
    radius: 30,
    textSize: fontSize,
    textX: 30 * 1.5,
    textY: 30 / 2,
  };

  return (
    <>
      {node.img ? (
        <image
          href={node.img}
          x="0"
          y="0"
          height={sizesImg.radius * 2}
          width={sizesImg.radius * 2}
          style={{
            transform: `translate(-${sizesImg.radius}px, -${sizesImg.radius}px)`,
          }}
        />
      ) : (
        <circle fill={`lightblue`} r={sizes.radius} />
      )}
      <g style={{ fontSize: sizes.textSize + 'px' }}>
        <text
          x={node.img ? sizesImg.radius + 7 : -sizesImg.textSize / 2}
          y={
            node.img
              ? sizesImg.radius / 2 - sizesImg.textSize
              : sizes.radius / 2
          }
        >
          {node.label}
        </text>
      </g>
    </>
  );
};

const NodeTable = ({
  nodeInitialStates,
  nodeInitialStateChanged,
  nodeStates,
}) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Initial State</th>
          <th>Current State</th>
        </tr>
      </thead>
      <tbody>
        {nodeInitialStates.map((c, i) => (
          <tr key={c}>
            <td style={{ width: '30%' }}>
              <input
                type="text"
                onChange={event =>
                  filterJSON(event.target.value, v =>
                    nodeInitialStateChanged(i, v),
                  )
                }
                defaultValue={String(JSON.stringify(c))}
              />
            </td>
            <td style={{ width: '65%' }}>{JSON.stringify(nodeStates[i])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const FlexRow = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
`;

const FlexCol = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const FlexItem = styled.div`
  width: ${(props: FlexItemProps) => props.width}%;
`;

interface FlexItemProps {
  width: number;
}

FlexItem.propTypes = {
  width: PropTypes.number.isRequired,
};

const INIT_FUNCTIONS = {
  default: `n => ([n]);`,
  colorReduction: `n => ([n, []]);`,
};

const SEND_FUNCTIONS = {
  default: `(r, p, s) => ([]);`,
  colorReduction: `(r, p, s) => ([s[0]]);`,
};

const RECEIVE_FUNCTIONS = {
  default: `(r, p, s, m) => s;`,
  colorReduction: `(r, d, s, m) => (
    [s[0], [...Array.from(s[1]), m[0]]]
);`,
};

const END_ROUND_FUNCTIONS = {
  default: `(r, s) => s;`,
  colorReduction: `(r, s) => {
  const difference = (setA, setB) => {
      let _difference = new Set(setA)
      for (let elem of setB) {
          _difference.delete(elem)
      }
      return Array.from(_difference)
  };

  const [c, others] = s;

  const avail = new Set(
    Array.from((new Array(
      Math.max.apply(null, others.concat(s[0]))
    )).keys())
  );
  const taken = new Set(others);
  const diff = difference(avail, taken);
  console.log('diff is', diff, avail, taken);
  const min = diff.length ? (
    diff.reduce(
      (acc, n) => Math.min(acc, n)
    )
  ) : c;

  const greatestOthers = others.reduce(
    (acc, n) => Math.max(acc, n)
  );

  const final = c > greatestOthers ? min : c;

  return [final, []];
}`,
};

const LINK_DEFINITIONS = {
  default: `
  [
    { source: 0, target: 1, sourcePort: 0, targetPort: 0 },
    { source: 0, target: 2, sourcePort: 1, targetPort: 0 },
    { source: 1, target: 3, sourcePort: 1, targetPort: 0 },
    { source: 1, target: 4, sourcePort: 2, targetPort: 0 },
  ]
`,
};

const returnNodes = linkDefinitions => {
  const nodesSet: Set<Number> = new Set([]);

  linkDefinitions.forEach(({ source, target }) => {
    nodesSet.add(source);
    nodesSet.add(target);
  });

  return Array.from(nodesSet);
};

const debuggable = (t, name) => (
  `${t}
//# sourceURL=${name}.js`
);

export function HomePage() {
  const [linkDefinitionsText, setLinkDefinitionsText] = useState(
    LINK_DEFINITIONS['default'],
  );
  const [linkDefinitions, setLinkDefinitions] = useState(
    eval(LINK_DEFINITIONS['default']),
  );
  const updateLinksDefinition = value => {
    setLinkDefinitionsText(value);

    filterValidJSArray(value, (arr) => {
      setLinkDefinitions(arr);

      const nodeIds = returnNodes(arr);
      const nodeStates = nodeIds.map(i => initFunction.call(i));

      console.log('Set node states to ', nodeStates)
  
      setNodeInitialStates(nodeStates);
      setNodeStates(nodeStates);
    });
  };

  const nodeIds = returnNodes(linkDefinitions);
  const nodeIdsMap = new Map(nodeIds.map((value, idx) => [idx, value]));
  console.log(nodeIdsMap);
  const graph = {
    nodes: nodeIds.map(id => ({
      id,
      label: `Node ${id}`,
      title: `Node ${id}`,
    })),
    links: linkDefinitions,
  };

  const [nodeInitialStates, setNodeInitialStates] = useState(
    Array.from(Array(graph.nodes.length).keys()).map(c => [c]),
  );
  const setNodeInitialState = (i, c) => {
    setNodeInitialStates(States => [
      ...States.slice(0, i),
      c,
      ...States.slice(i + 1),
    ]);

    setNodeStates(States => [...States.slice(0, i), c, ...States.slice(i + 1)]);

    setRound(0);
  };
  const [initFunction, setInitFunction]: [any, CallableFunction] = useState({
    call: (n) => [n],
  });
  const [sendFunction, setSendFunction]: [any, CallableFunction] = useState({
    call: (r, d, x) => [],
  });
  const [receiveFunction, setReceiveFunction]: [
    any,
    CallableFunction,
  ] = useState({ call: (r, d, x, m) => x });
  const [endRoundFunction, setEndRoundFunction]: [
    any,
    CallableFunction,
  ] = useState({ call: (r, x) => x });
  const [initFunctionText, setInitFunctionText] = useState(INIT_FUNCTIONS['default']);
  const [sendFunctionText, setSendFunctionText] = useState(SEND_FUNCTIONS['default']);
  const [receiveFunctionText, setReceiveFunctionText] = useState(RECEIVE_FUNCTIONS['default']);
  const [endRoundFunctionText, setEndRoundFunctionText] = useState(END_ROUND_FUNCTIONS['default']);
  const updateInitFunction = (t, next) => {
    setInitFunctionText(t);
    filterValidJS(1, debuggable(t, 'init-func.js'), (f) => {
      setInitFunction({ call: f })

      if (next) {
        next(f);
      }
    });
  };
  const updateSendFunction = t => {
    setSendFunctionText(t);
    filterValidJS(3, debuggable(t, 'send-func.js'), f => setSendFunction({ call: f }));
  };
  const updateReceiveFunction = t => {
    setReceiveFunctionText(t);
    filterValidJS(4, debuggable(t, 'receive-func.js'), f => setReceiveFunction({ call: f }));
  };
  const updateEndRoundFunction = t => {
    setEndRoundFunctionText(t);
    filterValidJS(2, debuggable(t, 'end-round-func.js'), f => setEndRoundFunction({ call: f }));
  };
  const [nodeStates, setNodeStates] = useState(Array.from(nodeInitialStates));
  const [round, setRound] = useState(0);

  console.log(nodeStates);

  const graphDefinition = {
    nodes: nodeStates.map((c, i) => ({
      id: nodeIdsMap.get(i),
      label: String(c[0]),
      color: 'lightblue',
    })),
    links: graph.links.map(l => ({
      ...l,
      label: `${l.sourcePort} - ${l.targetPort}`,
    })),
  };

  const myConfig = {
    nodeHighlightBehavior: true,
    node: {
      color: 'lightgreen',
      size: 120,
      highlightStrokeColor: 'blue',
      labelProperty: 'label',
      renderLabel: true,
    },
    link: {
      highlightColor: 'lightblue',
      labelProperty: 'label',
      renderLabel: true,
    },
    width: 400,
  };

  const algorithmNext = () => {
    console.log('Next step');
    setNodeStates(nodeStates => {
      const currentNodeStates = Array.from(nodeStates);

      setRound(round => {
        // For each node in the graph
        graphDefinition.links.forEach(
          ({ source, target, sourcePort, targetPort }) => {
            // Message gets sent from source to target and target to source
            const sourceTargetMsg = sendFunction.call(
              round,
              sourcePort,
              nodeStates[source],
            );
            console.log(
              `source ${nodeIdsMap.get(source)}:${sourcePort}:${JSON.stringify(
                currentNodeStates[nodeIdsMap.get(source) as number],
              )} -> target ${nodeIdsMap.get(target)}:${targetPort}:${JSON.stringify(
                currentNodeStates[nodeIdsMap.get(target) as number],
              )} msg: ${JSON.stringify(sourceTargetMsg)}`,
            );
            const targetNextState = receiveFunction.call(
              round,
              targetPort,
              currentNodeStates[nodeIdsMap.get(target) as number],
              sourceTargetMsg,
            );
            console.log(`target state: ${JSON.stringify(targetNextState)}`);

            currentNodeStates[nodeIdsMap.get(target) as number] = targetNextState;

            // Message gets sent from source to target and target to source
            const targetSourceMsg = sendFunction.call(
              round,
              targetPort,
              currentNodeStates[target],
            );
            console.log(
              `target ${nodeIdsMap.get(target)}:${targetPort}:${JSON.stringify(
                currentNodeStates[nodeIdsMap.get(target) as number],
              )} -> source ${nodeIdsMap.get(source)}:${sourcePort}:${JSON.stringify(
                currentNodeStates[nodeIdsMap.get(source) as number],
              )} msg: ${JSON.stringify(targetSourceMsg)}`,
            );
            const sourceNextState = receiveFunction.call(
              round,
              sourcePort,
              currentNodeStates[nodeIdsMap.get(source) as number],
              targetSourceMsg,
            );
            console.log(`source state: ${JSON.stringify(sourceNextState)}`);

            currentNodeStates[source] = sourceNextState;
          },
        );

        // After messages have been exchanged, reduce currentNodeStates
        // into nodeStates
        graphDefinition.nodes.forEach(({ id }) => {
          const state = endRoundFunction.call(round, currentNodeStates[id]);
          console.log(`node ${id} end: ${JSON.stringify(state)}`);
          currentNodeStates[id] = state;
        });

        return round + 1;
      });

      return currentNodeStates;
    });
  };

  return (
    <>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="Port-Numbered Network Simulator" />
      </Helmet>
      <Container>
        <Heading>Port-Numbered Network Simulator</Heading>
        <div style={{ height: '50vh' }}>
          <FlexRow>
            <FlexItem width={60}>
              <FlexCol>
                <Graph id="graph" data={graphDefinition} config={myConfig} />
              </FlexCol>
              <FlexCol>
                <p>Link Definitions</p>
                <textarea
                  value={linkDefinitionsText}
                  rows={10}
                  style={{ width: '90%', margin: 'auto' }}
                  onChange={event => updateLinksDefinition(event.target.value)}
                />
              </FlexCol>
            </FlexItem>
            <FlexItem width={40}>
            <FlexCol>
                <p>Init Function</p>
                <textarea
                  value={initFunctionText}
                  rows={10}
                  style={{ width: '90%', margin: 'auto' }}
                  onChange={event => updateInitFunction(event.target.value, null)}
                />
              </FlexCol>
              <FlexCol>
                <p>Send Function</p>
                <textarea
                  value={sendFunctionText}
                  rows={10}
                  style={{ width: '90%', margin: 'auto' }}
                  onChange={event => updateSendFunction(event.target.value)}
                />
              </FlexCol>
              <FlexCol>
                <p>Receive Function</p>
                <textarea
                  value={receiveFunctionText}
                  rows={10}
                  style={{ width: '90%', margin: 'auto' }}
                  onChange={event => updateReceiveFunction(event.target.value)}
                />
              </FlexCol>
              <FlexCol>
                <p>End Round Function</p>
                <textarea
                  value={endRoundFunctionText}
                  rows={10}
                  style={{ width: '90%', margin: 'auto' }}
                  onChange={event => updateEndRoundFunction(event.target.value)}
                />
              </FlexCol>
            </FlexItem>
          </FlexRow>
          <NodeTable
            nodeInitialStates={nodeInitialStates}
            nodeInitialStateChanged={setNodeInitialState}
            nodeStates={nodeStates}
          />
          <FlexRow>
            <FlexItem width={20}>
              <div>
                <p>Round: {round}</p>
                <button onClick={algorithmNext}>Next Step</button>
              </div>
            </FlexItem>
            <FlexItem width={20}>
              <div>
                <p>Load Algorithm</p>
                <select
                  onChange={e => {
                    updateInitFunction(INIT_FUNCTIONS[e?.target.value], (init) => {
                      updateSendFunction(SEND_FUNCTIONS[e?.target?.value]);
                      updateReceiveFunction(RECEIVE_FUNCTIONS[e?.target?.value]);
                      updateEndRoundFunction(
                        END_ROUND_FUNCTIONS[e?.target?.value],
                      );
  
                      setRound(0);
  
                      const nodeIds = returnNodes(linkDefinitions);
                      const nodeStates = nodeIds.map(i => init(i));
  
                      setNodeInitialStates(nodeStates);
                      setNodeStates(nodeStates);
                    });
                  }}
                >
                  <option value="default">Default</option>
                  <option value="vertexCover3Approx">
                    Vertex Cover 3 Approximation
                  </option>
                  <option value="bipartiteMaximalMatching">
                    Bipartite Maximal Matching
                  </option>
                  <option value="colorReduction">Color Reduction</option>
                </select>
              </div>
            </FlexItem>
          </FlexRow>
        </div>
      </Container>
    </>
  );
}

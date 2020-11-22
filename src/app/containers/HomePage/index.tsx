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

  @media (min-width: 1600px) {
    max-width: 1300px;
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
          <tr key={`${c} ${i}`}>
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
  default: `(n, d) => ([n]);`,
  colorReduction: `(n, d) => ([n]);`,
  bipartiteMaximalMatching: `(n, d) =>
  (["Unmatched", "Running", -1, n, [], (new Array(d)).fill(1)])
  `,
  vertexCover3Approx: `(n, d) =>
    ([
      "NotInSet",
      "Unmatched",
      "Unmatched",
      "Running",
      "Running",
      [],
      [],
      (new Array(d)).fill(1),
      (new Array(d)).fill(1)
    ])
  `,
};

const SEND_FUNCTIONS = {
  default: `(r, p, s) => ([]);`,
  colorReduction: `(r, p, s) => ([s[0]]);`,
  bipartiteMaximalMatching: `
  (r, p, s) => {
    const [M, S, N, C, P, X] = s;
    if (r % 2 === 1 && C === 1) {
      if (M === "Unmatched" && S === "Running") {
        if (Math.floor(r / 2) === p) {
          return ["Propose"];
        }
      }

      if (S === "Running" && N > -1) {
        return ["Matched", N];
      }
    } else if (r % 2 === 0 && C === 0) {
      if (M === "Unmatched" && S === "Running") {
        if (P.length > 0 && p == Math.min.apply(null, P)) {
          return ["Accept"];
        }
      }
    }

    return ["Nothing"];
  }
`,
  vertexCover3Approx: `(r, p, s) => {
  const [S, M1, M2, S1, S2, P1, P2, X1, X2] = s;
  if (r % 2 === 1) {
    if (M2 === "Unmatched" && S2 === "Running") {
      if (Math.floor(r / 2) === p) {
        return ["Propose", 1];
      }
    }

    if (S2 === "Running" && M2 === "Matched") {
      return ["Matched", 1];
    }
  } else if (r % 2 === 0) {
    if (M1 === "Unmatched" && S1 === "Running") {
      if (P1.length > 0 && p == Math.min.apply(null, P1)) {
        return ["Accept", 0];
      }
    }
  }

  return ["Nothing"];
}
`,
};

const RECEIVE_FUNCTIONS = {
  default: `(r, s, m) => s;`,
  colorReduction: `(r, s, m) => {
  const difference = (setA, setB) => {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return Array.from(_difference)
  };

  const c = s[0];
  const others = m.map(([c]) => c);

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

  return [final];
};`,
  bipartiteMaximalMatching: `(r, s, m) => {
    var [M, S, N, C, P, X] = s;
    const sum = (arr) => arr.reduce((acc, a) => acc + a, 0);
    if (r % 2 === 1) {
      if (C === 1) {
        if (M === "Unmatched" && S === "Running") {
          if (Math.floor(r / 2) >= X.length) {
            M = "Unmatched";
            S = "Stopped";
          }
        }
      }

      if (C === 0) {
        if (M === "Unmatched" && S === "Running") {
          m.forEach((msg, i) => {
            if (msg[0] === "Matched") {
              X = X.map((x, j) => i === j ? 0 : x);
            } else if (msg[0] === "Propose") {
              P = P.concat([i])
            }
          });
        }
      }
    } else if (r % 2 === 0) {
      if (C === 0) {
        if (M === "Unmatched" && S === "Running") {
          if (P.length !== 0) {
            M = "Matched";
            S = "Stopped";
            N = Math.min.apply(null, P);
          } else if (sum(X) === 0) {
            M = "Unmatched";
            S = "Stopped";
          }
        }
      }

      if (C === 1) {
        if (M === "Unmatched" && S === "Running") {
          const accepts = m.map((msg, i) => ([msg, i])).filter(([msg, i]) => msg[0] === "Accept");
          console.assert(accepts.length <= 1, "Cannot have multiple accepts");

          if (accepts.length) {
            const [msg, p] = accepts[0];
            M = "Matched";
            S = "Stopped";
            N = p;
          }
        }
      }
    }

    return [M, S, N, C, P, X];
  }`,
  vertexCover3Approx: `(r, s, m) => {
  var [S, M1, M2, S1, S2, P1, P2, X1, X2] = s;
  const sum = (arr) => arr.reduce((acc, a) => acc + a, 0);
  if (r % 2 === 1) {
    if (true) {
      if (M2 === "Unmatched" && S2 === "Running") {
        if (Math.floor(r / 2) >= X2.length) {
          M2 = "Unmatched";
          S2 = "Stopped";
        }
      }
    }

    if (true) {
      if (M1 === "Unmatched" && S1 === "Running") {
        m.forEach((msg, i) => {
          if (msg[0] === "Matched") {
            X1 = X1.map((x, j) => i === j ? 0 : x);
          } else if (msg[0] === "Propose") {
            P1 = P1.concat([i])
          }
        });
      }
    }
  } else if (r % 2 === 0) {
    if (true) {
      if (M1 === "Unmatched" && S1 === "Running") {
        if (P1.length !== 0) {
          M1 = "Matched";
          S1 = "Stopped";
          S = "InSet";
        } else if (sum(X1) === 0) {
          M1 = "Unmatched";
          S1 = "Stopped";
        }
      }
    }

    if (true) {
      if (M2 === "Unmatched" && S2 === "Running") {
        const accepts = m.map((msg, i) => ([msg, i])).filter(([msg, i]) => msg[0] === "Accept");
        console.assert(accepts.length <= 1, "Cannot have multiple accepts");

        if (accepts.length) {
          const [msg, p] = accepts[0];
          M2 = "Matched";
          S2 = "Stopped";
          S = "InSet";
        }
      }
    }
  }

  return [S, M1, M2, S1, S2, P1, P2, X1, X2];
};`,
};

const LINK_DEFINITIONS = {
  default: `
  [
    { source: 0, target: 1, sourcePort: 0, targetPort: 0 },
    { source: 0, target: 5, sourcePort: 2, targetPort: 0 },
    { source: 1, target: 2, sourcePort: 1, targetPort: 1 },
    { source: 2, target: 3, sourcePort: 0, targetPort: 1 },
    { source: 3, target: 0, sourcePort: 0, targetPort: 1 },
  ]
`,
};

const returnNodes = linkDefinitions => {
  const nodesSet: Set<Number> = new Set([]);

  linkDefinitions.forEach(({ source, target }) => {
    nodesSet.add(source);
    nodesSet.add(target);
  });

  const nodes = Array.from(nodesSet);
  nodes.sort();

  return nodes;
};

const NumericInput = ({ onChange }) => {
  return (
    <input
      type="text"
      style={{ width: '20px ' }}
      defaultValue="0"
      onChange={e =>
        !Number.isNaN(Number.parseInt(e.target.value))
          ? onChange(Number.parseInt(e.target.value))
          : null
      }
    ></input>
  );
};

NumericInput.propTypes = {
  onChange: PropTypes.func.isRequired,
};

const debuggable = (t, name) =>
  `${t}
//# sourceURL=${name}.js`;

export function HomePage() {
  const [linkDefinitionsText, setLinkDefinitionsText] = useState(
    LINK_DEFINITIONS['default'],
  );
  const [linkDefinitions, setLinkDefinitions] = useState(
    eval(LINK_DEFINITIONS['default']), // eslint-disable-line no-eval
  );
  const updateLinksDefinition = value => {
    setLinkDefinitionsText(value);

    filterValidJSArray(value, arr => {
      setLinkDefinitions(arr);

      const nodeIds = returnNodes(arr);
      const nodeStates = nodeIds.map(i =>
        initFunction.call(
          i,
          arr.filter(({ source, target }) => i === source || i === target)
            .length,
        ),
      );

      console.log('Set node states to ', nodeStates);

      setNodeInitialStates(nodeStates);
      setNodeStates(nodeStates);
    });
  };

  const nodeIds = returnNodes(linkDefinitions);
  const nodeIdsToIdxMap = new Map(nodeIds.map((value, idx) => [value, idx]));
  console.log(nodeIdsToIdxMap);
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
    call: (n, d) => [n],
  });
  const [sendFunction, setSendFunction]: [any, CallableFunction] = useState({
    call: (r, d, x) => [],
  });
  const [receiveFunction, setReceiveFunction]: [
    any,
    CallableFunction,
  ] = useState({ call: (r, s, m) => s });
  const [initFunctionText, setInitFunctionText] = useState(
    INIT_FUNCTIONS['default'],
  );
  const [sendFunctionText, setSendFunctionText] = useState(
    SEND_FUNCTIONS['default'],
  );
  const [receiveFunctionText, setReceiveFunctionText] = useState(
    RECEIVE_FUNCTIONS['default'],
  );
  const updateInitFunction = (t, next) => {
    setInitFunctionText(t);
    filterValidJS(1, debuggable(t, 'init-func.js'), f => {
      setInitFunction({ call: f });

      if (next) {
        next(f);
      }
    });
  };
  const updateSendFunction = t => {
    setSendFunctionText(t);
    filterValidJS(3, debuggable(t, 'send-func.js'), f =>
      setSendFunction({ call: f }),
    );
  };
  const updateReceiveFunction = t => {
    setReceiveFunctionText(t);
    filterValidJS(4, debuggable(t, 'receive-func.js'), f =>
      setReceiveFunction({ call: f }),
    );
  };
  const [nodeStates, setNodeStates] = useState(Array.from(nodeInitialStates));
  const [round, setRound] = useState(0);
  const [twoColorIntoStateIdx, set2ColorIntoStateIdx] = useState(0);

  const performBfs2Coloring = () => {
    // Perform a breadth-first search on the first node
    // and do a 2-coloring from there
    if (nodeIds.length === 0) {
      return;
    }

    const q: number[][] = [];
    q.push([nodeIds[0] as number, 0]);
    const seen: Set<number> = new Set([]);

    while (q.length !== 0) {
      const [next, c] = q.shift() as number[];

      if (seen.has(next)) {
        continue;
      }

      seen.add(next);

      const idx: number = nodeIdsToIdxMap.get(next) as number;
      const state = nodeInitialStates[idx];

      state[twoColorIntoStateIdx] = c;

      setNodeInitialState(idx, state);

      graphDefinition.links.forEach(({ source, target }) => {
        if (source === next) {
          q.push([target, c === 1 ? 0 : 1]);
        }
      });
    }
  };

  console.log(nodeStates);

  const graphDefinition = {
    nodes: nodeStates.map((c, i) => ({
      id: nodeIds[i as number],
      label: JSON.stringify(c),
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
        const messages = {};

        graphDefinition.links.forEach(({ source, target }) => {
          messages[source as number] = [];
          messages[target as number] = [];
        });

        // For each node in the graph
        graphDefinition.links.forEach(
          ({ source, target, sourcePort, targetPort }) => {
            // Message gets sent from source to target and target to source
            const sourceTargetMsg = sendFunction.call(
              round,
              sourcePort,
              currentNodeStates[nodeIdsToIdxMap.get(source) as number],
            );
            console.log(
              `source ${source}:${sourcePort}:${JSON.stringify(
                currentNodeStates[nodeIdsToIdxMap.get(source) as number],
              )} -> target ${target}:${targetPort}:${JSON.stringify(
                currentNodeStates[nodeIdsToIdxMap.get(target) as number],
              )} msg: ${JSON.stringify(sourceTargetMsg)}`,
            );
            messages[target][targetPort] = sourceTargetMsg;

            // Message gets sent from source to target and target to source
            const targetSourceMsg = sendFunction.call(
              round,
              targetPort,
              currentNodeStates[nodeIdsToIdxMap.get(target) as number],
            );
            console.log(
              `source ${target}:${targetPort}:${JSON.stringify(
                currentNodeStates[nodeIdsToIdxMap.get(target) as number],
              )} -> target ${source}:${sourcePort}:${JSON.stringify(
                currentNodeStates[nodeIdsToIdxMap.get(source) as number],
              )} msg: ${JSON.stringify(targetSourceMsg)}`,
            );
            messages[source][sourcePort] = targetSourceMsg;
          },
        );

        // After messages have been exchanged, reduce currentNodeStates
        // into nodeStates
        graphDefinition.nodes.forEach(({ id }) => {
          const nextState = receiveFunction.call(
            round,
            currentNodeStates[nodeIdsToIdxMap.get(id as number) as number],
            messages[id as number],
          );
          console.log(`${id} next state: ${JSON.stringify(nextState)}`);

          currentNodeStates[
            nodeIdsToIdxMap.get(id as number) as number
          ] = nextState;
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
                  onChange={event =>
                    updateInitFunction(event.target.value, null)
                  }
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
              <div>
                <span>
                  Two-color the graph into state index:{' '}
                  <NumericInput onChange={set2ColorIntoStateIdx} />{' '}
                  <button onClick={() => performBfs2Coloring()}>
                    Two Color
                  </button>
                </span>
              </div>
            </FlexItem>
            <FlexItem width={20}>
              <div>
                <p>Load Algorithm</p>
                <select
                  onChange={e => {
                    updateInitFunction(
                      INIT_FUNCTIONS[e?.target.value],
                      init => {
                        updateSendFunction(SEND_FUNCTIONS[e?.target?.value]);
                        updateReceiveFunction(
                          RECEIVE_FUNCTIONS[e?.target?.value],
                        );

                        setRound(0);

                        const nodeIds = returnNodes(linkDefinitions);
                        const nodeStates = nodeIds.map(i =>
                          init(
                            i,
                            graphDefinition.links.filter(
                              ({ source, target }) =>
                                i === source || i === target,
                            ).length,
                          ),
                        );

                        setNodeInitialStates(nodeStates);
                        setNodeStates(nodeStates);
                      },
                    );
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

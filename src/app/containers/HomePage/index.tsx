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
};

FlexItem.propTypes = {
  width: PropTypes.number.isRequired,
};

export function HomePage() {
  const graph = {
    nodes: [
      { id: 0, label: 'Node 1', title: 'node 1 tootip text', color: 'yellow' },
      { id: 1, label: 'Node 2', title: 'node 2 tootip text', color: 'brown' },
      {
        id: 2,
        label: 'Node 3',
        title: 'node 3 tootip text',
        color: 'lightblue',
      },
      { id: 3, label: 'Node 4', title: 'node 4 tootip text' },
      { id: 4, label: 'Node 5', title: 'node 5 tootip text' },
    ],
    links: [
      { source: 0, target: 1, sourcePort: 0, targetPort: 0 },
      { source: 0, target: 2, sourcePort: 1, targetPort: 0 },
      { source: 1, target: 3, sourcePort: 1, targetPort: 0 },
      { source: 1, target: 4, sourcePort: 2, targetPort: 0 },
    ],
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
  const [nodeStates, setNodeStates] = useState(Array.from(nodeInitialStates));
  const [round, setRound] = useState(0);

  const graphDefinition = {
    nodes: nodeStates.map((c, i) => ({
      id: i,
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
              `source ${source}:${sourcePort}:${JSON.stringify(currentNodeStates[source])} -> target ${target}:${targetPort}:${JSON.stringify(currentNodeStates[target])} msg: ${JSON.stringify(sourceTargetMsg)}`,
            );
            const targetNextState = receiveFunction.call(
              round,
              targetPort,
              currentNodeStates[target],
              sourceTargetMsg,
            );
            console.log(`target state: ${JSON.stringify(targetNextState)}`);

            currentNodeStates[target] = targetNextState;

            // Message gets sent from source to target and target to source
            const targetSourceMsg = sendFunction.call(
              round,
              targetPort,
              currentNodeStates[target],
            );
            console.log(
              `target ${target}:${targetPort}:${JSON.stringify(currentNodeStates[target])} -> source ${source}:${sourcePort}:${JSON.stringify(currentNodeStates[source])} msg: ${JSON.stringify(targetSourceMsg)}`,
            );
            const sourceNextState = receiveFunction.call(
              round,
              sourcePort,
              currentNodeStates[source],
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
              <Graph id="graph" data={graphDefinition} config={myConfig} />
            </FlexItem>
            <FlexItem width={40}>
              <FlexCol>
                <p>Send Function</p>
                <textarea
                  rows={10}
                  style={{ width: '90%', margin: 'auto' }}
                  onChange={event =>
                    filterValidJS(3, event.target.value, f =>
                      setSendFunction({ call: f }),
                    )
                  }
                />
              </FlexCol>
              <FlexCol>
                <p>Receive Function</p>
                <textarea
                  rows={10}
                  style={{ width: '90%', margin: 'auto' }}
                  onChange={event =>
                    filterValidJS(3, event.target.value, f =>
                      setReceiveFunction({ call: f }),
                    )
                  }
                />
              </FlexCol>
              <FlexCol>
                <p>End Round Function</p>
                <textarea
                  rows={10}
                  style={{ width: '90%', margin: 'auto' }}
                  onChange={event =>
                    filterValidJS(3, event.target.value, f =>
                      setEndRoundFunction({ call: f }),
                    )
                  }
                />
              </FlexCol>
            </FlexItem>
          </FlexRow>
          <NodeTable
            nodeInitialStates={nodeInitialStates}
            nodeInitialStateChanged={setNodeInitialState}
            nodeStates={nodeStates}
          />
          <div>
            <p>Round: {round}</p>
            <button onClick={algorithmNext}>Next Step</button>
          </div>
        </div>
      </Container>
    </>
  );
}

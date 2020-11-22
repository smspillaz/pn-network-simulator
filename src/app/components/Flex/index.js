import styled from 'styled-components';

export const FlexRow = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
`;

export const FlexCol = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export const FlexItem = styled.div`
  width: ${(props: FlexItemProps) => props.width}%;
`;

interface FlexItemProps {
  width: number;
}

FlexItem.propTypes = {
  width: PropTypes.number.isRequired,
};
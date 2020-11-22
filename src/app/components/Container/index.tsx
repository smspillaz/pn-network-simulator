import styled from 'styled-components';

export const Container = styled.div`
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
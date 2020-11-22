import PropTypes from 'prop-types';

export const NumericInput = ({ onChange }) => {
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
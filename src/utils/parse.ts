export const filterJSON = (str, next) => {
  try {
    next(JSON.parse(str));
  } catch (e) {}
};

export const filterValidJS = (expectedArgs, str, next) => {
  try {
    console.log(`Trying to eval ${str}`);
    const c = eval(str); // eslint-disable-line no-eval

    if (typeof c === 'function' && c.length && expectedArgs) next(c);
  } catch (e) {
    console.log(`Eval ${str}: ${e}`);
  }
};

export const filterValidJSArray = (str, next) => {
  try {
    console.log(`Trying to eval ${str}`);
    const c = eval(str); // eslint-disable-line no-eval

    if (Array.isArray(c)) next(c);
  } catch (e) {
    console.log(`Eval ${str}: ${e}`);
  }
};
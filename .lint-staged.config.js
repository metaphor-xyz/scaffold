module.exports = {
  'src/**/*.{js,jsx,ts,tsx}': ['node build/lint.js -- --fix'],
  'src/**/*.{js,jsx,ts,tsx}': [() => "bash -c 'tsc'"],
};

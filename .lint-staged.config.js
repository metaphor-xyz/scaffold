module.exports = {
  '**/*.{js,jsx,ts,tsx}': ['node build/lint.js -- --fix'],
  'app/**/*.{js,jsx,ts,tsx}': [() => "bash -c 'cd app && tsc'"],
};

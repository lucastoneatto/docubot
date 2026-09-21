const REQUIRED_MAJOR = 24;
const current = process.versions.node;
const major = Number(current.split('.')[0]);

if (major < REQUIRED_MAJOR) {
  console.error(
    [
      '',
      `[docubot] Node ${REQUIRED_MAJOR}+ is required, and you're using Node v${current}.`,
      '',
      'Run:',
      "  nvm use        # uses the project's .nvmrc (24)",
      '',
    ].join('\n'),
  );
  process.exit(1);
}

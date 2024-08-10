import { describe, test, expect } from '@jest/globals';
import { transform, type BabelFileResult } from '@babel/core';
import plugin from './index.js';

describe('babel-plugin-knifecycle', () => {
  describe('autoInject', () => {
    test('should work with es6 modules imports', () => {
      const example = `
        import noop from 'noop';
        import { autoInject } from 'knifecycle';

        export default autoInject(getUser);

        async function getUser({ mysql: db, log = noop }, { userId }) {
          return {};
        }
        `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with object rest spreads', () => {
      const example = `
        import noop from 'noop';
        import { autoInject } from 'knifecycle';

        export default autoInject(getUser);

        async function getUser({ mysql: db, log = noop, ...services }, { userId }) {
          return {};
        }
        `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchInlineSnapshot(`
"import noop from 'noop';
import { inject as _inject } from 'knifecycle';
export default _inject(["mysql", "?log"], getUser);
async function getUser({
  mysql: db,
  log = noop,
  ...services
}, {
  userId
}) {
  return {};
}"
`);
    });

    test('should work with no injection', () => {
      const example = `
        import noop from 'noop';
        import { autoInject } from 'knifecycle';

        export default autoInject(getUser);

        async function getUser() {
          return {};
        }
        `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with several auto functions', () => {
      const example = `
        import noop from 'noop';
        import { autoInject, autoName } from 'knifecycle';

        export default autoInject(autoName(getUser));

        async function getUser({ mysql: db, log = noop }, { userId }) {
          return {};
        }
        `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with non-destructured "_" named args', () => {
      const example = `
        import noop from 'noop';
        import { autoInject, autoName } from 'knifecycle';

        export default autoInject(autoName(getUser));

        async function getUser(_, { userId }) {
          return {};
        }
        `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should fail with non-destructured arg', () => {
      const example = `
        import noop from 'noop';
        import { autoInject, autoName } from 'knifecycle';

        export default autoInject(autoName(getUser));

        async function getUser(services, { userId }) {
          return {};
        }
        `;

      expect(() => {
        transform(example, { plugins: [plugin] });
      }).toThrow(
        'Expect the dependencies to be defined through an object pattern.',
      );
    });
  });

  describe('autoName', () => {
    test('should work with es6 modules imports', () => {
      const example = `
        import noop from 'noop';
        import { autoName } from 'knifecycle';

        export default autoName(getUser);

        async function getUser({ mysql: db, log = noop }, { userId }) {
          return {};
        }
        `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with init prefix', () => {
      const example = `
        import noop from 'noop';
        import { autoName } from 'knifecycle';

        export default autoName(initGetUser);

        async function initGetUser({ mysql: db, log = noop }, { userId }) {
          return {};
        }
        `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });
  });

  describe('autoService', () => {
    test('should work with es6 modules imports', () => {
      const example = `
          import noop from 'noop';
          import { autoService } from 'knifecycle';

          export default autoService(getUser);

          async function getUser({ mysql: db, log = noop }) {
            return async ({ userId }) => {
              return {};
            }
          }
          `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with no dependencies', () => {
      const example = `
          import noop from 'noop';
          import { autoService } from 'knifecycle';

          export default autoService(getUser);

          async function getUser() {
            return async ({ userId }) => {
              return {};
            }
          }
          `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });
  });

  describe('autoProvider', () => {
    test('should work with es6 modules imports', () => {
      const example = `
          import noop from 'noop';
          import { autoProvider } from 'knifecycle';

          export default autoProvider(getUser);

          async function getUser({ mysql: db, log = noop }) {
            return async ({ userId }) => {
              return {};
            }
          }
          `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with options', () => {
      const example = `
          import noop from 'noop';
          import { autoProvider } from 'knifecycle';

          export default autoProvider(getUser, { singleton: true });

          async function getUser({ mysql: db, log = noop }) {
            return async ({ userId }) => {
              return {};
            }
          }
          `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });
  });

  describe('autoHandler', () => {
    test('should work with es6 modules imports', () => {
      const example = `
          import noop from 'noop';
          import { autoHandler } from 'knifecycle';

          export default autoHandler(getUser);

          async function getUser({ mysql: db, log = noop }, { userId }) {
            return {};
          }
          `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with inline function expressions', () => {
      const example = `
      import noop from 'noop';
      import { autoHandler } from 'knifecycle';

      export default autoHandler(async function getUser({ mysql: db, log = noop }, { userId }) {
        return {};
      });
      `;
      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with a function inside a var', () => {
      const example = `
      import noop from 'noop';
      import { autoHandler } from 'knifecycle';
      
      const getUser = async function getUser(
        { mysql: db, log = noop },
        { userId },
      ) {
        return {};
      };

      export default autoHandler(getUser);
      `;

      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should work with an anonymous function inside a var', () => {
      const example = `
      import noop from 'noop';
      import { autoHandler } from 'knifecycle';
      
      const getUser = async function(
        { mysql: db, log = noop },
        { userId },
      ) {
        return {};
      };

      export default autoHandler(getUser);
      `;

      const { code } = transform(example, {
        plugins: [plugin],
      }) as BabelFileResult;

      expect(code).toMatchSnapshot();
    });

    test('should fail with anonymous function expressions', () => {
      const example = `
      import noop from 'noop';
      import { autoHandler } from 'knifecycle';

      export default autoHandler(async ({ mysql: db, log = noop }, { userId }) => {
        return {};
      });
      `;

      expect(() => {
        transform(example, { plugins: [plugin] });
      }).toThrow('Expect autoHandler to take an async function in argument.');
    });

    test('should fail with something defined elsewhere', () => {
      const example = `
      import noop from 'noop';
      import { autoHandler } from 'knifecycle';
      import getUser from './getUser';

      export default autoHandler(getUser);
      `;

      expect(() => {
        transform(example, { plugins: [plugin] });
      }).toThrow(
        'Expect the function passed in autoHandler to be defined in the local file.',
      );
    });
  });
});

// src/__tests__/index-test.js
import { transform } from '@babel/core';
import plugin from '.';

describe('babel-plugin-knifecycle', () => {
  describe('autoInject', () => {
    it('should work with es6 modules imports', () => {
      var example = `
        import noop from 'noop';
        import { autoInject } from 'knifecycle';

        export default autoInject(getUser);

        async function getUser({ mysql: db, log = noop }, { userId }) {
          return {};
        }
        `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });

    it('should work with no injection', () => {
      var example = `
        import noop from 'noop';
        import { autoInject } from 'knifecycle';

        export default autoInject(getUser);

        async function getUser() {
          return {};
        }
        `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });

    it('should work with several auto functions', () => {
      var example = `
        import noop from 'noop';
        import { autoInject, autoName } from 'knifecycle';

        export default autoInject(autoName(getUser));

        async function getUser({ mysql: db, log = noop }, { userId }) {
          return {};
        }
        `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });
  });

  describe('autoName', () => {
    it('should work with es6 modules imports', () => {
      var example = `
        import noop from 'noop';
        import { autoName } from 'knifecycle';

        export default autoName(getUser);

        async function getUser({ mysql: db, log = noop }, { userId }) {
          return {};
        }
        `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });

    it('should work with init prefix', () => {
      var example = `
        import noop from 'noop';
        import { autoName } from 'knifecycle';

        export default autoName(initGetUser);

        async function initGetUser({ mysql: db, log = noop }, { userId }) {
          return {};
        }
        `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });
  });

  describe('autoService', () => {
    it('should work with es6 modules imports', () => {
      var example = `
          import noop from 'noop';
          import { autoService } from 'knifecycle';

          export default autoService(getUser);

          async function getUser({ mysql: db, log = noop }) {
            return async ({ userId }) => {
              return {};
            }
          }
          `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });

    it('should work with no dependencies', () => {
      var example = `
          import noop from 'noop';
          import { autoService } from 'knifecycle';

          export default autoService(getUser);

          async function getUser() {
            return async ({ userId }) => {
              return {};
            }
          }
          `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });
  });

  describe('autoProvider', () => {
    it('should work with es6 modules imports', () => {
      var example = `
          import noop from 'noop';
          import { autoProvider } from 'knifecycle';

          export default autoProvider(getUser);

          async function getUser({ mysql: db, log = noop }) {
            return async ({ userId }) => {
              return {};
            }
          }
          `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });

    it('should work with options', () => {
      var example = `
          import noop from 'noop';
          import { autoProvider } from 'knifecycle';

          export default autoProvider(getUser, { singleton: true });

          async function getUser({ mysql: db, log = noop }) {
            return async ({ userId }) => {
              return {};
            }
          }
          `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });
  });

  describe('autoHandler', () => {
    it('should work with es6 modules imports', () => {
      var example = `
          import noop from 'noop';
          import { autoHandler } from 'knifecycle';

          export default autoHandler(getUser);

          async function getUser({ mysql: db, log = noop }, { userId }) {
            return {};
          }
          `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });

    it('should work with inline function expressions', () => {
      var example = `
      import noop from 'noop';
      import { autoHandler } from 'knifecycle';

      export default autoHandler(async function getUser({ mysql: db, log = noop }, { userId }) {
        return {};
      });
      `;

      const { code } = transform(example, { plugins: [plugin] });
      expect(code).toMatchSnapshot();
    });

    it('should fail with anonymous function expressions', () => {
      var example = `
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

    it('should fail with something defined elsewhere', () => {
      var example = `
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

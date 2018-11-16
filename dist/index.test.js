"use strict";

// src/__tests__/index-test.js
const babel = require('@babel/core');

const plugin = require('.');

describe('babel-plugin-knifecycle', () => {
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
      const {
        code
      } = babel.transform(example, {
        plugins: [plugin]
      });
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
      const {
        code
      } = babel.transform(example, {
        plugins: [plugin]
      });
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
        babel.transform(example, {
          plugins: [plugin]
        });
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
        babel.transform(example, {
          plugins: [plugin]
        });
      }).toThrow('Expect the function passed in autoHandler to be defined in the local file.');
    });
  });
});
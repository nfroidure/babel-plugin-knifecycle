"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = testPlugin;

function testPlugin(babel) {
  return {
    visitor: {
      ImportDeclaration(path) {
        const sourceNode = path.get('source');

        if (!sourceNode.isStringLiteral()) {
          return;
        }

        if (!sourceNode.node.value === 'knifecycle') {
          return;
        }

        path.traverse({
          ImportSpecifier(path) {
            const localNode = path.get('local');
            const importedNode = path.get('imported');

            if (!(localNode.isIdentifier() && importedNode.isIdentifier())) {
              return;
            }

            if ('autoHandler' === importedNode.node.name) {
              importedNode.node.name = 'handler';
              path.scope.rename(localNode.node.name, path.scope.generateUidIdentifier('handler').name);
              const binding = path.scope.getBinding(localNode.node.name);
              binding.referencePaths.forEach(path => {
                if (!path.parentPath.isCallExpression) {
                  return;
                }

                const autoHandlerArgumentPath = path.parentPath.get('arguments.0');
                let name = '';
                let injections = [];

                if (autoHandlerArgumentPath.isIdentifier()) {
                  const binding = autoHandlerArgumentPath.scope.getBinding(autoHandlerArgumentPath.node.name);

                  if (!(binding && binding.path.isFunctionDeclaration())) {
                    throw autoHandlerArgumentPath.buildCodeFrameError('Expect the function passed in autoHandler to be defined in the local file.');
                  }

                  name = binding.path.get('id').node.name;
                  const handlerArgumentPath = binding.path.get('params.0');

                  if (!handlerArgumentPath.isObjectPattern()) {
                    throw autoHandlerArgumentPath.buildCodeFrameError('Expect the function passed in autoHandler to have an object pattern as first argument.');
                  }

                  handlerArgumentPath.traverse({
                    Property(path) {
                      injections.push((path.get('value').isAssignmentPattern() ? '?' : '') + path.get('key').node.name);
                    }

                  });
                } else if (autoHandlerArgumentPath.isFunctionExpression()) {
                  name = autoHandlerArgumentPath.get('id').node.name;
                  const handlerArgumentPath = autoHandlerArgumentPath.get('params.0');

                  if (!handlerArgumentPath.isObjectPattern()) {
                    throw autoHandlerArgumentPath.buildCodeFrameError('Expect the function passed in autoHandler to have an object pattern as first argument.');
                  }

                  handlerArgumentPath.traverse({
                    Property(path) {
                      injections.push((path.get('value').isAssignmentPattern() ? '?' : '') + path.get('key').node.name);
                    }

                  });
                } else {
                  throw autoHandlerArgumentPath.buildCodeFrameError('Expect autoHandler to take an async function in argument.');
                }

                path.parentPath.node.arguments.push(babel.types.stringLiteral(name));
                path.parentPath.node.arguments.push(babel.types.arrayExpression(injections.map(i => babel.types.stringLiteral(i))));
              });
            }
          }

        });
      }

    }
  };
}
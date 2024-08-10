import { parseName } from 'knifecycle';

const commonTransform = (babel, autoFunctionPath, functionDefinitionPath) => {
  const name = _pickupHandlerName(functionDefinitionPath);
  const injections = _pickupInitializerDependencies(functionDefinitionPath);

  autoFunctionPath.node.arguments = [
    autoFunctionPath.node.arguments[0],
    babel.types.stringLiteral(parseName(name)),
    babel.types.arrayExpression(
      injections.map((i) => babel.types.stringLiteral(i)),
    ),
    ...autoFunctionPath.node.arguments.slice(1),
  ];
};

const AUTO_FUNCTIONS_TRANFORMS = {
  autoInject: {
    target: 'inject',
    transform: (babel, autoFunctionPath, functionDefinitionPath) => {
      const injections = _pickupInitializerDependencies(functionDefinitionPath);

      autoFunctionPath.node.arguments.unshift(
        babel.types.arrayExpression(
          injections.map((i) => babel.types.stringLiteral(i)),
        ),
      );
    },
  },
  autoName: {
    target: 'name',
    transform: (babel, autoFunctionPath, functionDefinitionPath) => {
      const name = _pickupHandlerName(functionDefinitionPath);
      autoFunctionPath.node.arguments.unshift(
        babel.types.stringLiteral(parseName(name)),
      );
    },
  },
  autoService: {
    target: 'service',
    transform: commonTransform,
  },
  autoHandler: {
    target: 'handler',
    transform: commonTransform,
  },
  autoProvider: {
    target: 'provider',
    transform: commonTransform,
  },
};

AUTO_FUNCTIONS_TRANFORMS.autoHandler = {
  target: 'handler',
  transform: AUTO_FUNCTIONS_TRANFORMS.autoService.transform,
};

AUTO_FUNCTIONS_TRANFORMS.autoProvider = {
  target: 'provider',
  transform: AUTO_FUNCTIONS_TRANFORMS.autoService.transform,
};

export default function knifecyclePlugin(babel) {
  return {
    visitor: {
      Program(programPath) {
        programPath.traverse({
          ImportDeclaration(path) {
            const sourceNode = path.get('source');

            if (!sourceNode.isStringLiteral()) {
              return;
            }

            if (sourceNode.node.value !== 'knifecycle') {
              return;
            }

            path.traverse({
              ImportSpecifier(path) {
                const localNode = path.get('local');
                const importedNode = path.get('imported');

                if (
                  !(localNode.isIdentifier() && importedNode.isIdentifier())
                ) {
                  return;
                }

                const autoFunctionName = importedNode.node.name;

                if (AUTO_FUNCTIONS_TRANFORMS[autoFunctionName]) {
                  _renameAutoFunction(
                    path,
                    importedNode,
                    localNode,
                    AUTO_FUNCTIONS_TRANFORMS[autoFunctionName].target,
                  );
                  _forEachCallExpression(path, localNode, (path) => {
                    const functionDefinitionPath =
                      _findFunctionDefinitionPath(path);

                    AUTO_FUNCTIONS_TRANFORMS[autoFunctionName].transform(
                      babel,
                      path,
                      functionDefinitionPath,
                    );
                  });
                }
              },
            });
          },
        });
      },
    },
  };
}

function _renameAutoFunction(path, importedNode, localNode, name) {
  importedNode.node.name = name;
  path.scope.rename(
    localNode.node.name,
    path.scope.generateUidIdentifier(name).name,
  );
}

function _forEachCallExpression(path, localNode, fn) {
  const binding = path.scope.getBinding(localNode.node.name);

  binding.referencePaths.forEach((path) => {
    if (!path.parentPath.isCallExpression()) {
      return;
    }
    fn(path.parentPath);
  });
}

function _findFunctionDefinitionPath(path) {
  const autoHandlerArgumentPath = path.get('arguments.0');
  let functionDefinitionPath;

  if (autoHandlerArgumentPath.isIdentifier()) {
    const binding = autoHandlerArgumentPath.scope.getBinding(
      autoHandlerArgumentPath.node.name,
    );

    if (
      !(
        binding &&
        (binding.path.isFunctionDeclaration() ||
          binding.path.isVariableDeclarator())
      )
    ) {
      throw autoHandlerArgumentPath.buildCodeFrameError(
        'Expect the function passed in autoHandler to be defined in the local file.',
      );
    }

    if (binding.path.isFunctionDeclaration()) {
      functionDefinitionPath = binding.path;
    } else {
      functionDefinitionPath = binding.path.get('init');
      if (!functionDefinitionPath.isFunctionExpression()) {
        throw autoHandlerArgumentPath.buildCodeFrameError(
          'Expect the function passed in autoHandler to be defined in the local file.',
        );
      }

      if (!functionDefinitionPath.get('id').node) {
        functionDefinitionPath.get('id').replaceWith({
          type: 'Identifier',
          name: binding.path.get('id').node.name,
        });
      }
    }
  } else if (autoHandlerArgumentPath.isFunctionExpression()) {
    functionDefinitionPath = autoHandlerArgumentPath;
  } else if (autoHandlerArgumentPath.isCallExpression()) {
    const calleeName = autoHandlerArgumentPath.get('callee').node.name;

    if (!AUTO_FUNCTIONS_TRANFORMS[calleeName]) {
      throw autoHandlerArgumentPath.buildCodeFrameError(
        'Expect autoHandler to take an auto function call in argument, try to import the auto function in the same order they were used.',
      );
    }
    return _findFunctionDefinitionPath(autoHandlerArgumentPath);
  } else {
    throw autoHandlerArgumentPath.buildCodeFrameError(
      'Expect autoHandler to take an async function in argument.',
    );
  }

  return functionDefinitionPath;
}

function _pickupHandlerName(path) {
  return path.get('id').node.name;
}

function _pickupInitializerDependencies(path) {
  const injections: string[] = [];
  const handlerArgumentPath = path.get('params.0');

  if (!handlerArgumentPath) {
    return injections;
  }
  if (!handlerArgumentPath.isObjectPattern()) {
    if (handlerArgumentPath.node.name === '_') {
      return injections;
    }
    throw handlerArgumentPath.buildCodeFrameError(
      'Expect the dependencies to be defined through an object pattern.',
    );
  }

  handlerArgumentPath.traverse({
    Property(path) {
      injections.push(
        (path.get('value').isAssignmentPattern() ? '?' : '') +
          path.get('key').node.name,
      );
    },
  });

  return injections;
}

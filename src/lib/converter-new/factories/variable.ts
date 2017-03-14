import * as ts from 'typescript';

import { createDeclaration, ReflectionKind } from './declaration';
import { Context } from '../context';
import { Reflection, IntrinsicType } from '../../models/index';
import { convertDefaultValue } from '../index';
import { getComment } from './comment';

/**
 * Analyze the given variable declaration node and create a suitable reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The variable declaration node that should be analyzed.
 * @return The resulting reflection or NULL.
 */
export function createVariable(context: Context, node: ts.VariableDeclaration): Reflection {
    const comment = getComment(node);
    if (comment && comment.hasTag('resolve')) {
        const resolveType = context.getTypeAtLocation(node);
        if (resolveType && resolveType.symbol) {
            const resolved = context.converter.convertNode(context, resolveType.symbol.declarations[0]);
            if (resolved) {
                resolved.name = node.symbol.name;
            }
        }
    }

    let name: string;
    let isBindingPattern = false;

    if (ts.isBindingPattern(node.name)) {
        if (node['propertyName']) {
            name = ts.declarationNameToString(node['propertyName']);
            isBindingPattern = true;
        } else {
            return null;
        }
    }

    const scope = context.scope;
    const kind = scope.kind & ReflectionKind.ClassOrInterface ? ReflectionKind.Property : ReflectionKind.Variable;
    const variable = createDeclaration(context, node, kind, name);
    context.withScope(variable, context => {
        if (node.initializer) {
            switch (node.initializer.kind) {
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.FunctionExpression:
                variable.kind = scope.kind & ReflectionKind.ClassOrInterface ? ReflectionKind.Method : ReflectionKind.Function;
                context.converter.convertNode(context, node.initializer);
                break;
            case ts.SyntaxKind.ObjectLiteralExpression:
                if (!isSimpleObjectLiteral(<ts.ObjectLiteralExpression> node.initializer)) {
                    variable.kind = ReflectionKind.ObjectLiteral;
                    variable.type = new IntrinsicType('object');
                    context.converter.convertNode(context, node.initializer);
                }
                break;
            default:
                variable.defaultValue = convertDefaultValue(node);
            }
        }

        if (variable.kind === kind || variable.kind === ReflectionKind.Event) {
            if (isBindingPattern) {
                variable.type = context.converter.convertType(context, node.name);
            } else {
                variable.type = context.converter.convertType(context, node.type, context.getTypeAtLocation(node));
            }
        }
    });

    return variable;
}

/**
 * Analyze the given variable statement node and create a suitable reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The variable statement node that should be analyzed.
 * @return The resulting reflection or NULL.
 */
export function createVariableStatement(context: Context, node: ts.VariableStatement): Reflection {
    if (node.declarationList && node.declarationList.declarations) {
        node.declarationList.declarations.forEach(declaration => {
            if (ts.isBindingPattern(declaration.name)) {
                convertBindingPattern(context, <ts.BindingPattern> declaration.name);
            } else {
                context.converter.convertNode(context, declaration);
            }
        });
    }

    return context.scope;
}

function isSimpleObjectLiteral(objectLiteral: ts.ObjectLiteralExpression): boolean {
    return !objectLiteral.properties || objectLiteral.properties.length === 0;
}

/**
 * Traverse the elements of the given binding pattern and create the corresponding variable reflections.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The binding pattern node that should be analyzed.
 */
function convertBindingPattern(context: Context, node: ts.BindingPattern) {
    (node.elements as ts.BindingElement[]).forEach((element: ts.BindingElement) => {
        context.converter.convertNode(context, element);

        if (ts.isBindingPattern(element.name)) {
            convertBindingPattern(context, <ts.BindingPattern> element.name);
        }
    });
}

import * as ts from 'typescript';
import { Context } from '../context';
import { Reflection } from '../../models/index';

/**
 * Analyze the given object literal node and create a suitable reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The object literal node that should be analyzed.
 * @return The resulting reflection or NULL.
 */
export function createObjectLiteral(context: Context, node: ts.ObjectLiteralExpression): Reflection {
    if (node.properties) {
        node.properties.forEach(node => {
            context.converter.convertNode(context, node);
        });
    }

    return context.scope;
}

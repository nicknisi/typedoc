import * as ts from 'typescript';
import { Context } from '../context';
import { Reflection } from '../../models/index';

/**
 * Analyze the given type literal node and create a suitable reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The type literal node that should be analyzed.
 * @return The resulting reflection or NULL.
 */
export function createTypeLiteral(context: Context, node: ts.TypeLiteralNode): Reflection {
    if (node.members) {
        node.members.forEach(node => {
            context.converter.convertNode(context, node);
        });
    }

    return context.scope;
}

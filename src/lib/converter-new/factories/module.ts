import * as ts from 'typescript';
import { Context } from '../context';
import { Reflection, ReflectionFlag, ReflectionKind, ProjectReflection } from '../../models/index';
import { createDeclaration } from './declaration';

/**
 * Analyze the given module node and create a suitable reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The module node that should be analyzed.
 * @return The resulting reflection or NULL.
 */
export function createModule(context: Context, node: ts.ModuleDeclaration): Reflection {
    const parent = context.scope;
    const reflection = createDeclaration(context, node, ReflectionKind.Module);

    context.withScope(reflection, context => {
        if (parent instanceof ProjectReflection && !context.isDeclaration && (!module || module.valueOf() === ts.ModuleKind.None.valueOf())) {
            reflection.setFlag(ReflectionFlag.Exported);
        }

        if (node.body) {
            context.converter.convertNode(context, node.body);
        }
    });

    return reflection;
}

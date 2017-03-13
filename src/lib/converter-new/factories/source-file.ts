import * as ts from 'typescript';

import { Reflection, ReflectionFlag } from '../../models';
import { createDeclaration, DeclarationReflection, ReflectionKind } from './declaration';
import { Context } from '../context';

export { DeclarationReflection }

export function createSourceFile(context: Context, node: ts.SourceFile, isModuleMode: boolean): Reflection {
    let result = context.scope;

    context.withSourceFile(node, context => {
        if (isModuleMode) {
            result = createDeclaration(context, node, ReflectionKind.ExternalModule);
            context.withScope(result, context => {
                ts.forEachChild(node, child => context.converter.visit(child, context));
                result.setFlag(ReflectionFlag.Exported);
            });
        } else {
            ts.forEachChild(node, child => context.converter.visit(child, context));
        }
    });

    return result;
}

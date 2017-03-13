import * as ts from 'typescript';
import { createDeclaration, DeclarationReflection, ReflectionKind } from './declaration';
import { getComment } from './comment';
import { Context } from '../context';

export { DeclarationReflection }

export function createClass(context: Context, node: ts.ClassDeclaration, name?: string) {
    let klass: DeclarationReflection;
    if (context.isInherit && context.inheritParent === node) {
        klass = context.scope as DeclarationReflection;
    } else {
        klass = createDeclaration(context, node, ReflectionKind.Class);
        const comment = getComment(node);

        if (comment) {
            klass.comment = comment;
        }
    }

    context.withScope(klass, node.typeParameters, context => {
        ts.forEachChild(node, child => context.converter.visit(child, context));
    });

    return klass;
}

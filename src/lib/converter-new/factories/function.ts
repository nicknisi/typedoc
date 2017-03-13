import * as ts from 'typescript';

import { createDeclaration, DeclarationReflection, ReflectionKind } from './declaration';
import { Context } from '../context';

export function createFunction(context: Context, node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.MethodSignature): DeclarationReflection {
    const parent = context.scope;
    const kind = parent.kind & ReflectionKind.ClassOrInterface ? ReflectionKind.Method : ReflectionKind.Module;

    const func = createDeclaration(context, node, kind);

    context.withScope(func, context => {
        if (!(node as any).body || !func.signatures) {
            func.signatures = func.signatures || [];
            // TODO: signatures
            // const funcContext = context.forScope(func);
        }
    });

    return func;
}

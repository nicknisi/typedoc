import * as ts from 'typescript';

import { createDeclaration, DeclarationReflection, ReflectionKind, addDeclarationComments } from './declaration';
import { createSignature } from './signature';
import { Context } from '../context';

export function createFunction(context: Context, node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.MethodSignature): DeclarationReflection {
    const parent = context.scope;
    const kind = parent.kind & ReflectionKind.ClassOrInterface ? ReflectionKind.Method : ReflectionKind.Module;

    const func = createDeclaration(context, node, kind);

    context.withScope(func, context => {
        if (!(node as any).body || !func.signatures) {
            func.signatures = func.signatures || [];
            const signature = createSignature(context, <ts.SignatureDeclaration> node, func.name, ReflectionKind.CallSignature);
            func.signatures.push(signature);
        } else {
            addDeclarationComments(func, node);
        }
    });

    return func;
}

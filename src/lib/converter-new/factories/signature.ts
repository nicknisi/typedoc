import * as ts from 'typescript';

import { ReflectionKind } from './declaration';
import { Reflection, SignatureReflection, ContainerReflection, DeclarationReflection, Type } from '../../models';
import { Context } from '../context';
import { createParameter } from './parameter';
import { createReferenceType } from './reference';

/**
 * Create a new signature reflection from the given node.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node  The TypeScript node containing the signature declaration that should be reflected.
 * @param name  The name of the function or method this signature belongs to.
 * @param kind  The desired kind of the reflection.
 * @returns The newly created signature reflection describing the given node.
 */
export function createSignature(context: Context, node: ts.SignatureDeclaration, name: string, kind: ReflectionKind): SignatureReflection {
    if (!(context.scope instanceof ContainerReflection)) {
        throw new Error('Expected container reflection.');
    }
    const parent = context.scope as DeclarationReflection;

    const signature = new SignatureReflection(parent, name, kind);
    context.registerReflection(signature, node);
    context.withScope(signature, node.typeParameters, true, context => {
        node.parameters.forEach((parameter: ts.ParameterDeclaration) => {
            createParameter(context, parameter);
        });

        signature.type = extractSignatureType(context, node);

        if (parent.inheritedFrom) {
            signature.inheritedFrom = createReferenceType(context, node.symbol, true);
        }
    });

    // context.trigger(Converter.EVENT_CREATE_SIGNATURE, signature, node);
    return signature;
}

/**
 * Extract the return type of the given signature declaration.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node  The signature declaration whose return type should be determined.
 * @returns The return type reflection of the given signature.
 */
function extractSignatureType(context: Context, node: ts.SignatureDeclaration): Type {
    const checker = context.checker;
    if (node.kind & ts.SyntaxKind.CallSignature || node.kind & ts.SyntaxKind.CallExpression) {
        try {
            const signature = checker.getSignatureFromDeclaration(node);
            return context.converter.convertType(context, node.type, checker.getReturnTypeOfSignature(signature));
        } catch (error) {}
    }

    if (node.type) {
        return context.converter.convertType(context, node.type);
    } else {
        return context.converter.convertType(context, node);
    }
}

/**
 * Analyze the given call signature declaration node and create a suitable reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The signature declaration node that should be analyzed.
 * @return The resulting reflection or NULL.
 */
export function createSignatureCall(context: Context, node: ts.FunctionExpression|ts.SignatureDeclaration|ts.FunctionDeclaration): Reflection {
    const scope = <DeclarationReflection> context.scope;

    if (scope instanceof DeclarationReflection) {
        const name = scope.kindOf(ReflectionKind.FunctionOrMethod) ? scope.name : '__call';
        const signature = createSignature(context, <ts.SignatureDeclaration> node, name, ReflectionKind.CallSignature);
        scope.signatures = scope.signatures || [];
        scope.signatures.push(signature);
    }

    return scope;
}

/**
 * Analyze the given index signature declaration node and create a suitable reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The signature declaration node that should be analyzed.
 * @return The resulting reflection or NULL.
 */
export function createIndexSignature(context: Context, node: ts.SignatureDeclaration): Reflection {
    const scope = <DeclarationReflection> context.scope;

    if (scope instanceof DeclarationReflection) {
        scope.indexSignature = createSignature(context, node, '__index', ReflectionKind.IndexSignature);
    }

    return scope;
}

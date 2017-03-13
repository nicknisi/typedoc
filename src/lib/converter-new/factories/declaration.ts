import * as ts from 'typescript';

import { Converter } from '../converter';
import { Context } from '../context';
import { Reflection, ReflectionKind, ReflectionFlag, ContainerReflection, DeclarationReflection } from '../../models';
import { getComment, applyCommentModifiers } from './comment';
import { createReferenceType } from './reference';

export {
    Converter,
    ReflectionKind,
    ContainerReflection,
    DeclarationReflection
}

const nonStaticKinds = new Set([
    ReflectionKind.Class,
    ReflectionKind.Interface,
    ReflectionKind.Module
]);

/**
 * Create a declaration reflection from the given TypeScript node.
 *
 * @returns The resulting reflection.
 */
export function createDeclaration(context: Context, node: ts.Node, kind: ReflectionKind, name?: string) {
    if (!(context.scope instanceof ContainerReflection)) {
        throw new Error('Expected container reflection.');
    }
    const parent = context.scope;
    const modifiers = ts.getCombinedModifierFlags(node);

    // Ensure we have a name for the reflection
    if (!name) {
        if (node.localSymbol) {
            name = node.localSymbol.name;
        } else if (node.symbol) {
            name = node.symbol.name;
        } else {
            return null;
        }
    }

    let isExported: boolean;
    if (parent.kindOf([ ReflectionKind.Module, ReflectionKind.ExternalModule ])) {
        isExported = false;
    } else {
        isExported = parent.flags.isExported;
    }

    if (kind === ReflectionKind.ExternalModule) {
        isExported = true;
    } else if (node.parent && node.parent.kind === ts.SyntaxKind.VariableDeclarationList) {
        const parentModifiers = ts.getCombinedModifierFlags(node.parent.parent);
        isExported = isExported || !!(parentModifiers & ts.ModifierFlags.Export);
    } else {
        isExported = isExported || Boolean(modifiers & ts.ModifierFlags.Export);
    }

    /*if (!isExported && converter.options.excludeNotExported) {
        return null;
    }*/

    const isPrivate = Boolean(modifiers & ts.ModifierFlags.Private);
    if (context.isInherit && isPrivate) {
        return null;
    }

    let isConstructorProperty = false;
    let isStatic = false;
    if (!nonStaticKinds.has(kind)) {
        isStatic = Boolean(modifiers & ts.ModifierFlags.Static);
        if (parent.kind === ReflectionKind.Class) {
            if (node.parent && node.parent.kind === ts.SyntaxKind.Constructor) {
                isConstructorProperty = true;
            } else if (!node.parent || node.parent.kind !== ts.SyntaxKind.ClassDeclaration) {
                isStatic = true;
            }
        }
    }

    let declaration = parent.childrenMap.get(node.symbol);

    parent.children = parent.children || [];

    if (!declaration) {
        declaration = new DeclarationReflection(parent, name, kind);

        declaration.setFlag(ReflectionFlag.Static, isStatic);
        declaration.setFlag(ReflectionFlag.Private, isPrivate);
        declaration.setFlag(ReflectionFlag.ConstructorProperty, isConstructorProperty);
        declaration.setFlag(ReflectionFlag.Exported, isExported);

        declaration.setFlag(ReflectionFlag.External, Boolean(context.isExternal));
        declaration.setFlag(ReflectionFlag.Protected, Boolean(modifiers & ts.ModifierFlags.Protected));
        declaration.setFlag(ReflectionFlag.Public, Boolean(modifiers & ts.ModifierFlags.Public));
        declaration.setFlag(ReflectionFlag.Optional, Boolean(node['questionToken']));

        // TODO:
        if (
            context.isInherit &&
            (node.parent === context.inheritParent || declaration.flags.isConstructorProperty)
        ) {
            if (!declaration.inheritedFrom) {
                declaration.inheritedFrom = createReferenceType(context, node.symbol, true);
                declaration.getAllSignatures().forEach((signature) => {
                    signature.inheritedFrom = createReferenceType(context, node.symbol, true);
                });
            }
        }

        if (declaration) {
            parent.children.push(declaration);
            parent.childrenMap.set(node.symbol, declaration);
            context.registerReflection(declaration, node);
        }
    } else {
        declaration = mergeDeclarations({} as any, declaration, node, kind);
    }

    if (declaration) {
        addDeclarationComments(declaration, node);
    }

    return declaration;
}

export function addDeclarationComments(reflection: Reflection, node?: ts.Node) {
    if (!node) {
        return;
    }

    const comment = getComment(node);
    if (reflection.kindOf(ReflectionKind.FunctionOrMethod) || (reflection.kindOf(ReflectionKind.Event) && reflection['signatures'])) {
        applyCommentModifiers(reflection, comment);
    } else if (reflection.kindOf(ReflectionKind.Module)) {
        // TODO: store module comment
    } else {
        applyCommentModifiers(reflection, comment);
        reflection.comment = comment;
    }
}

function mergeDeclarations(context: Context, reflection: DeclarationReflection, node: ts.Node, kind: ReflectionKind) {
    if (reflection.kind !== kind) {
        const weights = [ReflectionKind.Module, ReflectionKind.Enum, ReflectionKind.Class];
        const kindWeight = weights.indexOf(kind);
        const childKindWeight = weights.indexOf(reflection.kind);
        if (kindWeight > childKindWeight) {
            reflection.kind = kind;
        }
    }

    if (
        context.isInherit &&
        context.inherited.has(reflection) &&
        (node.parent === context.inheritParent || reflection.flags.isConstructorProperty)
    ) {
        if (!reflection.overwrites) {
            reflection.overwrites = createReferenceType(context, node.symbol, true);
            reflection.getAllSignatures().forEach((signature) => {
                signature.overwrites = createReferenceType(context, node.symbol, true);
            });
        }
        return null;
    }

    return reflection;
}

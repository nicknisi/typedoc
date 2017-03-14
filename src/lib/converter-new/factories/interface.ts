import * as ts from 'typescript';
import { createDeclaration } from './declaration';
import { Context } from '../context';
import { Reflection, DeclarationReflection, ReflectionKind } from '../../models/index';

export function createInterface(context: Context, node: ts.InterfaceDeclaration): Reflection {
    let reflection: DeclarationReflection;
    if (context.isInherit && context.inheritParent === node) {
        reflection = <DeclarationReflection> context.scope;
    } else {
        reflection = createDeclaration(context, node, ReflectionKind.Interface);
    }

    context.withScope(reflection, node.typeParameters, context => {
        if (node.members) {
            node.members.forEach((member, isInherit) => {
                context.converter.convertNode(context, member);
            });
        }

        const baseTypes = ts.getInterfaceBaseTypeNodes(node);
        if (baseTypes) {
            baseTypes.forEach(baseType => {
                const type = context.getTypeAtLocation(baseType);
                if (!context.isInherit) {
                    reflection.extendedTypes = reflection.extendedTypes || [];
                    if (!context.converter.convertType(context, baseType, type)) { debugger; }
                    reflection.extendedTypes.push(context.converter.convertType(context, baseType, type));
                }

                if (type && type.symbol) {
                    type.symbol.declarations.forEach(declaration => {
                        context.inherit(declaration, baseType.typeArguments);
                    });
                }
            });
        }
    });

    return reflection;
}

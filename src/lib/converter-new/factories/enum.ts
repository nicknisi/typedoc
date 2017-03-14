import * as ts from 'typescript';
import { createDeclaration } from './declaration';
import { Context } from '../context';
import { Reflection, ReflectionKind } from '../../models/index';
import { convertDefaultValue } from '../convert-expression';

/**
 * Analyze the given enumeration declaration node and create a suitable reflection.
 *
 * @param context The context object describing the current state the converter is in.
 * @param node The enumeration declaration node that should be analyzed.
 * @return The resulting reflection or NULL
 */
export function createEnum(context: Context, node: ts.EnumDeclaration): Reflection {
    const enumeration = createDeclaration(context, node, ReflectionKind.Enum);
    context.withScope(enumeration, context => {
        if (node.members) {
            for (const member of node.members) {
                convertMember(context, member);
            }
        }
    });

    return enumeration;
}

/**
 * Analyze the given enumeration member node and create a suitable reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node     The enumeration member node that should be analyzed.
 * @return The resulting reflection or NULL.
 */
function convertMember(context: Context, node: ts.EnumMember): Reflection | void {
    const member = createDeclaration(context, node, ReflectionKind.EnumMember);
    if (member) {
        member.defaultValue = convertDefaultValue(node);
    }

    return member;
}

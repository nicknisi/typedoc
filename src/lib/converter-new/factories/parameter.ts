import * as ts from 'typescript';

import { ReflectionFlag, ReflectionKind, ParameterReflection, SignatureReflection } from '../../models/reflections';
import { Context } from '../context';
import { convertDefaultValue } from '../convert-expression';

/**
 * Create a parameter reflection for the given node.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node  The parameter node that should be reflected.
 * @returns The newly created parameter reflection.
 */
export function createParameter(context: Context, node: ts.ParameterDeclaration): ParameterReflection {
    if (!(context.scope instanceof SignatureReflection)) {
        throw new Error('Expected signature reflection.');
    }
    const signature = context.scope;

    const parameter = new ParameterReflection(signature, node.symbol.name, ReflectionKind.Parameter);
    context.registerReflection(parameter, node);
    context.withScope(parameter, context => {
        if (ts.isBindingPattern(node.name)) {
            parameter.type = context.converter.convertType(context, node.name);
            parameter.name = '__namedParameters';
        } else {
            parameter.type = context.converter.convertType(context, node.type, context.getTypeAtLocation(node));
        }

        parameter.defaultValue = convertDefaultValue(node);
        parameter.setFlag(ReflectionFlag.Optional, !!node.questionToken);
        parameter.setFlag(ReflectionFlag.Rest, !!node.dotDotDotToken);
        parameter.setFlag(ReflectionFlag.DefaultValue, !!parameter.defaultValue);

        if (!signature.parameters) {
            signature.parameters = [];
        }
        signature.parameters.push(parameter);
    });

    // TODO: make sure this is being handled
    // context.trigger(Converter.EVENT_CREATE_PARAMETER, parameter, node);
    return parameter;
}

import * as ts from 'typescript';

import { Converter } from '../converter';
import { Context } from '../context';
import { ReferenceType } from './reference';
import { Decorator } from '../../models';
import { iterate } from '../utils';

type UsagesMap = Map<ts.Symbol, Decorator[]>;
const usagesMap = new WeakMap<Converter, UsagesMap>();

function getUsages(converter: Converter): UsagesMap {
    if (usagesMap.has(converter)) {
        return usagesMap.get(converter);
    }
    const map = new Map();
    usagesMap.set(converter, map);
    return map;
}

function extractArguments(args: ts.NodeArray<ts.Expression>, signature: ts.Signature) {
    const result: {
        [key: string]: string | string[];
        '...'?: string[];
    } = {};
    const parameters = signature.getParameters();
    args.forEach((arg, index) => {
        if (index < parameters.length) {
            const parameter = parameters[index];
            result[parameter.name] = ts.getTextOfNode(arg);
        } else {
            if (!result['...']) {
                result['...'] = [];
            }
            result['...'].push(ts.getTextOfNode(arg));
        }
    });

    return result;
}

export function createDecorator(context: Context, node: ts.Decorator, name?: string): Decorator {
    const parent = context.scope;

    let callExpression: ts.CallExpression;
    let identifier: ts.Expression;

    if (ts.isIdentifier(node.expression)) {
        identifier = node.expression;
    } else if (ts.isCallExpression(node.expression)) {
        callExpression = node.expression;
        identifier = node.expression.expression;
    }

    const decorator: Decorator = {
        name: ts.getTextOfNode(identifier)
    };

    const type = context.converter.checker.getTypeAtLocation(identifier);
    if (type && type.symbol) {
        decorator.type = new ReferenceType(decorator.name, type.symbol);

        if (callExpression && callExpression.arguments) {
            const signature = context.converter.checker.getResolvedSignature(callExpression);
            if (signature) {
                decorator.arguments = extractArguments(callExpression.arguments, signature);
            }
        }

        const usages = getUsages(context.converter);
        if (!usages.has(type.symbol)) {
            usages.set(type.symbol, []);
        }
        usages.get(type.symbol).push(new ReferenceType(parent.name, type.symbol, parent));
    }

    if (!parent.decorators) {
        parent.decorators = [];
    }

    parent.decorators.push(decorator);

    return decorator;
}

export function resolveDecorators(converter: Converter) {
    const usages = getUsages(converter);

    iterate(usages.entries(), ([ symbol, decorators ]) => {
        const reflection = converter.getReflectionFromSymbol(symbol);
        if (reflection) {
            reflection.decorates = decorators as any;
        }
    });
}

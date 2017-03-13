import * as ts from 'typescript';

import { Context } from '../context';
import { Type, Reflection } from '../../models';

export class ReferenceType extends Type {
    name: string;
    typeArguments: Type[];
    symbol: ts.Symbol;
    reflection: Reflection;

    constructor(name: string, symbol: ts.Symbol, reflection?: Reflection) {
        super();
        this.name = name;
        this.symbol = symbol;
        this.reflection = reflection;
    }

    clone(): Type {
        const clone = new ReferenceType(this.name, this.symbol, this.reflection);
        clone.isArray = this.isArray;
        clone.typeArguments = this.typeArguments;
        return clone;
    }

    equals(type: ReferenceType): boolean {
        return type instanceof ReferenceType &&
            type.isArray === this.isArray &&
            (type.symbol === this.symbol || type.reflection === this.reflection);
    }

    toObject(): any {
        const result: any = super.toObject();
        result.type = 'reference';
        result.name = this.name;

        if (this.reflection) {
            result.id = this.reflection.id;
        }

        if (this.typeArguments) {
            result.typeArguments = this.typeArguments.map((t) => t.toObject());
        }

        return result;
    }

    toString() {
        const name = this.reflection ? this.reflection.name : this.name;
        const arraySuffix = this.isArray ? '[]' : '';
        let typeArgs = '';
        if (this.typeArguments) {
            typeArgs += '<';
            typeArgs += this.typeArguments.map(arg => arg.toString()).join(', ');
            typeArgs += '>';
        }

        return name + typeArgs + arraySuffix;
    }
}

/**
 * Create a new reference type pointing to the given symbol.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param symbol  The symbol the reference type should point to.
 * @param includeParent  Should the name of the parent be provided within the fallback name?
 * @returns A new reference type instance pointing to the given symbol.
 */
export function createReferenceType(context: Context, symbol: ts.Symbol, includeParent?: boolean): ReferenceType {
    const checker = context.checker;
    let name    = checker.symbolToString(symbol);

    if (includeParent && symbol.parent) {
        name = checker.symbolToString(symbol.parent) + '.' + name;
    }

    return new ReferenceType(name, symbol);
}

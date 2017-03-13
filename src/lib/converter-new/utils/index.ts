import { Node, SyntaxKind, JSDocParameterTag, FunctionLikeDeclaration, Symbol, HeritageClause, isHeritageClause } from 'typescript';

export function isParameterTag(object: Node): object is JSDocParameterTag {
    return object.kind === SyntaxKind.JSDocParameterTag;
}

export function getFunctionImplementation<T extends FunctionLikeDeclaration>(symbol: Symbol) {
    return (symbol.getDeclarations() as T[]).find(declaration => Boolean(declaration.body));
}

export function isExtendsClause(node: Node): node is HeritageClause {
    return isHeritageClause(node) && node.token === SyntaxKind.ExtendsKeyword;
}

export function isImplementsClause(node: Node): node is HeritageClause {
    return isHeritageClause(node) && node.token === SyntaxKind.ImplementsKeyword;
}

export interface NodeWithLocals extends Node {
    locals: Map<string, Symbol>;
}

export function isNodeWithLocals(node: Node): node is NodeWithLocals {
    switch (node.kind) {
    case SyntaxKind.JSDocFunctionType:
    case SyntaxKind.ModuleDeclaration:
    case SyntaxKind.TypeAliasDeclaration:
    case SyntaxKind.MappedType:
    case SyntaxKind.SourceFile:
    case SyntaxKind.MethodDeclaration:
    case SyntaxKind.Constructor:
    case SyntaxKind.FunctionDeclaration:
    case SyntaxKind.MethodSignature:
    case SyntaxKind.GetAccessor:
    case SyntaxKind.SetAccessor:
    case SyntaxKind.CallSignature:
    case SyntaxKind.ConstructSignature:
    case SyntaxKind.IndexSignature:
    case SyntaxKind.FunctionType:
    case SyntaxKind.ConstructorType:
    case SyntaxKind.FunctionExpression:
    case SyntaxKind.ArrowFunction:
        return true;
    }

    return false;
}

export function iterate<T>(iterator: IterableIterator<T>, callback: (value: T) => void) {
    let result: IteratorResult<T>;
    while (result = iterator.next()) {
        if (result.done) {
            return;
        }
        callback(result.value);
    }
}

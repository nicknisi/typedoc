import 'typescript';

/**
 * Expose the internal TypeScript APIs that are used by TypeDoc
 */
declare module 'typescript' {
    interface Symbol {
        // https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/types.ts#L2658
        id?: number;
        // https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/types.ts#L2660
        parent?: Symbol;
    }

    interface Node {
        // https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/types.ts#L497
        symbol?: Symbol;
        // https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/types.ts#L500
        localSymbol?: Symbol;
        // https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/types.ts#L499
        nextContainer?: Node;
        jsDoc?: JSDoc[];
    }

    interface SourceFile {
        locals: Map<Symbol>;
    }

    /**
     * These functions are in "core" and are marked as @internal:
     * https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/core.ts#L9-L10
     */
    export function createCompilerDiagnostic(message: DiagnosticMessage, ...args: (string | number)[]): Diagnostic;
    export function createCompilerDiagnostic(message: DiagnosticMessage): Diagnostic;
    export function compareValues<T>(a: T, b: T): number;
    export function normalizeSlashes(path: string): string;
    export function getRootLength(path: string): number;
    export function getDirectoryPath(path: Path): Path;
    export function getDirectoryPath(path: string): string;

    export function isSourceFile(node: Node): node is SourceFile;
    export function isAccessor(node: Node): node is AccessorDeclaration;
    export function isDecorator(node: Node): node is Decorator;
    export function isClassLike(node: Node): node is ClassLikeDeclaration;
    export function isIdentifier(node: Node): node is Identifier;
    export function isCallExpression(node: Node): node is CallExpression;
    export function isMethodDeclaration(node: Node): node is MethodDeclaration;
    export function isObjectLiteralExpression(node: Node): node is ObjectLiteralExpression;
    export function isObjectLiteralOrClassExpressionMethod(node: Node): node is MethodDeclaration;
    export function isFunctionLike(node: Node): node is FunctionLikeDeclaration;
    export function isHeritageClause(node: Node): node is HeritageClause;
    export function isBindingPattern(node: Node): node is BindingPattern;

    export function getClassExtendsHeritageClauseElement(node: ClassLikeDeclaration | InterfaceDeclaration): HeritageClause;
    export function getClassImplementsHeritageClauseElements(node: ClassLikeDeclaration): HeritageClause[];
    export function getTextOfNode(node: Node, includeTrivia?: boolean): string;
    /**
     * Command line options
     *
     * https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/types.ts#L3344
     */
    export interface CommandLineOption {
        name: string;
        type: string;
        shortName: string;
        description: DiagnosticsEnumValue;
        paramType: DiagnosticsEnumValue;
    }

    // tslint:disable-next-line
    export const Diagnostics: {
        [key: string]: DiagnosticsEnumValue;
        FILE: DiagnosticsEnumValue;
        DIRECTORY: DiagnosticsEnumValue;
    };

    export interface DiagnosticsEnumValue {
        code: number;
        category: DiagnosticCategory;
        key: string;
        message: string;
    }

    export function getCommentsFromJSDoc(node: Node): string[];
    export function getSourceFileOfNode(node: Node): SourceFile;
    export function getJSDocCommentRanges(node: Node, text: string): CommentRange[];
}

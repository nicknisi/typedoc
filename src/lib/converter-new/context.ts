import * as ts from 'typescript';

import { Reflection, ProjectReflection, ContainerReflection, Type } from '../models';
import { createTypeParameter } from './factories/type-parameter';
import { Converter } from './converter';

function copyProperty<T, K extends keyof T>(source: T, properties: Partial<T>, property: K): T[K] {
    if (properties[property]) {
        return properties[property];
    }
    const value = source[property];
    if (!value) {
        return null;
    }
    if (Array.isArray(value)) {
        return value.slice(0) as any;
    }
    return Object.assign({}, value);
}

/**
 * The context describes the current state the converter is in.
 */
export class Context {
    /**
     * The converter instance that has created the context.
     */
    readonly converter: Converter;

    /**
     * The TypeChecker instance returned by the TypeScript compiler.
     */
    readonly checker: ts.TypeChecker;

    /**
     * The program that is currently processed.
     */
    readonly program: ts.Program;

    /**
     * The project that is currently processed.
     */
    readonly project: ProjectReflection;

    /**
     * The scope or parent reflection that is currently processed.
     */
    readonly scope: Reflection;

    /**
     * Is the current source file marked as being external?
     */
    readonly isExternal: boolean;

    /**
     * Is the current source file a declaration file?
     */
    readonly isDeclaration: boolean;

    /**
     * The currently set type parameters.
     */
    readonly typeParameters: Map<ts.Symbol, Type>;

    /**
     * The currently set type arguments.
     */
    readonly typeArguments: Type[];

    /**
     * Is the converter in inheritance mode?
     */
    readonly isInherit: boolean;

    /**
     * The node that has started the inheritance mode.
     */
    readonly inheritParent: ts.Node;

    /**
     * List symbol ids of inherited children already visited while inheriting.
     */
    readonly inheritedChildren = new Set<ts.Symbol>();

    /**
     * The names of the children of the scope before inheritance has been started.
     */
    readonly inherited: Set<Reflection>;

    /**
     * Create a new Context instance.
     *
     * @param converter  The converter instance that has created the context.
     * @param fileNames  A list of all files that have been passed to the TypeScript compiler.
     * @param checker  The TypeChecker instance returned by the TypeScript compiler.
     */
    constructor(converter: Converter, fileNames: string[], checker: ts.TypeChecker, program: ts.Program) {
        this.converter = converter;
        // this.fileNames = fileNames;
        this.checker = checker;
        this.program = program;

        const project = new ProjectReflection(converter.options.name);
        this.project = project;
        this.scope = project;

        /*if (converter.options.externalPattern) {
            this.externalPattern = new Minimatch(converter.options.externalPattern);
        }*/
    }

    /**
     * Return the compiler options.
     */
    getCompilerOptions(): ts.CompilerOptions {
        return this.converter.options.compilerOptions;
    }

    /**
     * Return the type declaration of the given node.
     *
     * @param node  The TypeScript node whose type should be resolved.
     * @returns The type declaration of the given node.
     */
    getTypeAtLocation(node: ts.Node): ts.Type {
        let nodeType: ts.Type;
        try {
            nodeType = this.checker.getTypeAtLocation(node);
        } catch (error) {
        }
        if (!nodeType) {
            if (node.symbol) {
                nodeType = this.checker.getDeclaredTypeOfSymbol(node.symbol);
            } else if (node.parent && node.parent.symbol) {
                nodeType = this.checker.getDeclaredTypeOfSymbol(node.parent.symbol);
            } else if (node.parent && node.parent.parent && node.parent.parent.symbol) {
                nodeType = this.checker.getDeclaredTypeOfSymbol(node.parent.parent.symbol);
            }
        }
        return nodeType;
    }

    /**
     * Return the current logger instance.
     *
     * @returns The current logger instance.
     */
    /*getLogger(): Logger {
        return this.converter.application.logger;
    }*/

    /**
     * Register a newly generated reflection.
     *
     * Ensures that the reflection is both listed in [[Project.reflections]] and
     * [[Project.symbolMapping]] if applicable.
     *
     * @param reflection  The reflection that should be registered.
     * @param node  The node the given reflection was resolved from.
     * @param symbol  The symbol the given reflection was resolved from.
     */
    registerReflection(reflection: Reflection, node: ts.Node, symbol?: ts.Symbol) {
        this.project.reflections[reflection.id] = reflection;

        symbol = symbol || (node ? node.symbol : null);
        if (!this.isInherit && symbol && !this.project.symbolMap.has(symbol)) {
            this.project.symbolMap.set(symbol, reflection);
        }
    }

    /**
     * Run the given callback with the context configured for the given source file.
     *
     * @param node  The TypeScript node containing the source file declaration.
     * @param callback  The callback that should be executed.
     */
    withSourceFile(node: ts.SourceFile, callback: (context: Context) => void) {
        /*const externalPattern = this.externalPattern;
        let isExternal = this.fileNames.indexOf(node.fileName) === -1;
        if (externalPattern) {
            isExternal = isExternal || externalPattern.match(node.fileName);
        }

        if (isExternal && this.converter.options.excludeExternals) {
            return;
        }*/

        let isDeclaration = node.isDeclarationFile;
        if (isDeclaration) {
            const lib = this.converter.getDefaultLib();
            const isLib = node.fileName.substr(-lib.length) === lib;
            if (!this.converter.options.includeDeclarations || isLib) {
                return;
            }
        }

        // this.trigger(Converter.EVENT_FILE_BEGIN, this.project, node);
        callback(this.clone({
            // isExternal,
            isDeclaration: node.isDeclarationFile
        }));
    }

    /**
     * @param callback  The callback function that should be executed with the changed context.
     */
    public withScope(scope: Reflection, callback: (context: Context) => void): void;

    /**
     * @param parameters  An array of type parameters that should be set on the context while the callback is invoked.
     * @param callback  The callback function that should be executed with the changed context.
     */
    public withScope(scope: Reflection, parameters: ts.NodeArray<ts.TypeParameterDeclaration>, callback: (context: Context) => void): void;

    /**
     * @param parameters  An array of type parameters that should be set on the context while the callback is invoked.
     * @param preserve  Should the currently set type parameters of the context be preserved?
     * @param callback  The callback function that should be executed with the changed context.
     */
    public withScope(scope: Reflection, parameters: ts.NodeArray<ts.TypeParameterDeclaration>, preserve: boolean, callback: (context: Context) => void): void;

    /**
     * Run the given callback with the scope of the context set to the given reflection.
     *
     * @param scope  The reflection that should be set as the scope of the context while the callback is invoked.
     */
    public withScope(scope: Reflection, ...args: any[]): void {
        if (!scope || !args.length) {
            return;
        }
        const callback = args.pop();
        const parameters = args.shift();

        const typeParameters = parameters ? this.extractTypeParameters(parameters, args.length > 0) : this.typeParameters;
        const typeArguments = null;

        callback(this.clone({
            scope,
            typeParameters,
            typeArguments
        }));
    }

    /**
     * Inherit the children of the given TypeScript node to the current scope.
     *
     * @param baseNode  The node whose children should be inherited.
     * @param typeArguments  The type arguments that apply while inheriting the given node.
     * @return The resulting reflection / the current scope.
     */
    inherit(baseNode: ts.Node, typeArguments?: ts.NodeArray<ts.TypeNode>): Reflection {
        if (!(this.scope instanceof ContainerReflection)) {
            throw new Error('Expected container reflection');
        }
        const target = this.scope;

        const inherited = new Set<Reflection>();
        let types: Type[] = null;

        if (baseNode.symbol) {
            if (this.inheritedChildren.has(baseNode.symbol)) {
                return target;
            } else {
                this.inheritedChildren.add(baseNode.symbol);
            }
        }

        if (target.childrenMap) {
            target.childrenMap.forEach(child => inherited.add(child));
        }

        if (typeArguments) {
            types = typeArguments.map((t) => this.converter.convertType(this, t));
        }

        const inheritContext = this.clone({
            isInherit: true,
            inheritParent: baseNode,
            inherited,
            typeArguments: types
        });

        this.converter.visit(baseNode, inheritContext);

        if (!inheritContext.isInherit) {
            delete (this as any).inheritedChildren;
        }

        return target;
    }

    /**
     * Convert the given list of type parameter declarations into a type mapping.
     *
     * @param parameters  The list of type parameter declarations that should be converted.
     * @param preserve  Should the currently set type parameters of the context be preserved?
     * @returns The resulting type mapping.
     */
    private extractTypeParameters(parameters: ts.NodeArray<ts.TypeParameterDeclaration>, preserve?: boolean): Map<ts.Symbol, Type> {
        const typeParameters = new Map<ts.Symbol, Type>(preserve ? this.typeParameters : []);

        parameters.forEach((declaration, index) => {
            if (this.typeArguments && this.typeArguments[index]) {
                typeParameters.set(declaration.symbol, this.typeArguments[index]);
            } else {
                typeParameters.set(declaration.symbol, createTypeParameter(this, declaration));
            }
        });

        return typeParameters;
    }

    private clone(properties: Partial<Context>): Context {
        const typeParameters = copyProperty(this, properties, 'typeParameters');
        const typeArguments = copyProperty(this, properties, 'typeArguments');

        return Object.assign(Object.create(this), properties, {
            typeParameters,
            typeArguments
        });
    }
}

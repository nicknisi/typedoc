import { Converter } from './lib/converter';
import { Converter as NewConverter } from './lib/converter-new';
// import { Reflection, ProjectReflection, DeclarationReflection, ReflectionKind, SignatureReflection, Comment, CommentTag, ReferenceType, ReflectionFlag, ContainerReflection } from './lib/models';
import * as ts from 'typescript';

const fileNames = [
    'test/converter/decorators/decorators.ts',
    'test/converter/stuff/one.ts',
    'test/converter/stuff/two.ts'
].map(name => ts.normalizeSlashes(name));

const converter = new Converter({
    compilerOptions: {}
});

const newConverter = new NewConverter({
    compilerOptions: {},
    fileNames
});

const result = converter.convert(fileNames);
result;

const newResult = newConverter.convert();
newResult;

/*const program = ts.createProgram(fileNames, converter.options.compilerOptions, (converter as any).compilerHost);
const checker = program.getTypeChecker();
const files = program.getSourceFiles();

const project = new ProjectReflection('foo');
let sourceFile: DeclarationReflection;*/

/*function getNodeName(node: ts.Node): string {
    if (node.localSymbol) {
        return node.localSymbol.name;
    }
    if (node.symbol) {
        return node.symbol.name;
    }
    return null;
}*/

/*function getCommentReflection(symbol: ts.Symbol): Comment {
    const comment = new Comment();
    const docComments = symbol.getDocumentationComment();
    const tags = symbol.getJsDocTags();

    comment.text = docComments.map(docComment => docComment.text).join('\n\n');
    comment.tags = tags.map(tag => {
        return new CommentTag(
            tag.name,
        );
    });
}*/

// function serializeClass(symbol: ts.Symbol, parent: Reflection) {
//     const klass = new DeclarationReflection(parent, symbol.getName(), ReflectionKind.Class);
//     klass.children = [];
//
//     symbol.members.forEach(member => {
//         member.declarations.forEach(declaration => {
//             const type = checker.getTypeOfSymbolAtLocation(member, declaration);
//             if (member.flags & ts.SymbolFlags.Method) {
//                 const method = new DeclarationReflection(klass, member.getName(), ReflectionKind.Method);
//                 method.signatures = type.getCallSignatures().map(callSignature => {
//                     const sig = new SignatureReflection(method, member.getName(), ReflectionKind.CallSignature);
//                     const comment = new Comment();
//                     comment.text = ts.displayPartsToString(callSignature.getDocumentationComment());
//                     /*comment.tags = callSignature.getJsDocTags().map(tag => {
//                         return new CommentTag(tag.name, undefined, tag.text);
//                     });*/
//                     callSignature.getParameters().forEach(param => {
//                         comment.tags.push(new CommentTag('param', param.getName(), ts.displayPartsToString(param.getDocumentationComment())));
//                     });
//
//                     return sig;
//                 });
//
//                 klass.children.push(method);
//             }
//         });
//     });
//
//     return klass;
// }

/*function isParameterTag(object: ts.Node): object is ts.JSDocParameterTag {
    return object.kind === ts.SyntaxKind.JSDocParameterTag;
}

function getComment(node: ts.Node, comment = new Comment()): Comment | undefined {
    const combined = ts.getCommentsFromJSDoc(node);
    if (combined && combined.length) {
        const split = combined.join('\n\n').split('\n\n');
        comment.shortText = (comment.shortText || '') + (comment.shortText ? '\n' : '') + split[0];

        const text = split.slice(1).join('\n\n');
        if (text) {
            comment.text = (comment.text || '') + (comment.text ? '\n' : '') + text;
        }

        comment.tags = (comment.tags || []);

        node.jsDoc.forEach(docNode => {
            if (!docNode.tags) {
                return;
            }
            docNode.tags.forEach(tag => {
                let parameterName: string;
                if (isParameterTag(tag)) {
                    parameterName = tag.parameterName.text;
                }
                // TODO: should this be unshift?
                comment.tags.push(new CommentTag(tag.tagName.text, parameterName, tag.comment));
            });
        });
    }
    return comment;
}

function getCommentFromNodes(nodes: ts.Node[]): Comment | undefined {
    const comment = new Comment();

    nodes.forEach(node => getComment(node, comment));

    return comment;
}

function getFunctionImplementation<T extends ts.FunctionLikeDeclaration>(symbol: ts.Symbol) {
    return (symbol.getDeclarations() as T[]).find(declaration => Boolean(declaration.body));
}

interface DeclarationOptions {
    parent: ContainerReflection;
    kind: ReflectionKind;
    modifiers: ts.ModifierFlags;
    name: string;
    isStatic?: boolean;
    isConstructorProperty?: boolean;
    isInherit?: boolean;
    isExternal?: boolean;
    isOptional?: boolean;
}

function createDeclaration(options: DeclarationOptions) {
    const { parent, kind, modifiers } = options;
    const declaration = new DeclarationReflection(parent, options.name, kind);

    let isExported: boolean;
    if (parent.kindOf([ ReflectionKind.Module, ReflectionKind.ExternalModule ])) {
        isExported = false;
    } else {
        isExported = parent.flags.isExported;
    }

    if (kind === ReflectionKind.ExternalModule) {
        isExported = true;
        // TODO: VariableDeclarationList
    } else {
        isExported = isExported || Boolean(modifiers & ts.ModifierFlags.Export);
    }

    /*if (!isExported && converter.options.excludeNotExported) {
        return null;
    }*/

    /*const isPrivate = Boolean(modifiers & ts.ModifierFlags.Private);
    if (options.isInherit && isPrivate) {
        return null;
    }

    declaration.setFlag(ReflectionFlag.Static, Boolean(options.isStatic));
    declaration.setFlag(ReflectionFlag.Private, isPrivate);
    declaration.setFlag(ReflectionFlag.ConstructorProperty, Boolean(options.isConstructorProperty));
    declaration.setFlag(ReflectionFlag.Exported, isExported);

    declaration.setFlag(ReflectionFlag.External, Boolean(options.isExternal));
    declaration.setFlag(ReflectionFlag.Protected, Boolean(modifiers & ts.ModifierFlags.Protected));
    declaration.setFlag(ReflectionFlag.Public, Boolean(modifiers & ts.ModifierFlags.Public));
    declaration.setFlag(ReflectionFlag.Optional, Boolean(options.isOptional));

    // TODO: constructor property thinger

    parent.children = parent.children || [];
    parent.children.push(declaration);

    return declaration;
}

function createConstructor(symbol: ts.Symbol, parent: ContainerReflection) {
    const impl = getFunctionImplementation<ts.ConstructorDeclaration>(symbol);
    const ctor = createDeclaration({
        parent,
        name: 'constructor',
        kind: ReflectionKind.Constructor,
        modifiers: ts.getCombinedModifierFlags(impl)
    });
    const comment = getCommentFromNodes(symbol.getDeclarations());

    if (comment) {
        ctor.comment = comment;
    }

    if (impl.parameters) {
        // TODO: handle property parameters
        impl.parameters.forEach(parameter => {
            const modifiers = ts.getCombinedModifierFlags(parameter);
            const visible = modifiers & (ts.ModifierFlags.Public | ts.ModifierFlags.Protected | ts.ModifierFlags.Private);

            if (!visible) {
                return;
            }
        });
    }

    const type = checker.getTypeOfSymbolAtLocation(symbol.parent, symbol.parent.valueDeclaration);
    ctor.signatures = type.getConstructSignatures().map(signature => {
        const sig = new SignatureReflection(parent, `new ${parent.name}`, ReflectionKind.ConstructorSignature);
        return sig;
    });

    return ctor;
}

/*function createSignature(signature: ts.Signature, parent: Reflection, kind: ReflectionKind, name = parent.name) {
    const sig = new SignatureReflection(parent, name, kind);
    return sig;
}*/

/*function createMethod(symbol: ts.Symbol, parent: ContainerReflection, isStatic = false) {
    const impl = getFunctionImplementation<ts.MethodDeclaration>(symbol);
    const method = createDeclaration({
        parent,
        name: symbol.getName(),
        kind: ReflectionKind.Method,
        modifiers: ts.getCombinedModifierFlags(impl),
        isStatic
    });
    const comment = getCommentFromNodes(symbol.getDeclarations());

    if (comment) {
        method.comment = comment;
    }

    const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    method.signatures = type.getCallSignatures().map(signature => {
        const sig = new SignatureReflection(method, method.name, ReflectionKind.CallSignature);
        // TODO: parse parameters
        return sig;
    });

    return method;
}

function createAccessor(symbol: ts.Symbol, parent: Reflection) {
    const accessor = new DeclarationReflection(parent, symbol.getName(), ReflectionKind.Accessor);
    const comment = getCommentFromNodes(symbol.getDeclarations());

    if (comment) {
        accessor.comment = comment;
    }

    const flags = symbol.getFlags();
    if (flags & ts.SymbolFlags.GetAccessor) {
        accessor.getSignature = new SignatureReflection(accessor, '__get', ReflectionKind.GetSignature);
        // TODO: set type
        // TODO: set inheritedFrom
    }
    if (flags & ts.SymbolFlags.SetAccessor) {
        accessor.setSignature = new SignatureReflection(accessor, '__set', ReflectionKind.SetSignature);
        // TODO: set type
        // TODO: set inheritedFrom
    }

    return accessor;
}

function createClass(node: ts.ClassLikeDeclaration, parent: ContainerReflection) {
    const symbol = checker.getSymbolAtLocation(node.name);
    const klass = createDeclaration({
        parent,
        name: symbol.getName(),
        kind: ReflectionKind.Class,
        modifiers: ts.getCombinedModifierFlags(node.name)
    });
    const comment = getComment(node);

    if (comment) {
        klass.comment = comment;
    }

    // static members
    symbol.exports.forEach(item => {
        if (item.getFlags() & ts.SymbolFlags.Property) {
        } else if (item.getFlags() & ts.SymbolFlags.Method) {
        }
    });

    // instance members
    symbol.members.forEach(member => {
        if (member.getFlags() & ts.SymbolFlags.Constructor) {
            createConstructor(member, klass);
        } else if (member.getFlags() & ts.SymbolFlags.Method) {
            createMethod(member, klass);
        } else if (member.getFlags() & ts.SymbolFlags.Accessor) {
            createAccessor(member, klass);
        }
    });

    ts.forEachChild(node, node => visit(node, klass));

    return klass;
}

function visit(node: ts.Node, reflection: DeclarationReflection) {
    if (ts.isDecorator(node)) {
        const identifier: ts.Identifier = ts.isCallExpression(node.expression) ? node.expression.expression : node.expression as any;
        console.log(identifier.getText());
    } else if (ts.isClassLike(node)) {
        createClass(node, reflection);
    } else if (ts.isAccessor(node)) {
        console.log(node);
    }
}

files.forEach(file => {
    sourceFile = new DeclarationReflection(project, file.fileName, ReflectionKind.ExternalModule);
    ts.forEachChild(file, node => visit(node, sourceFile));
});*/

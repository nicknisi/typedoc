import {SourceDirectory, SourceFile} from './lib/models/sources/index';
import {ProjectReflection} from './lib/models/reflections/project';
import {Reflection} from './lib/models/reflections/abstract';
import {DeclarationReflection} from './lib/models/reflections/declaration';
import {SignatureReflection} from './lib/models/reflections/signature';
import {ReflectionGroup} from './lib/models/ReflectionGroup';
import {Comment} from './lib/models/comments/comment';
import {CommentTag} from './lib/models/comments/tag';
import {createModelSchema, primitive, list, map, object} from 'serializr';

const SourceReference = {
    props: {
        file: object(SourceFile),
        fileName: primitive(),
        line: primitive(),
        character: primitive(),
        url: primitive()
    }
};


createModelSchema(CommentTag, {
    tagName: primitive(),
    paramName: primitive(),
    text: primitive()
});

createModelSchema(Comment, {
    shortText: primitive(),
    text: primitive(),
    returns: primitive(),
    tags: object(CommentTag)
});

createModelSchema(DeclarationReflection, {
    shortTet: primitive(),
    text: primitive(),
    returns: primitive()
});
createModelSchema(DeclarationReflection, {
    type: primitive(),
    typeParameterReflection: primitive(),
    signatures: list(object(SignatureReflection)),
    getSignature: object(SignatureReflection),
    setSignature: object(SignatureReflection),
    defaultValue: primitive(),
    overwrites: primitive(),
    inheritedFrom: primitive(),
    implementationOf: primitive(),
    extendedTypes: primitive(),
    extendedBy: primitive(),
    implementedTypes: primitive(),
    implementedBy: primitive(),
    typeHierarchy: primitive()
});

createModelSchema(ReflectionGroup, {
    title: primitive(),
    kind: primitive(),
    children: list(object(<any> Reflection)),
    cssClasses: primitive(),
    //allChildrenHaveOwnDocument
    allChildrenAreInherited: primitive(),
    allChildrenArePrivate: primitive(),
    allChildrenAreProtectedOrPrivate: primitive(),
    allChildrenAreExternal: primitive(),
    someChildrenAreExported: primitive()
});

createModelSchema(SourceFile, {
    fullFileName: primitive(),
    fileName: primitive(),
    name: primitive(),
    url: primitive(),
    parent: object(SourceDirectory),
    reflections: list(object(<any> Reflection)),
    groups: list(object(ReflectionGroup))
});

createModelSchema(SourceDirectory, {
    parent: object(SourceDirectory),
    directories: map(object(SourceDirectory)),
    groups: list(object(ReflectionGroup)),
    files: list(object(SourceFile)),
    name: primitive(),
    dirName: primitive(),
    url: primitive()
});

createModelSchema(<any> Reflection, {
    id: primitive(),
    name: primitive(),
    originalName: primitive(),
    kind: primitive(),
    kindString: primitive(),
    flags: list(primitive()),
    parent: object(<any> Reflection),
    comment: object(Comment),
    sources: list(SourceReference),
    decorators: primitive(),
    decorates: primitive(),
    url: primitive(),
    anchor: primitive(),
    hasOwnDocument: primitive(),
    cssClasses: primitive()

});

createModelSchema(ProjectReflection, {
    // ProjectReflection
    reflections: map(object(<any> Reflection)),
    // symbolMapping: list(primitive()),
    directory: object(SourceDirectory),
    files: list(object(SourceFile)),
    name: primitive(),
    readme: primitive(),
    // packageInfo: object(),

    // ContainerReflection
    children: list(object(DeclarationReflection)),
    groups: list(object(ReflectionGroup)),

    // Reflection
    id: primitive(),
    // name: primitive(),
    originalName: primitive(),
    kind: primitive(),
    kindString: primitive(),
    flags: list(primitive()),
    parent: object(<any> Reflection),
    comment: object(Comment),
    // sources: primitive(),
    decorators: primitive(),
    decorates: primitive(),
    url: primitive(),
    anchor: primitive(),
    hasOwnDocument: primitive(),
    cssClasses: primitive()
});

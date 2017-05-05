import {SourceDirectory, SourceFile} from './lib/models/sources/index';
import {ProjectReflection} from './lib/models/reflections/project';
import {Reflection} from './lib/models/reflections/abstract';
import {ReflectionGroup} from './lib/models/ReflectionGroup';
import {DeclarationReflection} from './lib/models/reflections/declaration';
import {ReflectionGroup} from './lib/models/ReflectionGroup';
import {serialize, createModelSchema, primitive, reference, list, object, identifier} from 'serializr';

createModelSchema(SourceDirectory, {
	parent: object(SourceDirectory),
	directories: list(object(SourceDirectory)),
	groups: list(object(ReflectionGroup)),
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
	sources: list(primitive()),
	decorators: list(primitive()),
	decorates: list(primitive()),
	url: primitive(),
	anchor: primitive(),
	hasOwnDocument: primitive(),
	cssClasses: primitive()

});

createModelSchema(ProjectReflection, {
	// ProjectReflection
	reflections: list(object(<any> Reflection)),
	symbolMapping: list(primitive()),
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
	sources: list(primitive()),
	decorators: list(primitive()),
	decorates: list(primitive()),
	url: primitive(),
	anchor: primitive(),
	hasOwnDocument: primitive(),
	cssClasses: primitive()
});

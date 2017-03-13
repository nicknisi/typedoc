export interface Foo {
}

/**
 * A decorated class.
 *
 * ;aldfjks asd;fjklasjsdaf;ljdasf asd;fjklasd;lkj asdfklj asd;fklj asdfkl;j 
 * ;aldfjksa;ldfjkaf lsdj fl; asd;fjklas;dfjkl las dfl;kj asdf;ladfjks;l asd
 * ;lkajsdf a;l;j dsaflkjasd;fjkl asjkl; af jasfdl;kjasd;fjk
 *
 * @foo
 */
@decoratorWithOptions({
    name: 'Name of class'
})
class DecoratedClass
{
    static staticFoo: string;
    static staticBar() {
    }
    /**
     * A decorated method.
     *
     * @param thing a description
     * @readonly
     * @hidden
     * @foo
     */
    /**
     * Another comment
     *
     * @bar
     */
    decoratedMethod(): void;
    decoratedMethod(thing: any): void;
    @decoratorAtom
    @decoratorWithParam(false)
    decoratedMethod(thing?: any) { }

    get foo(): string { return ''; }
    set foo(value: string) {  }
    set bar(value: string) { }

    /**
     * Short
     *
     * Text
     */
    constructor();
    /**
     * @param foo A param
     */
    constructor(baz: any);
    constructor(private baz?: any) {}
}

class Blah extends DecoratedClass {
}

namespace Blah {
    export interface Boom {
    }
}

/**
 * A decorator with no options.
 */
function decoratorAtom(target:Object, propertyKey:string|symbol, descriptor:TypedPropertyDescriptor<any>) {
    target[propertyKey].writable = true;
}


/**
 * A decorator with a parameter.
 *
 * @param value  The parameter of this decorator.
 */
function decoratorWithParam(value:boolean):MethodDecorator {
    return function (target:Object, propertyKey:string|symbol, descriptor:TypedPropertyDescriptor<any>) {
        target[propertyKey].enumerable = value;
    }
}


/**
 * A decorator consuming an options object.
 *
 * @param options  The options object of this decorator.
 * @param options.name  A property on the options object of this decorator.
 */
function decoratorWithOptions(options:{name:string}):ClassDecorator {
    return function (target) {
        target.options = options;
    }
}

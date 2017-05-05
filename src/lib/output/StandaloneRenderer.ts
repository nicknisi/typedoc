// import { Renderer } from './renderer';
// import { Theme } from './theme';
import { resolve, join, dirname } from 'path';
import { mkdirpSync, existsSync, statSync, removeSync, readdirSync } from 'fs-extra';
import { DefaultTheme } from './themes/DefaultTheme';
import { ReflectionKind } from '../models/reflections';

export interface TemplateMapping {
    kind: ReflectionKind[];
    isLeaf: boolean;
    directory: string;
    template: string;
}

export interface UrlMapping {
    url: string;
    model: any;
    template: string;
}

export class Theme {
    getUrls(json: any): UrlMapping[] {
        const urls: UrlMapping[] = [];
        const entryPoint = this.getEntryPoint(json);
        return urls;
    }

    getEntryPoint(json: any) {
    }
}

const mappings: TemplateMapping[] = [
    {
        kind: [ReflectionKind.Class],
        isLeaf: false,
        directory: 'classes',
        template: 'reflection.hbs'
    },
    {
        kind: [ReflectionKind.Interface],
        isLeaf: false,
        directory: 'interfaces',
        template: 'reflection.hbs'
    },
    {
        kind: [ReflectionKind.Enum],
        isLeaf: false,
        directory: 'enums',
        template: 'reflection.hbs'
    },
    {
        kind: [ReflectionKind.Module, ReflectionKind.ExternalModule],
        isLeaf: false,
        directory: 'modules',
        template: 'reflection.hbs'
    }
];

function kindOf(actualKind: any, kind: any): boolean {
    if (Array.isArray(kind)) {
        for (let k of kind) {
            if ((actualKind & k) !== 0) {
                return true;
            }
        }
        return false;
    } else {
        return (actualKind & kind) !== 0;
    }
}

function getMapping(reflection: any): TemplateMapping | null {
    for (const mapping of mappings) {
        if (kindOf(reflection.kind, mapping.kind)) {
            return mapping;
        }
    }
    return null;
}

function buildUrls(reflection: any, urls: UrlMapping[]): UrlMapping[] {
    const mapping = getMapping(reflection);
    if (mapping) {
        const url = [ mapping.directory, `${getUrl(reflection)}.html` ].join('/');
        urls.push({ url, model: reflection, template: mapping.template});
        reflection.url = url;
        reflection.hasOwnDocument = true;
        for (let key in reflection.children) {
            const child = reflection.children[key];
            if (mapping.isLeaf) {

            }
        }
    }
}

function traverse(children: any[], callback) {
    if (children) {
        children.forEach(child => {
            callback(child, )
        })
    }
}

function applyAnchorUrl(reflection: any, container: any) {
    let anchor = getUrl(reflection, container, '.');
    if (reflection.isStatic) {
        anchor = `static-${anchor}`;
    }

    reflection.url = `${container.url}#${anchor}`;
    reflection.anchor = anchor;
    reflection.hasOwnDocument = false;

    reflection.
}

export default class StandaloneRenderer {
    themeName: string;
    theme: Theme;
    readme: string = 'none';

    constructor(themeName: string) {
        this.themeName = themeName;
    }

    render(json: any, outputDirectory: string): void {
        if (!this.prepareTheme() || !this.prepareOutputDirectory(outputDirectory)) {
            return;
        }

        const output: any = {};
        output.outputDirectory = outputDirectory;
        output.urls = this.theme.getUrls(json);
    }

    private prepareTheme(): boolean {
        if (!this.theme) {
            const themeName = this.themeName;
            let path = resolve(themeName);
            if (!existsSync(path)) {
                path = join(dirname(require.resolve('typedoc-default-themes')), themeName);
                if (!existsSync(path)) {
                    console.log(`The theme ${themeName} could not be found`);
                    return false;
                }
            }
            this.theme = new DefaultTheme(this as any, path);
        }
        this.theme.resources.activate();
        return true;
    }

    private prepareOutputDirectory(directory: string): boolean {
        if (existsSync(directory)) {
            if (!statSync(directory).isDirectory()) {
                console.log('The target is not a directory');
                return false;
            }

            if (readdirSync(directory).length === 0) {
                return true;
            }

            try {
                removeSync(directory);
            } catch (error) {
                console.log(`Could not empty the directory: ${directory}`);
            }
        } else {
            try {
                mkdirpSync(directory);
            } catch (error) {
                console.log(`Could not create the output direcotry: ${directory}`);
                return false;
            }
        }

        return true;
    }
}

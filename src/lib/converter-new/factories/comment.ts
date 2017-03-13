import * as ts from 'typescript';
import { isParameterTag } from '../utils';

import { Comment, CommentTag, Reflection, ReflectionFlag, ReflectionKind } from '../../models';

export function getComment(node: ts.Node, comment?: Comment): Comment | undefined {
    const combined = ts.getCommentsFromJSDoc(node);
    if (combined && combined.length) {
        const split = combined.join('\n\n').split('\n\n');
        if (!comment) {
            comment = new Comment();
        }
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

        return comment;
    }
}

export function getCommentFromNodes(nodes: ts.Node[]): Comment | undefined {
    let comment: Comment;

    nodes.forEach(node => {
        comment = getComment(node, comment);
    });

    return comment;
}

function removeTags(comment: Comment, tagName: string) {
    if (!comment || !comment.tags) {
        return;
    }

    let i = 0, c = comment.tags.length;
    while (i < c) {
        if (comment.tags[i].tagName === tagName) {
            comment.tags.splice(i, 1);
            c--;
        } else {
            i++;
        }
    }
}

export function applyCommentModifiers(reflection: Reflection, comment: Comment) {
    if (comment.hasTag('private')) {
        reflection.setFlag(ReflectionFlag.Private);
        removeTags(comment, 'private');
    }

    if (comment.hasTag('protected')) {
        reflection.setFlag(ReflectionFlag.Protected);
        removeTags(comment, 'protected');
    }

    if (comment.hasTag('public')) {
        reflection.setFlag(ReflectionFlag.Public);
        removeTags(comment, 'public');
    }

    if (comment.hasTag('event')) {
        reflection.kind = ReflectionKind.Event;
        // reflection.setFlag(ReflectionFlag.Event);
        removeTags(comment, 'event');
    }
}

/**
 * Return the parsed comment of the given TypeScript node.
 *
 * @param node  The node whose comment should be returned.
 * @return The parsed comment as a [[Comment]] instance or NULL if
 *     no comment is present.
 */
export function createComment(node: ts.Node): Comment {
    const comment = getRawComment(node);
    if (comment == null) {
        return null;
    }

    return parseComment(comment);
}

/**
 * Check whether the given module declaration is the topmost.
 *
 * This funtion returns TRUE if there is no trailing module defined, in
 * the following example this would be the case only for module <code>C</code>.
 *
 * ```
 * module A.B.C { }
 * ```
 *
 * @param node  The module definition that should be tested.
 * @return TRUE if the given node is the topmost module declaration, FALSE otherwise.
 */
function isTopmostModuleDeclaration(node: ts.ModuleDeclaration): boolean {
    if (node.nextContainer && node.nextContainer.kind === ts.SyntaxKind.ModuleDeclaration) {
        let next = <ts.ModuleDeclaration> node.nextContainer;
        if (node.name.end + 1 === next.name.pos) {
            return false;
        }
    }

    return true;
}

/**
 * Return the root module declaration of the given module declaration.
 *
 * In the following example this function would always return module
 * <code>A</code> no matter which of the modules was passed in.
 *
 * ```
 * module A.B.C { }
 * ```
 */
function getRootModuleDeclaration(node: ts.ModuleDeclaration): ts.Node {
    while (node.parent && node.parent.kind === ts.SyntaxKind.ModuleDeclaration) {
        let parent = <ts.ModuleDeclaration> node.parent;
        if (node.name.pos === parent.name.end + 1) {
            node = parent;
        } else {
            break;
        }
    }

    return node;
}

/**
 * Return the raw comment string for the given node.
 *
 * @param node  The node whose comment should be resolved.
 * @returns     The raw comment string or NULL if no comment could be found.
 */
export function getRawComment(node: ts.Node): string {
    if (node.parent && node.parent.kind === ts.SyntaxKind.VariableDeclarationList) {
        node = node.parent.parent;
    } else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
        if (!isTopmostModuleDeclaration(<ts.ModuleDeclaration> node)) {
            return null;
        } else {
            node = getRootModuleDeclaration(<ts.ModuleDeclaration> node);
        }
    }

    const sourceFile = ts.getSourceFileOfNode(node);
    const comments = ts.getJSDocCommentRanges(node, sourceFile.text);
    if (comments && comments.length) {
        let comment: ts.CommentRange;
        if (node.kind === ts.SyntaxKind.SourceFile) {
            if (comments.length === 1) {
                return null;
            }
            comment = comments[0];
        } else {
            comment = comments[comments.length - 1];
        }

        return sourceFile.text.substring(comment.pos, comment.end);
    } else {
        return null;
    }
}

/**
 * Parse the given doc comment string.
 *
 * @param text     The doc comment string that should be parsed.
 * @param comment  The [[Models.Comment]] instance the parsed results should be stored into.
 * @returns        A populated [[Models.Comment]] instance.
 */
export function parseComment(text: string, comment: Comment = new Comment()): Comment {
    let currentTag: CommentTag;
    let shortText = 0;

    function consumeTypeData(line: string): string {
        line = line.replace(/^\{[^\}]*\}+/, '');
        line = line.replace(/^\[[^\[][^\]]*\]+/, '');
        return line.trim();
    }

    function readBareLine(line: string) {
        if (currentTag) {
            currentTag.text += '\n' + line;
        } else if (line === '' && shortText === 0) {
            // Ignore
        } else if (line === '' && shortText === 1) {
            shortText = 2;
        } else {
            if (shortText === 2) {
                comment.text += (comment.text === '' ? '' : '\n') + line;
            } else {
                comment.shortText += (comment.shortText === '' ? '' : '\n') + line;
                shortText = 1;
            }
        }
    }

    function readTagLine(line: string, tag: RegExpExecArray) {
        let tagName = tag[1].toLowerCase();
        let paramName: string;
        line = line.substr(tagName.length + 1).trim();

        if (tagName === 'return') { tagName = 'returns'; }
        if (tagName === 'param' || tagName === 'typeparam') {
            line = consumeTypeData(line);
            const param = /[^\s]+/.exec(line);
            if (param) {
                paramName = param[0];
                line = line.substr(paramName.length + 1).trim();
            }
            line = consumeTypeData(line);
            line = line.replace(/^\-\s+/, '');
        } else if (tagName === 'returns') {
            line = consumeTypeData(line);
        }

        currentTag = new CommentTag(tagName, paramName, line);
        if (!comment.tags) { comment.tags = []; }
        comment.tags.push(currentTag);
    }

    function readLine(line: string) {
        line = line.replace(/^\s*\*? ?/, '');
        line = line.replace(/\s*$/, '');

        const tag = /^@(\w+)/.exec(line);
        if (tag) {
            readTagLine(line, tag);
        } else {
            readBareLine(line);
        }
    }

    // text = text.replace(/^\s*\/\*+\s*(\r\n?|\n)/, '');
    // text = text.replace(/(\r\n?|\n)\s*\*+\/\s*$/, '');
    text = text.replace(/^\s*\/\*+/, '');
    text = text.replace(/\*+\/\s*$/, '');
    text.split(/\r\n?|\n/).forEach(readLine);

    return comment;
}

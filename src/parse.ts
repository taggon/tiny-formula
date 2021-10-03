import { Context } from './context';
import { InvalidTypeError, UnexpectedTokenError } from './errors';

export type Expression = Func | Group | Literal | Operator | Cell | CellRange;

export interface Literal {
    type: 'literal';
    value: string | number | boolean | null;
}

export interface Operator {
    type: 'operator';
    op:
        | '+'
        | '-'
        | '/'
        | '*'
        | '^'
        | '%'
        | '<'
        | '>'
        | '<='
        | '>='
        | '<>'
        | '!=';
}
export interface Cell {
    type: 'cell';
    pos: { row: number; col: number };
    name: string;
}

export interface CellRange {
    type: 'cellRange';
    start: Cell;
    end: Cell;
}

export interface Group {
    type: 'group';
    items: Array<Expression>;
}

export interface Func {
    type: 'func';
    name: string;
    args: Array<Expression>;
}

function literal(expr: string): Literal {
    let value = null;

    if (expr === 'TRUE' || expr === 'FALSE') {
        value = expr === 'TRUE';
    } else if (expr === 'NULL') {
        value = null;
    } else if (expr[0] === '"') {
        value = expr.substr(1, expr.length - 2).replace(/""/g, '"');
    } else {
        value = parseFloat(expr);
    }

    return {
        type: 'literal',
        value,
    };
}

function operator(expr: string): Operator {
    return {
        type: 'operator',
        op: expr as Operator['op'],
    };
}

/**
 * Convert cell name to position
 * @param {String} name cell name
 */
function cellPos(name: string): Cell['pos'] {
    const [_, col, row] = name.match(
        /^([A-Z]+)([1-9]\d*)$/
    ) as RegExpMatchArray;

    const colPos = col
        .split('')
        .reverse()
        .reduce((pos, ch, idx) => {
            return pos + (ch.charCodeAt(0) - 65) * Math.pow(26, idx);
        }, 0);

    return { col: colPos, row: parseInt(row, 10) - 1 };
}

function cell(expr: string): Cell | CellRange {
    const [start, end] = expr.split(':');
    const startCell = {
        type: 'cell',
        name: start,
        pos: cellPos(start),
    } as Cell;

    if (!end) {
        return startCell;
    }

    return {
        type: 'cellRange',
        start: startCell,
        end: cell(end),
    } as CellRange;
}

function func(expr: string): Func {
    const name = expr.substr(0, expr.length - 1).trim();

    return {
        type: 'func',
        name,
        args: [],
    };
}

function group(): Group {
    return {
        type: 'group',
        items: [],
    };
}

const LIT = 1,
    OP = 2,
    CELL = 3,
    FN = 4,
    COMMA = 5,
    OPEN_PAREN = 6,
    CLOSE_PAREN = 7;

/**
 * Parse a formula into an AST-like structure
 * @param {String} formula string to parse
 * @returns {Expression|null} Parsed structure or null if parsing failed
 */
export function parse(formula: string): Expression | null {
    const regex =
        /(\d+(?:\.\d+)?|"(?:""|[^"])*"|TRUE|FALSE|NULL)|([-+\/*^%&]|<>|[<>]=?|!=)|([A-Z]+[1-9]\d*(?::[A-Z]+[1-9]\d*)?)|([A-Z][A-Z\d]*\s*\()|(,)|(\()|(\))/g;
    const context = new Context();
    let match: RegExpExecArray | null = null;
    let lastIndex = 0;

    formula = formula.replace(/\s+$/, ''); // right trim

    while ((match = regex.exec(formula))) {
        const orphan = formula.substring(lastIndex, match.index).trim();
        lastIndex = regex.lastIndex;

        if (orphan) {
            throw new UnexpectedTokenError(orphan, lastIndex);
        }

        if (match[LIT]) {
            context.add(literal(match[LIT]));
            continue;
        }

        if (match[OP]) {
            context.add(operator(match[OP]));
            continue;
        }

        if (match[CELL]) {
            context.add(cell(match[CELL]));
            continue;
        }

        if (match[FN]) {
            const fn = func(match[FN]);
            context.add(fn);
            context.push(fn);
            continue;
        }

        if (match[COMMA]) {
            if (context.is('func') && context.siblings.length > 0) {
                context.punctuate();
                continue;
            }
            lastIndex--;
        }

        if (match[OPEN_PAREN]) {
            const g = group();
            context.add(g);
            context.push(g);
            continue;
        }

        if (match[CLOSE_PAREN]) {
            context.pop();
            continue;
        }
    }

    const remaining = formula.substr(lastIndex);
    if (remaining) {
        if (remaining) {
            throw new UnexpectedTokenError(remaining, lastIndex);
        }
    }

    if (context.first.items.length === 0) {
        return null;
    }

    if (context.first.items.length > 1) {
        return context.first;
    }

    return context.first.items[0];
}

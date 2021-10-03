import { parse, Expression } from './parse';
import { UndefinedFunctionError, CellNotFoundError } from './errors';

function arrayCut(array: any[], start: number, end: number, defaultValue: any) {
    const min = Math.min(start, end);
    const max = Math.max(start, end) + 1;
    const count = max - min;
    const result = array.slice(min, max);

    if (result.length < count) {
        return result.concat(Array(count - result.length).fill(defaultValue));
    }

    return result;
}

export function calc(
    formular: string,
    dataset: any[][] = [],
    funcs?: Record<string, Function>
): any {
    const parsed = parse(formular);

    if (parsed === null) return null;

    const traverse: any = (expr: Expression) => {
        switch (expr.type) {
            case 'cell':
                const data = dataset[expr.pos.row]?.[expr.pos.col];
                if (data === undefined) {
                    throw new CellNotFoundError(expr.name);
                }
                return data;
            case 'cellRange':
                const rows = arrayCut(
                    dataset,
                    expr.start.pos.row,
                    expr.end.pos.row,
                    []
                );
                return rows.map((row) =>
                    arrayCut(row, expr.start.pos.col, expr.end.pos.col, null)
                );
            case 'func':
                if (funcs?.[expr.name] === undefined) {
                    throw new UndefinedFunctionError(expr.name);
                }
                const args = expr.args.map(traverse) as any[];
                return funcs?.[expr.name](...args);
            case 'literal':
                return expr.value;
            case 'operator':
                const trans: Record<string, string> = {
                    '&': '+""+',
                    '^': '**',
                    '<>': '!==',
                    '!=': '!==',
                };
                return trans[expr.op] ?? expr.op;
            case 'group':
                if (expr.items.length < 2) {
                    return expr.items.map(traverse)[0] || null;
                }

                const items: any[] = expr.items
                    .map(traverse)
                    .map((value, idx) => {
                        if (expr.items[idx].type !== 'operator') {
                            if (typeof value === 'string') {
                                return `"${value.replace(/"/g, '\\&')}"`;
                            }
                            if (typeof value === 'boolean') {
                                return value ? 'true' : 'false';
                            }
                        }
                        return value;
                    });

                return new Function(`return ${items.join('')}`)();
        }
    };

    return traverse(parsed);
}

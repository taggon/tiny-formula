import { calc } from '../src/calc';
import { CellNotFoundError, UndefinedFunctionError } from '../src/errors';

const data = [
    [10, 20, 30, 40, 50],
    [22, 33, 44, 55, 66],
    [102.2, 59.5, 22.861, 0.5],
];

describe('calc()', () => {
    const _calc = (formula: string, funcs?: Record<string, Function>) => {
        return calc(formula, data, funcs);
    };

    it('returns null for null parsed result', () => {
        expect(calc('')).toBeNull();
        expect(calc('()')).toBeNull();
    });

    it('returns a cell value as a literal', () => {
        expect(_calc('A1')).toBe(10);
    });

    it('returns a cell range as a two-dimensional array', () => {
        expect(_calc('A1:C1')).toEqual([[10, 20, 30]]);
        expect(_calc('B2:C3')).toEqual([
            [33, 44],
            [59.5, 22.861],
        ]);
        expect(_calc('C2:F2')).toEqual([[44, 55, 66, null]]);
    });

    it('calculates arithmetics', () => {
        expect(calc('10 + 5')).toBe(15);
        expect(_calc('A2 / 2')).toBe(11);
        expect(_calc('100 + A1 * B2')).toBe(100 + 10 * 33);
        expect(_calc('B3*10^2')).toBe(59.5 * 10 ** 2);
    });

    it('concatenates strings with & operator', () => {
        expect(_calc('"Hello, " & "world"')).toBe('Hello, world');
        expect(_calc('"Repeat " & (A1) & " times"')).toBe('Repeat 10 times');
    });

    it('calls user-defined functions', () => {
        const funcs = {
            ADD: (a: any, b: any) => a + b,
            IF: (b: boolean, yes: any, no: any) => (b ? yes : no),
        };
        expect(_calc('ADD(A1,D1)', funcs)).toBe(10 + 40);
        expect(_calc('IF(TRUE,C1,C2)', funcs)).toBe(30);
        expect(_calc('IF(FALSE,C1,C2)', funcs)).toBe(44);
        expect(_calc('IF(TRUE<>FALSE,C1,C2)', funcs)).toBe(30);
    });

    it('throws an exception when using a cell that does not exist', () => {
        expect(() => _calc('A10')).toThrowError(CellNotFoundError);
    });

    it('throws an exception when calling undefined function', () => {
        expect(() => _calc('FUNC(A10)')).toThrowError(UndefinedFunctionError);
    });
});

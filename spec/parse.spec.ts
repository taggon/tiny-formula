import { UnexpectedTokenError } from '../src/errors';
import { parse, CellRange, Func, Group } from '../src/parse';

describe('parse()', () => {
    it('returns null for empty formula', () => {
        expect(parse('')).toBeNull();
    });

    it('parses simple literal values including TRUE, FALSE, and NULL', () => {
        expect(parse('TRUE')).toEqual({
            type: 'literal',
            value: true,
        });

        expect(parse('NULL')).toEqual({
            type: 'literal',
            value: null,
        });

        expect(parse('356')).toEqual({
            type: 'literal',
            value: 356,
        });

        expect(parse('12345.678')).toEqual({
            type: 'literal',
            value: 12345.678,
        });

        expect(parse('"hello"')).toEqual({
            type: 'literal',
            value: 'hello',
        });

        expect(parse('"double "" quote"')).toEqual({
            type: 'literal',
            value: 'double " quote',
        });
    });

    it('ignores white spaces', () => {
        expect(parse('10 + 12')).toEqual(parse('10+12'));
    });

    it('parses cell names', () => {
        expect(parse('D1')).toEqual({
            type: 'cell',
            name: 'D1',
            pos: { col: 3, row: 0 },
        });
    });

    it('parses cell ranges', () => {
        expect(parse('A1:B5')).toEqual({
            type: 'cellRange',
            start: parse('A1'),
            end: parse('B5'),
        } as CellRange);
    });

    it('parses unary operators', () => {
        expect(parse('-F6')).toEqual({
            type: 'group',
            items: [parse('-'), parse('F6')],
        } as Group);
    });

    it('parses arithmetic expressions of literal numbers', () => {
        expect(parse('10+2891')).toEqual({
            type: 'group',
            items: [parse('10'), { type: 'operator', op: '+' }, parse('2891')],
        } as Group);
    });

    it('parses arithmetic expressions of cells', () => {
        expect(parse('C1+30')).toEqual({
            type: 'group',
            items: [parse('C1'), parse('+'), parse('30')],
        } as Group);
    });

    it('parses comparison expressions', () => {
        expect(parse('11<22')).toEqual({
            type: 'group',
            items: [parse('11'), { type: 'operator', op: '<' }, parse('22')],
        } as Group);
        expect(parse('11<>D4')).toEqual({
            type: 'group',
            items: [parse('11'), { type: 'operator', op: '<>' }, parse('D4')],
        } as Group);
    });

    it('flattens nested only-child groups', () => {
        expect(parse('(((D5*20)))')).toEqual(parse('(D5*20)'));
    });

    it('parses function expressions', () => {
        expect(parse('FN(A1, 30)')).toEqual({
            type: 'func',
            name: 'FN',
            args: [parse('A1'), parse('30')],
        } as Func);
    });

    it('throws an exception when an unexpected token occurs', () => {
        expect(() => parse('FN(,A1,30)')).toThrowError(UnexpectedTokenError);
        expect(() => parse('"error","exception"')).toThrowError(
            UnexpectedTokenError
        );
        expect(() => parse('"exception"?')).toThrowError(UnexpectedTokenError);
        expect(() => parse('"error"WHAT()')).toThrowError(UnexpectedTokenError);
        expect(() => parse('FUN(C1:D2))')).toThrowError(UnexpectedTokenError);
        expect(() => parse(')FUN(C1:D2)')).toThrowError(UnexpectedTokenError);
    });
});

export class InvalidTypeError extends Error {}
export class UnexpectedTokenError extends Error {
    constructor(token: string, position: number) {
        super(`Unexpected token ${token} at position ${position}`);
    }
}

export class CellNotFoundError extends Error {
    constructor(cell: string) {
        super(`Cell '${cell}' does not exist.`);
    }
}

export class UndefinedFunctionError extends Error {
    constructor(name: string) {
        super(`Undefined function ${name}`);
    }
}

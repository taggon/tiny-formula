import type { Group, Func, Expression } from './parse';

type ContextType = Group | Func;
interface Fragment {
    type: 'fragment';
    items: Expression[];
}

export class Context {
    stack: Array<ContextType | Fragment> = [];

    constructor() {
        this.stack.push({ type: 'group', items: [] });
    }

    get top(): Group {
        return this.stack[0] as Group;
    }

    get current(): Group | Func {
        if (this.bottom.type === 'fragment') {
            return this.stack.slice(-2, -1)[0] as Func;
        }

        return this.bottom as Group | Func;
    }

    get bottom(): Group | Fragment {
        return this.stack.slice(-1)[0] as Group | Fragment;
    }

    /**
     * Sibling items
     *
     * @return {Expression[]}
     */
    get siblings(): Expression[] {
        return [...this.bottom.items];
    }

    /**
     * Previous sibling
     *
     * @returns {?Expression} The previous sibling or undefined if there is none
     */
    get prev(): Expression | undefined {
        return this.siblings[this.siblings.length - 1];
    }

    /**
     * Check if the current context is the given type.
     *
     * @param {'group' | 'func'} type
     * @returns boolean
     */
    is(type: 'group' | 'func'): boolean {
        return this.current.type === type;
    }

    /**
     * Add a new expression to the current context.
     *
     * @param {Expression} item The expression to add
     */
    add(item: Expression): void {
        if (this.current.type === 'group') {
            this.current.items.push(item);
        } else {
            (this.bottom as Fragment).items.push(item);
        }
    }

    /**
     * Push a new context to the stack.
     *
     * @param {ContextType} ctx Context to push
     */
    push(ctx: ContextType): void {
        this.stack.push(ctx);
        if (ctx.type === 'func') {
            this.stack.push({ type: 'fragment', items: [] });
        }
    }

    /**
     * Pop the current context from the stack.
     */
    pop(): void {
        switch (this.bottom.type) {
            case 'fragment':
                this.punctuate();
                this.stack.pop();
                break;
            case 'group': {
                const items = this.bottom.items;
                if (items.length === 1 && items[0].type === 'group') {
                    this.bottom.items = items[0].items;
                } else {
                    this.bottom.items = items;
                }
                break;
            }
        }

        this.stack.pop() as ContextType | undefined;
    }

    /**
     * In function context, move to the next argument.
     */
    punctuate(): void {
        const bottom = this.bottom as Fragment;
        const items = bottom.items;
        const args = (this.current as Func).args;

        this.bottom.items = [];

        if (items.length === 1) {
            args.push(items[0]);
        } else {
            args.push({
                type: 'group',
                items,
            });
        }
    }
}

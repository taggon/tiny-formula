import type { Group, Func, Expression, Operator } from './parse';

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

    get first() {
        return this.stack[0] as Group;
    }

    get current(): Group | Func {
        if (this.last.type === 'fragment') {
            return this.stack.slice(-2, -1)[0] as Func;
        }

        return this.last as Group | Func;
    }

    get last() {
        return this.stack.slice(-1)[0];
    }

    get siblings() {
        return [...(this.last as Group | Fragment).items];
    }

    is(type: 'group' | 'func') {
        return this.current.type === type;
    }

    add(item: Expression) {
        if (this.current.type === 'group') {
            this.current.items.push(item);
        } else {
            (this.last as Fragment).items.push(item);
        }
    }

    push(ctx: Group | Func) {
        this.stack.push(ctx);
        if (ctx.type === 'func') {
            this.stack.push({ type: 'fragment', items: [] });
        }
    }

    pop() {
        switch (this.last.type) {
            case 'fragment':
                this.punctuate();
                this.stack.pop();
                break;
            case 'group':
                const items = this.last.items;
                if (items.length === 1 && items[0].type === 'group') {
                    this.last.items = items[0].items;
                } else {
                    this.last.items = items;
                }
                break;
        }

        this.stack.pop() as ContextType | undefined;
    }

    punctuate() {
        if (this.last.type !== 'fragment') {
            return;
        }

        const items = this.last.items;
        const args = (this.current as Func).args;

        this.last.items = [];

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

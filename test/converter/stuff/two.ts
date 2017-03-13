import { One } from './one';

declare module './one' {
    interface One {
        two(): void;
    }
}

One.prototype.two = function () {};

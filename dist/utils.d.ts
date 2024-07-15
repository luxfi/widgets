export declare const query2obj: (str: string) => Record<string, string>;
export declare const obj2query: (obj: Record<string, string>) => string;
export declare const isUrlMatched: (url: string, includes: string[]) => string | null;
export declare const throttle: (fn: any, delay: any) => (...args: any[]) => void;

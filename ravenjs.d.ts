declare module "ravenjs" {
    
    interface RavenSettings {
        host?: string;
        database?: string;
        username?: string;
        password?: string;
        apiKey?: string;
        idGenerator?: (obj: any, settings: RavenSettings, cb: (error: any, id: string) => void) => void;
        idFinder?: (obj: any) => string;
        proxy?: string;
        useOptimisticConcurrency?: bool;
    }

    interface IndexRequest {
        map(val: string): IndexRequest;
        reduce(val: string): IndexRequest;
        create(cb: (error: any) => void): void;
        remove(cb: (error: any) => void): void;
    }

    interface AttachmentRequest {
        get(cb: (error: any, data: any, headers: any) => void ): void;
        save(opts: any, cb: (error: any) => void ): void;
        remove(cb: (error: any) => void ): void;
    }

    interface Filter {
        is(val: string): QueryRequest;
        is(vals: string[]): QueryRequest;
        isEither(val: string[]): QueryRequest;
    }

    interface NestedQueryFilter {
        is(val: string): NestedQuery;
        is(vals: string[]): NestedQuery;
        isEither(val: string[]): NestedQuery;
    }

    interface NestedQuery {
        where(field: string): NestedQueryFilter;
        where(fn: (query: NestedQuery) => void): NestedQuery;
        and(field: string): NestedQueryFilter;
        and(fn: (query: NestedQuery) => void): NestedQuery;
        or(field: string): NestedQueryFilter;
        or(fn: (query: NestedQuery) => void ): NestedQuery;
        toString(): string;
    }

    interface QueryRequest {
        collection(name: string, pluralize?: bool): QueryRequest;
        lucene(query: string): QueryRequest;
        where(field: string): Filter;
        where(fn: (query: NestedQuery) => void): QueryRequest;
        and(field: string): NestedQuery;
        and(fn: (query: NestedQuery) => void): QueryRequest;
        or(field: string): NestedQuery;
        or(fn: (query: NestedQuery) => void): QueryRequest;
        orderBy(field: string): QueryRequest;
        orderByDescending(field: string): QueryRequest;
        skip(field: string): QueryRequest;
        take(field: string): QueryRequest;
        results(cb: (error: any, data: any) => void ): void;
        toString(): string;
    }

    interface RavenClient {
        get(id: string, cb: (error: any, obj: any) => void): void;
        save(id: string, doc: any, cb: (error: any, obj: any) => void): void;
        remove(doc: any, cb: (error: any, obj: any) => void): void;
        index(indexName: string): IndexRequest;
        query(indexName?: string): QueryRequest;
        attachment(key: string): AttachmentRequest;
    }

    export function connectionString(connStr: string): void;
    export function host(val: string): void;
    export function database(val: string): void;
    export function username(val: string): void;
    export function password(val: string): void;
    export function apiKey(val: string): void;
    export function idFinder(finder: (obj: any) => string): void;
    export function idGenerator(generator: (obj: any, settings: RavenSettings, cb: (error: any, id: string) => void) => void): void;
    export function proxy(val: string): void;
    export function useOptimisticConcurrency(val: bool);
    export function configure(env: string, cb: () => void): void;
    export function configure(cb: () => void): void;
    export function connect(opts?: RavenSettings): RavenClient;
    export function create(typeName: string, collectionName: string): any;
}
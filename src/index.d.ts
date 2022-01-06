import { Either } from 'fp-ts/Either';
declare type ParserResult<T> = [T, string];
declare type ParserError = [string, string];
declare type Parser<T> = (input: string) => Either<ParserError, ParserResult<T>>;
export declare const p_digit: Parser<string>;
export declare const many0: <T>(p: Parser<T>) => Parser<T[]>;
export {};

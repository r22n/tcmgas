import src, { ExpectedBreakdownTable, PlanBreakdownTable, tbl, TestParamBreakdownTable } from './src';
import { parse, eval as expreval } from 'expression-eval';
import { seq } from 'incnum';
import { has } from './util';


export default function () {
    src();
    params();
    planning();
}

const param: Params = {
    testparams: {},
    expects: {},
    plans: [],
};
type Params = {
    testparams: { [name in string]?: TestParamBreakdownTable };
    expects: { [name in string]?: ExpectedBreakdownTable }
    plans: PlanBreakdownTable[];
}

export function params() {
    function tpvalid(name: string) {
        if (param.testparams[name]) {
            throw new Error(`duplicated #test-param name: ${name}`);
        }
    }
    function exvalid(name: string) {
        if (param.expects[name]) {
            throw new Error(`duplicated #expected name: ${name}`);
        }
    }
    for (const t of tbl) {
        switch (t.pragma) {
            case 'test-param': {
                const name = t.table.name;
                tpvalid(name);
                param.testparams[name] = t.table;
                break;
            }
            case 'expected': {
                const name = t.table.name;
                exvalid(name);
                param.expects[name] = t.table;
                break;
            }
            case 'plan':
                param.plans.push(t.table);
                break;
        }
    }
}

export const plans: TestPlan[] = [];
export function planning() {

    // helpers
    function warn(name: string, plan: string) {
        if (!(param.testparams[name] || param.expects[name])) {
            console.warn(`#plan ${plan} has unknown name cannot resolve in #test-param or #expected: ${name}`);
        }
    }
    function zero(len: number): number[] {
        const r = new Array(len);
        r.fill(0, 0, len);
        return r;
    }

    // impl

    // enumerates all combinations
    for (const p of param.plans) {
        p.rows.forEach(e => warn(e.param, p.name));
        const tp = p.rows.map(e => param.testparams[e.param]).filter(has);
        const ex = p.rows.map(e => param.expects[e.param]).filter(has);
        plans.push({
            src: {
                testparam: tp,
                expect: ex,
                plan: p,
            },
            testparams: seq(zero(tp.length), tp.map(e => e.rows.length)),
            exprs: ex.map(e => e.rows.map(t => parse(t.expr))),
            expected: [],
        });
    }

    // filter test-params combination by expected value 
    //                     A              B
    // password method input    'expected'
    //          'testparams'    ac wa ma sh
    // ---------------------------------------
    // pw       kb     st       o  -  o  -
    // pw       kb     lt       -  o  o  -
    // pw       kb     20       o  -  o  -
    // pw       kb     21       -  o  o  -
    // pw       kb     00       o  -  o  -
    // ...     
    // em       cb     00       o  -  -  o
    for (const p of plans) {
        p.expected = p.testparams
            .map(e => e.map((t, i) => p.src.testparam[i].rows[t]))
            .map(e => Object.fromEntries(e.map((t, i) => [p.src.testparam[i].name, t.val]))) // A
            .map(e => p.exprs.map(t => t.map(u => !!expreval(u, e)))); // B
    }

    // filter test-params combination by expected value 
    //                     A              B
    // password method input    'expected'
    //          'testparams'    ac wa ma sh
    // ---------------------------------------
    // pw       kb     st       o  -  o  -
    // pw       kb     lt       -  o  o  -
    // pw       kb     20       o  -  o  -
    // pw       kb     21       -  o  o  -
    // pw       kb     00       o  -  o  -
    // pw       kb     00       -  -  -  -   < remove
    // ...     
    // em       cb     00       o  -  -  o
    for (const p of plans) {
        p.testparams = p.testparams
            .filter((e, i) => p.expected[i].flat().some(has));
        p.expected = p.expected
            .filter(e => e.flat().some(has));
    }
}
export type TestPlan = {
    src: TestPlanSource;
    exprs: parse.Expression[][];
    testparams: number[][];
    expected: boolean[][][];
}

export type TestPlanSource = {
    testparam: TestParamBreakdownTable[];
    expect: ExpectedBreakdownTable[];
    plan: PlanBreakdownTable;
}
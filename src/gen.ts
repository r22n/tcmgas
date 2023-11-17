import { seq } from "incnum";
import { ArrayIndex, fromary } from 'ary-index';
import plan, { plans, TestPlan } from "plan";
import { has } from "./util";
import { ExpectedBreakdownRow } from "src";


export default function () {
    plan();
    init();
    generate();
}

const generated: Generated = {
    name: 'generated plans',
    sheet: null,
};
let proto: any[][] = [];
let placement = {
    location: [0, 0],
    priority: true,
    points: true,
    type: true,
    comment: true,
};

type Generated = {
    name: string;
    sheet: GoogleAppsScript.Spreadsheet.Sheet | null;
}

export function init() {
    const self = SpreadsheetApp.getActiveSpreadsheet();
    const template = self.getSheetByName('#template');
    if (!template) {
        throw new Error('template sheet not found, #template sheet needed');
    }

    let dst = self.getSheetByName(generated.name);
    if (dst) {
        console.warn('generated sheet will be clear !');
        dst.clear();
        generated.sheet = dst;
    } else {
        generated.sheet = template
            .copyTo(self)
            .setName(generated.name);
    }

    proto = template.getRange('a1:j10').getValues();
    for (const [r, c] of seq([0, 0], [10, 10])) {
        if (proto[r][c].startsWith?.('$plan')) {
            const t = ` ${proto[r][c]} `;
            placement = {
                location: [r, c],
                comment: t.includes(' comment '),
                points: t.includes(' points '),
                priority: t.includes(' priority '),
                type: t.includes(' type '),
            };
            break;
        }
    }
}

export function generate() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(generated.name);
    if (!sheet) {
        throw new Error(`generated plan sheet not found: sheet=${generated}`);
    }
    sheet.clear();

    let [row, col] = placement.location;
    // getRange starts with 1
    row++, col++;

    for (const b of plans.map(build)) {
        const rows = b.length;
        const cols = b[0].length;
        sheet.getRange(row, col, rows, cols)
            .setValues(b);
        row += rows + 1;
    }
}

export function build(plan: TestPlan): string[][] {
    // helper
    function buffer(rows: number, cols: number) {
        const b = new Array<string>(rows * cols);
        b.fill('');
        return fromary(b, [rows, cols]);
    }
    function merge(e: string[]) {
        return Object.keys(Object.fromEntries(e.map(t => [t, 1]))).join(' ');
    }
    function reduce(e: number[]) {
        if (!e.length) {
            return 0;
        }
        return e.reduce((a, b) => a + b);
    }


    // uppber bound of result buffer
    const ub = {
        r: 3
            + plan.testparams.length,
        c: 4
            + plan.src.testparam.map(e => e.rows.length).reduce((a, b) => a + b)
            + plan.src.expect.map(e => e.rows.length).reduce((a, b) => a + b)
            + 1,
    };
    const result = buffer(ub.r, ub.c)!;


    // 0 plan
    //   ^                        
    // '$plan' |
    result.set(plan.src.plan.name, 0, 0);

    // '$expected' |
    let col = 0;

    // 0 plan
    // 1                        
    // 2 prioirty points  type    comment 
    //   ^ col
    if (placement.priority) result.set('priority', 2, col++);
    if (placement.points) result.set('points', 2, col++);
    if (placement.type) result.set('type', 2, col++);
    if (placement.comment) result.set('comment', 2, col++);

    // 0 plan                               expects
    // 1                                    name
    // 2 prioirty points  type    comment   param
    //                                      ^ col
    for (const e of plan.src.expect) {
        result.set('expects', 0, col)
        result.set(e.name, 1, col);
        for (const { param } of e.rows) {
            result.set(param, 2, col++);
        }
    }

    // 0 plan                               expects
    // 1                                    name
    // 2 prioirty points  type    comment   param
    // 3 abcd                               o o o x
    //   ^ row,col
    let row = 3;
    for (const e of plan.expected) {
        col = 0;
        const r = e
            .map((t, i) => t.map((u, j) => u && plan.src.expect[i].rows[j]))
            .flat()
            .filter(has) as ExpectedBreakdownRow[];
        if (placement.priority) result.set(`${reduce(r.map(t => t.priority))}`, row, col++);
        if (placement.points) result.set(`${reduce(r.map(t => t.points))}`, row, col++);
        if (placement.type) result.set(merge(r.map(t => t.type)), row, col++);
        if (placement.comment) result.set(merge(r.map(t => t.comment)), row, col++);
        for (const t of e.flat()) {
            result.set(t ? 'o' : '', row, col++);
        }
        row++;
    }

    // 0 plan                               expects   param
    // 1                                    name      name
    // 2 prioirty points  type    comment   param     param
    // 3 abcd                               o o o x    
    // n abcd
    //                                                ^ col  ^ cc
    let cc = col;
    for (const e of plan.src.testparam) {
        result.set('param', 0, cc);
        result.set(e.name, 1, cc);
        for (const { param } of e.rows) {
            result.set(param, 2, cc++);
        }
    }

    // 0 plan                               expects   param
    // 1                                    name      name
    // 2 prioirty points  type    comment   param     param
    // 3 abcd                               o o o x   o o x 
    // n abcd
    //                                                ^ col  ^ cc
    row = 3;
    for (const e of plan.testparams) {
        cc = col;
        e.forEach((t, i) => {
            result.set('o', row, cc + t);
            cc += plan.src.testparam[i].rows.length;
        });
        row++;
    }

    // now
    //
    // 0 plan                               expects   param
    // 1                                    name      name
    // 2 prioirty points  type    comment   param     param
    // 3 abcd                               o o o x   o o x 
    // ...
    // n abcd                               o o o x   o o x 
    //                                                    ^ row,cc
    const now: string[][] = [];
    for (let r = 0; r < row; r++) {
        now.push([]);
        for (let c = 0; c < cc; c++) {
            now[r].push(result.get(r, c));
        }
    }
    return now;
}
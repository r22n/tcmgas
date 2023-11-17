export default function () {
    sources();
    tables();
}

let src: any[][] = [];
export let tbl: BreakdownTable[] = [];

function sources() {
    const s = SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName('#breakdowns')
        ?.getRange('a:f')
        .getValues();
    if (!s) {
        throw new Error('#breakdowns sheet returns empty or null');
    }

    src = s;
}

function tables() {

    // helpers
    const directives = {
        testparam: '#test-param ',
        expected: '#expected ',
        val: '#val',
        expr: '#expr',
        points: '#points',
        priority: '#priority',
        type: '#type',
        comment: '#type',
    };
    function pragma([a]: string[]) {
        try {
            if (a.startsWith(directives.testparam)) {
                return directives.testparam.length;
            } else if (a.startsWith(directives.expected)) {
                return directives.expected.length;
            } else {
                return 0;
            }
        } catch(e) {
            throw new Error(`first column require text param: ${e}`)
        }
    }
    function hasrow([a]: string[]) {
        try {
            return a.trim();
        } catch (e) {
            throw new Error(`first column require text param: ${e}`)
        }
    }
    type TableColumnMapping = {
        val: number;
        expr: number;
        points: number;
        priority: number;
        type: number;
        comment: number;
    }

    // impl
    let cur: BreakdownTable | undefined;
    let cols: TableColumnMapping | undefined;
    function haspragma(r: string[]) {
        const pra = pragma(r);
        if (pra) {
            try {
                const name = r[0].substring(pra);
                cur = {
                    pragma: pra === directives.testparam.length ? 'test-param' : 'expected',
                    table: {
                        name,
                        rows: [],
                    }
                };
                cols = {
                    val: r.indexOf(directives.val),
                    expr: r.indexOf(directives.expr),
                    points: r.indexOf(directives.points),
                    priority: r.indexOf(directives.priority),
                    type: r.indexOf(directives.type),
                    comment: r.indexOf(directives.comment),
                };
            } catch(e) {
                throw new Error(`first column require text param: ${e}`)
            }
            return 1;
        }
        return 0;
    }
    function row(r: string[]): TestParamBreakdownRow & ExpectedBreakdownRow {
        function v(directive?: number) {
            if (directive == null || directive === -1) {
                return '';
            } else {
                return `${r[directive]}`;
            }
        }
        return {
            param: v(0),
            val: v(cols?.val),
            comment: v(cols?.comment),
            expr: v(cols?.expr),
            points: Number(v(cols?.points)),
            priority: Number(v(cols?.priority)),
            type: v(cols?.type),
        };
    }

    tbl = [];
    for (const r of src.filter(hasrow)) {
        if (haspragma(r)) {
            tbl.push(cur!);
            continue;
        }

        if (cur) {
            cur.table.rows.push(row(r));
        } else {
            console.warn(`ignore rows have not been surround by table ${r.slice(0, 3).join(',')}...`);
        }
    }
}


type BreakdownTable = {
    pragma: 'test-param';
    table: TestParamBreakdownTable;
} | {
    pragma: 'expected';
    table: ExpectedBreakdownTable;
}

type TestParamBreakdownTable = {
    name: string;
    rows: TestParamBreakdownRow[];
}
type TestParamBreakdownRow = {
    param: string;
    val: string;
}

type ExpectedBreakdownTable = {
    name: string;
    rows: ExpectedBreakdownRow[];
}
type ExpectedBreakdownRow = {
    param: string;
    expr: string;
    points: number;
    priority: number;
    type: string;
    comment: string;
}
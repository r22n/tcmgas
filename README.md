# test case management tools; tcm

## how to use

1. open spread sheet on google spread sheet.
2. write test parameters and expected values.
  - use [template file](template.xlsx) if you want to get test plan easier
3. run 'generate test plan' on 'tcm' menu on google spread sheet app.

## the menu in spread sheet
tcm displays menu 'tcms' in spread sheet.

'tcms' shows down 'generate plan'.

this breakdowns all test cases from 'breakdowns' sheet.

sheets layouts its cases like 'template'.

## breakdown
breakdown enumerates all combinations about its values.

values contain 'test-param' and 'expected'.

'test-param' expands all combinations for self.

'expected' shows matrix testware should be passed.

you can get 'expected' matrix for simple expression.

e.g. ma: "field === 'pw'" wa: "input === 'lt' || input > 21"

for example, we test manually;
- 'test-param'
  - field: 'password field', 'email field'; pw em
  - method: 'set by keyboard', 'set by clipboard'; kb cb
  - input: 'short text', 'long text', '20 chars text', '21 chars text', 'empty'; st lt 20 21 00
- 'expected' 
  - field accepts value shorter than or equal 20 chars; ac
  - field warns greater than 20 chars; wa
  - field masks all chars; ma
  - field shows all chars; sh
- breakdown
  ```
  password method input    expected
                           ac wa ma sh
  ---------------------------------------
  pw       kb     st       o  -  o  -
  pw       kb     lt       -  o  o  -
  pw       kb     20       o  -  o  -
  pw       kb     21       -  o  o  -
  pw       kb     00       o  -  o  -
  ...     
  em       cb     00       o  -  -  o
  ```


## test planning

see [template file](template.xlsx).

### spread sheet structure

spread sheet file contains sheets;
- \#breakdowns
  - this sheet contains test parameters and expected values for manual tests
- \#template
  - template of test plan sheet 'tcm' generates

### breakdowns

test parameters and expected values must be put with directives.

directives are in first column on 'a:a'.

- \#plan ${name}
  - requires name list of \#test-param and \#expected directives
- \#test-param ${name}
  - requires test param table contains setup for expected values.
- \#expected ${name}
  - requires expected values table contains software behavior for test parameters

you can put directives tables in any order.

emplty row will be ignored and `a:a` must have directives.

#### \#plan directive

```
    a
1   #plan ${name}
2   ${name0}
3   ${name1}
... 
```

`${name}` is test plan name.

`${name${n}}` must contains 1 of name \#test-param and 1 of name \#expected at least.

so, \#plan is consist of names both \#test-param and \#expected.

test plan shows all \#plan table has all test parameters combination and its expected values.

#### \#test-param directive

```
    a                     b
1   #test-param ${name}   #val
2   ${parameter0}         ${val0}
3   ${parameter1}         ${val1}
4   ${parameter2}         ${val2}
```

`${name}` is test-parameter name used on \#plan directives and \#expr directives.

`${name}` names better `/[a-zA-Z_][a-zA-Z0-9_]+/`.

\#test-param and `${name}` must be splited by single white space.

`${paramter${n}}` are test-parameter elements.

generated test plan sheet contains all combinations for this.

\#val and `${val${n}}` are values for \#expr directive.

\#expr on \#expected directive evaluates `${name}` as expression for check and filter it.

see. \#expected directive section.


#### \#expected directive

```
    a                   b         c           d             e         f
1   #expected ${name}   #expr     #points     #priority     #type     #comment
2   ${parameter0}       ${expr0}  ${points0}  ${priority0}  ${type0}  ${comment0}
3   ${parameter1}       ${expr1}  ${points1}  ${priority1}  ${type1}  ${comment1}
4   ${parameter2}       ${expr2}  ${points2}  ${priority2}  ${type2}  ${comment2}
...
```

`${name}` is expected values name used on \#plan directive.

\#expected and `${name}` must be splited by single white space.

generated test plan emunerates expected values of `${parameter${n}}` for each all combination of test parameters.

\#expr evaluates `${expr${n}}` as expression returns `true` or `false`.

if this was `true`, test plan displays `(o) yes/check this behavior` for tes parameter combination.

\#points and \#priority require number for this test.

\#type and \#comment are text for comments.

test plan shows aggregated \#points, \#priority, \#type and \#comment of all expected values \#expr returns `true`.


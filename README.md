# test case management tools; tcm

license MIT r22n@github.com


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


import gen from './gen';

(global as any).onOpen = () => {
  SpreadsheetApp.getUi()
    .createMenu('tcm')
    .addItem('generate test plan', 'gen')
    .addToUi();
};

(global as any).gen = gen;
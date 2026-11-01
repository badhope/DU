/**
 * DU v2 · 内核桶
 *
 * core/ 只放确定性推导（历法、卦象、体用、节气），不含断语与界面。
 * vite 把它单独切成 core chunk，供多工具复用。
 */
export * from './gua'
export * from './meihua'
export * from './bazi'
export * from './meihuaFacts'

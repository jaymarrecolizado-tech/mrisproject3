// Development-only mock data wrapper
// Tree-shaken out in production builds

import * as mockData from './mockData';

let dailySummaries: typeof mockData.dailySummaries = [];
let regionStats: typeof mockData.regionStats = [];
let projects: typeof mockData.projects = [];
let sites: typeof mockData.sites = [];
let mysqlSchema = '';
let phpApiSpec = '';
let folderStructure = '';

// Use Vite's DEV constant which is available at compile time
declare const DEV: boolean;
if (DEV) {
  dailySummaries = mockData.dailySummaries;
  regionStats = mockData.regionStats;
  projects = mockData.projects;
  sites = mockData.sites;
  mysqlSchema = mockData.mysqlSchema;
  phpApiSpec = mockData.phpApiSpec;
  folderStructure = mockData.folderStructure;
}

export { dailySummaries, regionStats, projects, sites, mysqlSchema, phpApiSpec, folderStructure };
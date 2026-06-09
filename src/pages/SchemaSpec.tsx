import { useState } from 'react';
import { Database, Copy, Check, Server, Code, FolderTree, FileJson, Shield } from 'lucide-react';
import { mysqlSchema, phpApiSpec, folderStructure } from '../data/mockDataDev';

const tabs = [
  { id: 'schema', label: 'MySQL Schema', icon: Database },
  { id: 'api', label: 'PHP API Spec', icon: Code },
  { id: 'folder', label: 'Folder Structure', icon: FolderTree },
  { id: 'stack', label: 'Stack & Architecture', icon: Server },
];

export default function SchemaSpec() {
  const [activeTab, setActiveTab] = useState('schema');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getContent = () => {
    switch (activeTab) {
      case 'schema': return mysqlSchema;
      case 'api': return phpApiSpec;
      case 'folder': return folderStructure;
      default: return '';
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="text-dict-blue" size={26} />
          Technical Specification
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Complete database schema, API specification, and architecture blueprint for your WAMP + MySQL development
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ArchCard icon={<Server size={20} />} title="Backend" value="PHP 8.x" desc="RESTful API endpoints" color="bg-blue-500" />
        <ArchCard icon={<Database size={20} />} title="Database" value="MySQL 8.0" desc="UTF8MB4 collation" color="bg-emerald-500" />
        <ArchCard icon={<Code size={20} />} title="Frontend" value="React + Tailwind" desc="Responsive SPA" color="bg-violet-500" />
        <ArchCard icon={<Shield size={20} />} title="Auth" value="JWT + Sessions" desc="Role-based access" color="bg-amber-500" />
      </div>

      {/* Stack Details */}
      {activeTab === 'stack' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <StackSection
            title="Recommended Technology Stack"
            items={[
              { label: 'Backend Language', value: 'PHP 8.2+ (native or Laravel 11)' },
              { label: 'Database', value: 'MySQL 8.0 (bundled with WAMP)' },
              { label: 'Web Server', value: 'Apache 2.4 (bundled with WAMP)' },
              { label: 'Frontend Framework', value: 'React 19 + Vite + Tailwind CSS 4' },
              { label: 'Mapping Library', value: 'Leaflet.js (OpenStreetMap tiles)' },
              { label: 'Charts', value: 'Recharts (React) / Chart.js (vanilla)' },
              { label: 'Excel Import/Export', value: 'PHPSpreadsheet (PHP) / SheetJS (JS)' },
              { label: 'PDF Generation', value: 'TCPDF or DomPDF (PHP)' },
              { label: 'Authentication', value: 'PHP Sessions + JWT tokens' },
              { label: 'Icons', value: 'Lucide React / Tabler Icons' },
            ]}
          />
          <StackSection
            title="Database Design Principles"
            items={[
              { label: 'Character Set', value: 'utf8mb4 with unicode_ci collation' },
              { label: 'Storage Engine', value: 'InnoDB for all tables (transactions + foreign keys)' },
              { label: 'Primary Keys', value: 'Auto-increment INT for logs, VARCHAR for site IDs' },
              { label: 'Indexes', value: 'Composite indexes on (site_id, log_date) for fast lookups' },
              { label: 'Views', value: 'Pre-built views for common report queries' },
              { label: 'Audit', value: 'JSON columns for old/new value tracking' },
            ]}
          />
          <StackSection
            title="Security Requirements"
            items={[
              { label: 'SQL Injection', value: 'PDO prepared statements on ALL queries' },
              { label: 'XSS Prevention', value: 'htmlspecialchars() on all output' },
              { label: 'CSRF Protection', value: 'Token validation on state-changing requests' },
              { label: 'File Uploads', value: 'Validate MIME type, restrict extensions, store outside web root' },
              { label: 'Passwords', value: 'password_hash() with PASSWORD_DEFAULT' },
              { label: 'CORS', value: 'Restrict to dict.gov.ph domain in production' },
            ]}
          />
          <StackSection
            title="Development Environment (WAMP)"
            items={[
              { label: 'Local URL', value: 'http://localhost/dict-mris/' },
              { label: 'Document Root', value: 'C:/wamp64/www/dict-mris/' },
              { label: 'MySQL Host', value: 'localhost' },
              { label: 'MySQL Port', value: '3306 (default)' },
              { label: 'PHPMyAdmin', value: 'http://localhost/phpmyadmin/' },
              { label: 'VPS Deploy', value: 'Clone htdocs + import schema to VPS MySQL' },
            ]}
          />
        </div>
      )}

      {/* Code View */}
      {activeTab !== 'stack' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-dict-blue text-dict-blue'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs text-slate-400">
              {activeTab === 'schema' && 'dict_mris_schema.sql'}
              {activeTab === 'api' && 'api_endpoints.php'}
              {activeTab === 'folder' && 'project_structure.txt'}
            </span>
            <button
              onClick={() => copyToClipboard(getContent())}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:bg-slate-50"
            >
              {copied ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>

          {/* Code */}
          <div className="overflow-x-auto">
            <pre className="p-5 text-xs leading-relaxed font-mono text-slate-700 bg-white">
              {getContent()}
            </pre>
          </div>
        </div>
      )}

      {/* Data Flow Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">System Data Flow</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <FlowBox icon={<Database size={20} />} title="MySQL 8.0" subtitle="dict_mris database" color="border-emerald-300 bg-emerald-50" />
          <Arrow />
          <FlowBox icon={<Code size={20} />} title="PHP 8.x API" subtitle="RESTful endpoints" color="border-blue-300 bg-blue-50" />
          <Arrow />
          <FlowBox icon={<FileJson size={20} />} title="React Frontend" subtitle="Dashboard + Maps" color="border-violet-300 bg-violet-50" />
          <Arrow />
          <FlowBox icon={<FileText size={20} />} title="Reports" subtitle="PDF / XLSX / CSV" color="border-amber-300 bg-amber-50" />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-medium text-slate-700 mb-2">Track A: Free WiFi (Daily)</p>
            <p className="text-slate-500 text-xs">
              Encoder logs daily status per AP site → <code className="bg-white px-1 rounded border">free_wifi_daily_logs</code> table → 
              Dashboard aggregates → Map shows real-time pins → Reports export trends
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="font-medium text-slate-700 mb-2">Track B: DICT Projects (Milestone)</p>
            <p className="text-slate-500 text-xs">
              PM updates accomplishment per site → <code className="bg-white px-1 rounded border">dict_project_entries</code> table → 
              Milestones tracked separately → Progress bars on dashboard → Completion reports
            </p>
          </div>
        </div>
      </div>

      {/* Implementation Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Implementation Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { phase: 'Phase 1', task: 'Set up WAMP, create database, import schema', done: false },
            { phase: 'Phase 1', task: 'Build PHP Database class and connection', done: false },
            { phase: 'Phase 1', task: 'Implement user auth (login/logout/JWT)', done: false },
            { phase: 'Phase 1', task: 'Create projects master list API', done: false },
            { phase: 'Phase 2', task: 'Build Free WiFi site CRUD + map data API', done: false },
            { phase: 'Phase 2', task: 'Daily log entry form + bulk Excel import', done: false },
            { phase: 'Phase 2', task: 'Free WiFi dashboard with trend charts', done: false },
            { phase: 'Phase 2', task: 'Leaflet map with custom project markers', done: false },
            { phase: 'Phase 3', task: 'DICT Projects accomplishment entry', done: false },
            { phase: 'Phase 3', task: 'Milestone management system', done: false },
            { phase: 'Phase 3', task: 'Project completion tracking + Gantt view', done: false },
            { phase: 'Phase 4', task: 'Report generation (PDF/XLSX/CSV)', done: false },
            { phase: 'Phase 4', task: 'Executive dashboard with unified metrics', done: false },
            { phase: 'Phase 4', task: 'Role-based access control', done: false },
            { phase: 'Phase 4', task: 'Deploy to VPS + SSL + backup cron', done: false },
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-300" defaultChecked={item.done} />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.phase}</span>
                <p className="text-sm text-slate-700">{item.task}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArchCard({ icon, title, value, desc, color }: { icon: React.ReactNode; title: string; value: string; desc: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-lg ${color} text-white flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{title}</p>
      <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}

function StackSection({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div>
      <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-dict-blue mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium">{item.label}</p>
              <p className="text-sm text-slate-700 font-medium">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowBox({ icon, title, subtitle, color }: { icon: React.ReactNode; title: string; subtitle: string; color: string }) {
  return (
    <div className={`flex-1 p-4 rounded-xl border-2 ${color} text-center`}>
      <div className="text-slate-600 flex justify-center mb-2">{icon}</div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="text-[10px] text-slate-400">{subtitle}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden md:flex items-center text-slate-300">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

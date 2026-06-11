import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, FileSpreadsheet,
  FileType, CheckCircle2, Clock, Printer, Loader2, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { projects } from '../data/mockDataDev';

const printStyles = `
@media print {
  body * { visibility: hidden; }
  #printable-report, #printable-report * { visibility: visible; }
  #printable-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
    color: black;
    padding: 2rem;
  }
  #printable-report .no-print { display: none !important; }
  #printable-report table { width: 100%; border-collapse: collapse; }
  #printable-report th, #printable-report td { border: 1px solid #333; padding: 8px; text-align: left; }
  #printable-report th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  @page { margin: 1.5cm; size: A4; }
}`;

if (typeof document !== 'undefined' && !document.getElementById('print-styles')) {
  const style = document.createElement('style');
  style.id = 'print-styles';
  style.textContent = printStyles;
  document.head.appendChild(style);
}

const reportTypes = [
  { id: 'daily_status', name: 'Daily Site Status Report', desc: 'UP/DOWN summary for all sites per day', applicable: ['fw'] },
  { id: 'weekly_summary', name: 'Weekly Performance Summary', desc: 'Aggregated weekly metrics with trends', applicable: ['fw'] },
  { id: 'monthly_accomplishment', name: 'Monthly Accomplishment Report', desc: 'Project completion and milestone status', applicable: ['pnpki', 'ilcdb', 'iidb', 'cyber', 'elgu', 'egov', 'govnet', 'gecs'] },
  { id: 'regional_breakdown', name: 'Regional Breakdown Report', desc: 'Sites and status by island group / region', applicable: ['all'] },
  { id: 'isp_performance', name: 'ISP Performance Report', desc: 'Uptime and bandwidth by internet provider', applicable: ['fw'] },
  { id: 'project_completion', name: 'Project Completion Report', desc: 'Overall completion rate with deliverables', applicable: ['pnpki', 'ilcdb', 'iidb', 'cyber', 'elgu', 'egov', 'govnet', 'gecs'] },
  { id: 'site_implementation', name: 'Site Implementation Report', desc: 'Site details filtered by province, municipality, or congressional district', applicable: ['all'] },
  { id: 'audit_trail', name: 'Audit Trail Report', desc: 'User activity and data change logs', applicable: ['all'] },
];

interface ApiProject {
  id: number | string;
  name: string;
  code?: string;
}

interface GeneratedReport {
  id: number;
  report_type: string;
  title: string;
  format: string;
  date_from: string;
  date_to: string;
  generated_by_name: string;
  created_at: string;
}

interface ReportField {
  label: string;
  key: string;
}

interface ReportMetric {
  label: string;
  value: string | number;
  subLabel: string;
}

interface ReportChart {
  type: 'bar' | 'line';
  title: string;
  labels: string[];
  values: number[];
  secondaryValues?: number[];
}

interface ReportSummary {
  title: string;
  metrics: ReportMetric[];
  charts: ReportChart[];
  narrative: string;
}

const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
};

const reportFieldsByType: Record<string, ReportField[]> = {
  daily_status: [
    { label: 'Date', key: 'log_date' },
    { label: 'Total Sites', key: 'total_sites' },
    { label: 'UP', key: 'up_count' },
    { label: 'DOWN', key: 'down_count' },
    { label: 'Partial', key: 'partial_count' },
    { label: 'Total Users', key: 'total_users' },
    { label: 'Avg Bandwidth', key: 'avg_bandwidth' },
  ],
  weekly_summary: [
    { label: 'Year', key: 'year' },
    { label: 'Week', key: 'week' },
    { label: 'Week Start', key: 'week_start' },
    { label: 'Week End', key: 'week_end' },
    { label: 'Total Sites', key: 'total_sites' },
    { label: 'Uptime %', key: 'uptime_pct' },
    { label: 'Total Users', key: 'total_users' },
    { label: 'Avg Bandwidth', key: 'avg_bandwidth' },
  ],
  monthly_accomplishment: [
    { label: 'Project Name', key: 'project_name' },
    { label: 'Milestone', key: 'milestone_title' },
    { label: 'Status', key: 'milestone_status' },
    { label: 'Target Date', key: 'target_date' },
    { label: 'Actual Date', key: 'actual_date' },
    { label: 'Accomplishment %', key: 'accomplishment_percent' },
    { label: 'Entry Date', key: 'entry_date' },
  ],
  regional_breakdown: [
    { label: 'Island Group', key: 'island_group' },
    { label: 'Total Sites', key: 'total_sites' },
    { label: 'UP', key: 'up_sites' },
    { label: 'DOWN', key: 'down_sites' },
    { label: 'Avg Bandwidth', key: 'avg_bandwidth' },
  ],
  isp_performance: [
    { label: 'ISP Provider', key: 'isp_provider' },
    { label: 'Total Sites', key: 'total_sites' },
    { label: 'UP', key: 'up_sites' },
    { label: 'Uptime %', key: 'uptime_pct' },
    { label: 'Avg Bandwidth', key: 'avg_bandwidth' },
  ],
  project_completion: [
    { label: 'Project ID', key: 'project_id' },
    { label: 'Code', key: 'code' },
    { label: 'Name', key: 'name' },
    { label: 'Total Sites', key: 'total_sites' },
    { label: 'Active Sites', key: 'active_sites' },
    { label: 'Down Sites', key: 'down_sites' },
    { label: 'Avg Completion', key: 'avg_completion' },
  ],
  audit_trail: [
    { label: 'ID', key: 'id' },
    { label: 'User', key: 'user_name' },
    { label: 'Email', key: 'user_email' },
    { label: 'Action', key: 'action' },
    { label: 'Entity Type', key: 'entity_type' },
    { label: 'Entity ID', key: 'entity_id' },
    { label: 'IP Address', key: 'ip_address' },
    { label: 'Date', key: 'created_at' },
  ],
  site_implementation: [
    { label: 'Site Code', key: 'site_code' },
    { label: 'Site Name', key: 'site_name' },
    { label: 'Location', key: 'location_name' },
    { label: 'Project', key: 'project_name' },
    { label: 'Barangay', key: 'barangay' },
    { label: 'Municipality', key: 'municipality' },
    { label: 'Province', key: 'province' },
    { label: 'District', key: 'district' },
    { label: 'Island Group', key: 'island_group' },
    { label: 'Site Type', key: 'site_type' },
    { label: 'ISP', key: 'isp_provider' },
    { label: 'Technology', key: 'last_mile_tech' },
    { label: 'Bandwidth (Mbps)', key: 'bw_download' },
    { label: 'Status', key: 'status' },
    { label: 'Last Updated', key: 'last_updated' },
    { label: 'Latest Users', key: 'latest_users' },
    { label: 'Accomplishment %', key: 'accomplishment_percent' },
    { label: 'Entry Status', key: 'entry_status' },
    { label: 'Last Updated By', key: 'entry_updated_by' },
  ],
};

export default function Reports() {
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const defaultDateRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultDateRange.from);
  const [dateTo, setDateTo] = useState(defaultDateRange.to);
  const [format, setFormat] = useState('CSV');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [municipalityFilter, setMunicipalityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [geoProvinces, setGeoProvinces] = useState<string[]>([]);
  const [geoMunicipalities, setGeoMunicipalities] = useState<Array<{ municipality: string; province: string }>>([]);
  const [geoDistricts, setGeoDistricts] = useState<Array<{ district: string; province: string }>>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const availableFields = reportFieldsByType[selectedType] ?? [];
  const selectedFieldLabels = availableFields
    .filter(field => selectedFields.includes(field.key))
    .map(field => field.label);
  const isSiteImplReport = selectedType === 'site_implementation';

  const chartData = (chart: ReportChart) => chart.labels.map((label, index) => ({
    label,
    value: chart.values[index] ?? 0,
    secondaryValue: chart.secondaryValues?.[index] ?? 0,
  }));

  const toggleField = (key: string) => {
    setSelectedFields(current => {
      if (current.includes(key) && current.length === 1) return current;
      return current.includes(key)
        ? current.filter(item => item !== key)
        : [...current, key];
    });
  };

  const selectAllFields = () => setSelectedFields(availableFields.map(field => field.key));
  const clearExtraFields = () => {
    if (availableFields[0]) setSelectedFields([availableFields[0].key]);
  };

  const handleTypeChange = (type: string) => {
    const range = getDefaultDateRange();
    setSelectedType(type);
    setSelectedProject('');
    setDateFrom(range.from);
    setDateTo(range.to);
    setProvinceFilter('');
    setMunicipalityFilter('');
    setDistrictFilter('');
    setSelectedFields(reportFieldsByType[type]?.map(field => field.key) ?? []);
    setSummary(null);
    setSummaryError('');
  };

  const loadRecentReports = useCallback(() => {
    api.getPaginated<GeneratedReport>('reports.list', { page: 1, per_page: 10 })
      .then((res) => setRecentReports(res.data))
      .catch(() => {});
  }, []);

  const loadSummary = useCallback(() => {
    if (!selectedType || !dateFrom || !dateTo) {
      setSummary(null);
      setSummaryLoading(false);
      setSummaryError('');
      return;
    }

    const params: Record<string, string | number | null> = {
      report_type: selectedType,
      date_from: dateFrom,
      date_to: dateTo,
    };
    if (selectedProject) params.project_id = selectedProject;
    if (isSiteImplReport) {
      if (provinceFilter) params.province = provinceFilter;
      if (municipalityFilter) params.municipality = municipalityFilter;
      if (districtFilter) params.district = districtFilter;
    }

    setSummaryLoading(true);
    setSummaryError('');
    api.get<ReportSummary>('reports.summary', params)
      .then((res) => setSummary(res.data))
      .catch((err: unknown) => setSummaryError(err instanceof Error ? err.message : 'Unable to load executive summary'))
      .finally(() => setSummaryLoading(false));
  }, [selectedType, selectedProject, dateFrom, dateTo, provinceFilter, municipalityFilter, districtFilter, isSiteImplReport]);

  useEffect(() => {
    api.get<ApiProject[]>('projects.list')
      .then((res) => setApiProjects(res.data))
      .catch(() => {});
    loadRecentReports();
  }, [loadRecentReports]);

  useEffect(() => {
    const params: Record<string, string | number | null> = {};
    if (selectedProject) params.project_id = selectedProject;
    api.get<{ provinces: string[]; municipalities: Array<{ municipality: string; province: string }>; districts: Array<{ district: string; province: string }> }>('sites.geo-filters', params)
      .then((res) => {
        setGeoProvinces(res.data.provinces);
        setGeoMunicipalities(res.data.municipalities);
        setGeoDistricts(res.data.districts);
      })
      .catch(() => {});
  }, [selectedProject]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setProvinceFilter('');
    setMunicipalityFilter('');
    setDistrictFilter('');
  };

  const projectIsApplicable = (project: ApiProject) => {
    if (applicableProjects.length === 0 || applicableProjects.includes('all')) return true;
    return applicableProjects.includes(String(project.id)) || applicableProjects.includes(project.code ?? '');
  };

  const allProjects = (apiProjects.length > 0 ? apiProjects : projects.map(p => ({ id: p.id, name: p.name, code: p.id })))
    .filter(projectIsApplicable);

  const filteredMunicipalities = provinceFilter
    ? geoMunicipalities.filter(m => m.province === provinceFilter).map(m => m.municipality)
    : geoMunicipalities.map(m => m.municipality);

  const filteredDistricts = provinceFilter
    ? geoDistricts.filter(d => d.province === provinceFilter).map(d => d.district)
    : geoDistricts.map(d => d.district);

  const handleGenerate = async () => {
    if (!selectedType) return;
    setIsGenerating(true);
    setGenerated(false);
    setGenerateError('');
    try {
      const params: Record<string, unknown> = {
        report_type: selectedType,
        format: format,
        project_id: selectedProject || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        selected_fields: selectedFields.join(','),
        ...(isSiteImplReport ? {
          province: provinceFilter || null,
          municipality: municipalityFilter || null,
          district: districtFilter || null,
        } : {}),
      };

      if (format === 'CSV') {
        const filename = `${selectedType}_${new Date().toISOString().split('T')[0]}.csv`;
        await api.download('reports.generate', filename, params, 'POST');
        setGenerated(true);
        loadRecentReports();
      } else if (format === 'PDF') {
        await api.download('reports.generate', `${selectedType}_${new Date().toISOString().split('T')[0]}.pdf`, params, 'POST');
        setGenerated(true);
        loadRecentReports();
      } else if (format === 'XLSX') {
        // XLSX: get JSON data and convert client-side
        const res = await api.post<{ data: Record<string, unknown>[] }>('reports.generate', params);
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(res.data.data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Report');
          XLSX.writeFile(wb, `${selectedType}_${new Date().toISOString().split('T')[0]}.xlsx`);
        }
        setGenerated(true);
        loadRecentReports();
      }
      setTimeout(() => setGenerated(false), 3000);
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleDownloadReport = async (report: GeneratedReport) => {
    try {
      const filename = `${report.report_type}_${report.id}.${report.format.toLowerCase()}`;
      await api.download('reports.download', filename, { id: report.id });
    } catch {
      // Fallback: show info
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      await api.delete('reports.delete', reportId);
      loadRecentReports();
    } catch {
      // Ignore errors
    }
  };

  const handleExportAllSites = async () => {
    try {
      await api.download('sites.export', 'all_sites_export.csv');
    } catch {
      // Fallback
    }
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  const applicableProjects = selectedType
    ? reportTypes.find(r => r.id === selectedType)?.applicable || []
    : [];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileText className="text-dict-blue" size={26} />
          Reports & Exports
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Generate and download project reports in PDF, Excel, or CSV format</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-dict-blue" />
            Generate New Report
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Report Type</label>
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              >
                <option value="">Select report type...</option>
                {reportTypes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {selectedType && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {reportTypes.find(r => r.id === selectedType)?.desc}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
                >
                  <option value="">All Projects</option>
                  {allProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Format</label>
                <div className="flex gap-2">
                  {['CSV', 'PDF', 'XLSX'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors
                        ${format === f ? 'border-dict-blue bg-blue-50 text-dict-blue' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      {f === 'CSV' ? <FileSpreadsheet size={14} /> : <FileType size={14} />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
                />
              </div>
            </div>

            {isSiteImplReport && (
              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Geographic Filters</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Province</label>
                    <select
                      value={provinceFilter}
                      onChange={(e) => { setProvinceFilter(e.target.value); setMunicipalityFilter(''); setDistrictFilter(''); }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
                    >
                      <option value="">All Provinces</option>
                      {geoProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Municipality</label>
                    <select
                      value={municipalityFilter}
                      onChange={(e) => setMunicipalityFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
                    >
                      <option value="">All Municipalities</option>
                      {[...new Set(filteredMunicipalities)].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Congressional District</label>
                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
                    >
                      <option value="">All Districts</option>
                      {[...new Set(filteredDistricts)].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {availableFields.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Report Fields</label>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {selectedFieldLabels.length} selected for PDF, CSV, and Excel exports
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllFields}
                      className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearExtraFields}
                      disabled={selectedFields.length <= 1}
                      className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Keep First
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {availableFields.map(field => (
                    <label
                      key={field.key}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors
                        ${selectedFields.includes(field.key)
                          ? 'border-dict-blue bg-blue-50 dark:bg-blue-950/30 text-slate-800 dark:text-slate-100'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => toggleField(field.key)}
                        className="h-4 w-4 rounded border-slate-300 text-dict-blue focus:ring-dict-blue"
                      />
                      <span className="truncate">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {applicableProjects.length > 0 && applicableProjects[0] !== 'all' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> This report type is only applicable to: {applicableProjects.join(', ')}
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedType || isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-dict-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download size={16} />
                  {format === 'CSV' ? 'Generate & Download CSV' : `Generate ${format} Report`}
                </>
              )}
            </button>

            {generated && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                <CheckCircle2 size={16} />
                Report generated successfully! {format === 'CSV' && 'Check your downloads.'}
              </div>
            )}

            {generateError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {generateError}
              </div>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-slate-400 dark:text-slate-500" />
            Recent Reports
          </h2>
          <div className="space-y-3">
            {recentReports.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No reports generated yet</p>
            ) : (
              recentReports.map(report => (
                <div key={report.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{report.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{report.generated_by_name} • {formatDate(report.created_at)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      report.format === 'PDF' ? 'bg-red-100 text-red-700' :
                      report.format === 'XLSX' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {report.format}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{report.report_type.replace(/_/g, ' ')}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="flex items-center gap-1 text-xs text-dict-blue hover:text-blue-800"
                      >
                        <Download size={12} /> Download
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handlePrintDashboard}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Printer size={14} /> Print Current Dashboard
              </button>
              <button
                onClick={handleExportAllSites}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FileSpreadsheet size={14} /> Export All Sites to CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {summaryLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Loader2 size={16} className="animate-spin" />
            Loading executive summary...
          </div>
        </div>
      )}

      {summaryError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 text-sm text-red-700 dark:text-red-200">
          {summaryError}
        </div>
      )}

      {summary && (
        <div id="printable-report" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-dict-blue">Executive Summary</p>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.title}</h2>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(dateFrom)} - {formatDate(dateTo)}
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">{summary.narrative}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
            {summary.metrics.map(metric => (
              <div key={metric.label} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{metric.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{metric.subLabel}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
            {summary.charts.length === 0 ? (
              <div className="col-span-1 xl:col-span-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No chart data available for the selected filters.
              </div>
            ) : (
              summary.charts.map((chart, index) => {
                const data = chartData(chart);
                return (
                  <div key={`${chart.title}-${index}`} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">{chart.title}</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      {chart.type === 'line' ? (
                        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} dot={false} />
                        </LineChart>
                      ) : (
                        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                          {chart.secondaryValues && (
                            <Bar dataKey="secondaryValue" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                          )}
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

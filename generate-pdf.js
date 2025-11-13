import fs from 'fs';
import { marked } from 'marked';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the markdown files
const reportsToConvert = [
    {
        input: './Daily_Cluster_Stats_Report_2025-11-12.md',
        output: './Daily_Cluster_Stats_Report_2025-11-12.html',
        pdfOutput: './Daily_Cluster_Stats_Report_2025-11-12.pdf',
        title: 'OpenSearch Daily Cluster Status Report - November 12, 2025'
    },
    {
        input: './OpenSearch_Executive_PDF_Report_2025-11-12.md',
        output: './OpenSearch_Executive_PDF_Report_2025-11-12.html',
        pdfOutput: './OpenSearch_Executive_PDF_Report_2025-11-12.pdf',
        title: 'OpenSearch Executive Summary Report - November 12, 2025'
    }
];

console.log('🚀 Starting PDF generation process...\n');

reportsToConvert.forEach((report, index) => {
    console.log(`📄 Processing Report ${index + 1}: ${path.basename(report.input)}`);
    
    // Check if input file exists
    if (!fs.existsSync(report.input)) {
        console.log(`❌ Input file not found: ${report.input}`);
        return;
    }
    
    // Read the markdown file
    const markdownContent = fs.readFileSync(report.input, 'utf8');

// Convert markdown to HTML
const htmlContent = marked(markdownContent);

// Create a complete HTML document with styling
const styledHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>OpenSearch Cluster Management Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            page-break-before: auto;
        }
        
        h2 {
            color: #34495e;
            border-bottom: 2px solid #e74c3c;
            padding-bottom: 5px;
            margin-top: 30px;
            page-break-after: avoid;
        }
        
        h3 {
            color: #2980b9;
            margin-top: 25px;
            page-break-after: avoid;
        }
        
        h4 {
            color: #8e44ad;
            margin-top: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background-color: #fff;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        code {
            background-color: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 2px 5px;
            font-family: 'Courier New', monospace;
            color: #e74c3c;
        }
        
        pre {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            line-height: 1.4;
            page-break-inside: avoid;
        }
        
        pre code {
            background-color: transparent;
            border: none;
            padding: 0;
            color: #2c3e50;
        }
        
        blockquote {
            border-left: 4px solid #3498db;
            margin: 0;
            padding-left: 20px;
            color: #7f8c8d;
            font-style: italic;
        }
        
        ul, ol {
            padding-left: 25px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        .alert {
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
            border-left: 5px solid;
        }
        
        .alert-danger {
            background-color: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }
        
        .alert-warning {
            background-color: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }
        
        .alert-info {
            background-color: #d1ecf1;
            border-color: #17a2b8;
            color: #0c5460;
        }
        
        .alert-success {
            background-color: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
        
        .metric-box {
            display: inline-block;
            padding: 10px 15px;
            margin: 5px;
            background-color: #e9ecef;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        
        .status-green { color: #28a745; font-weight: bold; }
        .status-yellow { color: #ffc107; font-weight: bold; }
        .status-red { color: #dc3545; font-weight: bold; }
        
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; border: none; color: white;">OpenSearch Cluster Management Report</h1>
        <p style="margin: 5px 0 0 0; font-size: 18px;">Generated on November 5, 2025</p>
    </div>
    
    ${htmlContent}
    
    <div class="footer">
        <p>This report was generated automatically from OpenSearch cluster metrics.</p>
        <p>For questions or concerns, please contact the Platform Operations Team.</p>
    </div>
</body>
</html>
`;

// Write the HTML file
const htmlPath = './OpenSearch_Cluster_Management_Report.html';
fs.writeFileSync(htmlPath, styledHtml);

console.log('✅ HTML report generated successfully!');
console.log('📁 Location: ' + path.resolve(htmlPath));
console.log('');
console.log('📄 To convert to PDF:');
console.log('1. Open the HTML file in your browser');
console.log('2. Press Ctrl+P (or Cmd+P on Mac)');
console.log('3. Select "Save as PDF" as destination');
console.log('4. Choose "More settings" > Layout: Portrait');
console.log('5. Click "Save" to generate the PDF');
console.log('');
console.log('Or use this PowerShell command if you have Chrome installed:');
console.log('"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless --disable-gpu --print-to-pdf="OpenSearch_Report.pdf" "' + path.resolve(htmlPath) + '"');
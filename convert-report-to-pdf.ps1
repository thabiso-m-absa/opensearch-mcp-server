# PowerShell script to convert the OpenSearch report HTML to PDF using Chrome
param(
    [string]$InputHtml = "OpenSearch_Cluster_Report_2025-11-10.html",
    [string]$OutputPdf = "OpenSearch_Cluster_Report_2025-11-10_by_Thabiso_Mofokeng.pdf"
)

$currentDir = Get-Location
$htmlFile = Join-Path $currentDir $InputHtml
$pdfFile = Join-Path $currentDir $OutputPdf
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Write-Host "Converting OpenSearch Cluster Report to PDF..." -ForegroundColor Yellow
Write-Host "Input: $InputHtml" -ForegroundColor White
Write-Host "Output: $OutputPdf" -ForegroundColor White
Write-Host "Created by: Thabiso Mofokeng" -ForegroundColor Cyan
Write-Host ""

try {
    # Check if input HTML file exists
    if (-not (Test-Path $htmlFile)) {
        Write-Host "HTML file not found: $htmlFile" -ForegroundColor Red
        exit 1
    }

    # Check if Chrome exists
    if (Test-Path $chromePath) {
        Write-Host "Chrome found. Starting PDF conversion..." -ForegroundColor Green
        
        # Use Chrome to convert HTML to PDF with optimized settings
        $arguments = @(
            '--headless'
            '--disable-gpu'
            '--no-sandbox'
            '--disable-dev-shm-usage'
            '--print-to-pdf-no-header'
            '--no-margins'
            '--disable-extensions'
            '--disable-plugins'
            '--run-all-compositor-stages-before-draw'
            '--disable-checker-imaging'
            "--print-to-pdf=$pdfFile"
            $htmlFile
        )
        
        Write-Host "Generating PDF with Chrome..." -ForegroundColor Yellow
        Start-Process -FilePath $chromePath -ArgumentList $arguments -Wait -NoNewWindow
        
        # Wait a moment for file system to catch up
        Start-Sleep -Seconds 2
        
        if (Test-Path $pdfFile) {
            Write-Host ""
            Write-Host "PDF created successfully!" -ForegroundColor Green
            Write-Host "Location: $pdfFile" -ForegroundColor Cyan
            
            # Get file info
            $fileInfo = Get-Item $pdfFile
            $fileSize = [math]::Round($fileInfo.Length / 1024, 2)
            $creationTime = $fileInfo.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
            
            Write-Host "File size: $fileSize KB" -ForegroundColor White
            Write-Host "Created: $creationTime" -ForegroundColor White
            Write-Host ""
            
            # Summary information
            Write-Host "Report Summary:" -ForegroundColor Magenta
            Write-Host "   - Comprehensive OpenSearch cluster analysis" -ForegroundColor White
            Write-Host "   - Performance metrics and recommendations" -ForegroundColor White
            Write-Host "   - Storage utilization analysis" -ForegroundColor White
            Write-Host "   - Action plan and KPI dashboard" -ForegroundColor White
            Write-Host "   - Professional formatting for management" -ForegroundColor White
            Write-Host ""
            Write-Host "Report created by: Thabiso Mofokeng" -ForegroundColor Cyan
            Write-Host "Generated on: November 10, 2025" -ForegroundColor White
            
            # Try to open the PDF
            try {
                Write-Host ""
                Write-Host "Opening PDF..." -ForegroundColor Yellow
                Start-Process $pdfFile
            }
            catch {
                Write-Host "Could not automatically open PDF. Please open manually." -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "PDF creation failed. File not found after conversion." -ForegroundColor Red
            Write-Host "Try manual conversion or check Chrome installation." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Chrome not found at: $chromePath" -ForegroundColor Red
        Write-Host "Please install Google Chrome or update the path in this script." -ForegroundColor Yellow
        Write-Host "Alternative: Open the HTML file manually and print to PDF." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error occurred during conversion: $_" -ForegroundColor Red
    Write-Host "Try opening the HTML file manually and printing to PDF." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Conversion process complete!" -ForegroundColor Green
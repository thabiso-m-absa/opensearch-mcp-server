# PowerShell script to convert HTML to PDF using Chrome
$htmlFile = "C:\Users\abtmamr\OneDrive - Absa\My Documents\MCP\opensearch-mcp-server\OpenSearch_Cluster_Management_Report.html"
$pdfFile = "C:\Users\abtmamr\OneDrive - Absa\My Documents\MCP\opensearch-mcp-server\OpenSearch_Cluster_Management_Report.pdf"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Write-Host "Converting HTML to PDF..." -ForegroundColor Yellow

try {
    # Check if Chrome exists
    if (Test-Path $chromePath) {
        Write-Host "Chrome found. Starting conversion..." -ForegroundColor Green
        
        # Use Chrome to convert HTML to PDF
        $arguments = @(
            '--headless'
            '--disable-gpu'
            '--no-sandbox'
            '--print-to-pdf-no-header'
            "--print-to-pdf=$pdfFile"
            $htmlFile
        )
        
        Start-Process -FilePath $chromePath -ArgumentList $arguments -Wait -NoNewWindow
        
        if (Test-Path $pdfFile) {
            Write-Host "PDF created successfully!" -ForegroundColor Green
            Write-Host "Location: $pdfFile" -ForegroundColor Cyan
            
            # Get file size
            $fileSize = (Get-Item $pdfFile).Length
            $fileSizeKB = [math]::Round($fileSize / 1024, 2)
            Write-Host "File size: $fileSizeKB KB" -ForegroundColor White
        }
        else {
            Write-Host "PDF creation failed. Please try manual conversion." -ForegroundColor Red
        }
    }
    else {
        Write-Host "Chrome not found. Please convert manually." -ForegroundColor Red
    }
}
catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Report Summary:" -ForegroundColor Magenta
Write-Host "- Comprehensive OpenSearch cluster analysis" -ForegroundColor White
Write-Host "- Detailed metrics and recommendations" -ForegroundColor White
Write-Host "- Professional formatting for management" -ForegroundColor White
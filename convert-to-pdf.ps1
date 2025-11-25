# PowerShell script to convert HTML to PDF using Chrome
$htmlFile = "C:\Users\abtmamr\OneDrive - Absa\My Documents\MCP\opensearch-mcp-server\OpenSearch_Cluster_Management_Report.html"
$pdfFile = "C:\Users\abtmamr\OneDrive - Absa\My Documents\MCP\opensearch-mcp-server\OpenSearch_Cluster_Management_Report.pdf"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Write-Host "🔄 Converting HTML to PDF..." -ForegroundColor Yellow

try {
    # Check if Chrome exists
    if (Test-Path $chromePath) {
        # Use Chrome to convert HTML to PDF
        $arguments = @(
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            '--print-to-pdf-no-header',
            '--print-to-pdf',
            $htmlFile
        )
        
        Start-Process -FilePath $chromePath -ArgumentList $arguments -Wait -NoNewWindow
        
        # Check if PDF was created in current directory (Chrome default behavior)
        $defaultPdfPath = ".\output.pdf"
        if (Test-Path $defaultPdfPath) {
            Move-Item $defaultPdfPath $pdfFile -Force
            Write-Host "✅ PDF created successfully!" -ForegroundColor Green
            Write-Host "📁 Location: $pdfFile" -ForegroundColor Cyan
        }
        else {
            Write-Host "⚠️  PDF conversion may have failed. Trying alternative method..." -ForegroundColor Yellow
            
            # Alternative approach - specify exact output file
            $arguments = @(
                '--headless',
                '--disable-gpu',
                '--no-sandbox',
                '--print-to-pdf-no-header',
                "--print-to-pdf=$pdfFile",
                $htmlFile
            )
            
            Start-Process -FilePath $chromePath -ArgumentList $arguments -Wait -NoNewWindow
            
            if (Test-Path $pdfFile) {
                Write-Host "✅ PDF created successfully with alternative method!" -ForegroundColor Green
                Write-Host "📁 Location: $pdfFile" -ForegroundColor Cyan
            }
            else {
                Write-Host "❌ PDF creation failed. Please try manual conversion:" -ForegroundColor Red
                Write-Host "1. Open the HTML file in your browser: $htmlFile" -ForegroundColor White
                Write-Host "2. Press Ctrl+P" -ForegroundColor White
                Write-Host "3. Select 'Save as PDF'" -ForegroundColor White
                Write-Host "4. Save as: OpenSearch_Cluster_Management_Report.pdf" -ForegroundColor White
            }
        }
    }
    else {
        Write-Host "❌ Chrome not found. Please install Chrome or convert manually:" -ForegroundColor Red
        Write-Host "📁 HTML file location: $htmlFile" -ForegroundColor Cyan
        Write-Host "Manual conversion steps:" -ForegroundColor White
        Write-Host "1. Open the HTML file in any browser" -ForegroundColor White
        Write-Host "2. Press Ctrl+P" -ForegroundColor White
        Write-Host "3. Select 'Save as PDF'" -ForegroundColor White
        Write-Host "4. Save as: OpenSearch_Cluster_Management_Report.pdf" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Error occurred during conversion: $_" -ForegroundColor Red
    Write-Host "📁 HTML file is available at: $htmlFile" -ForegroundColor Cyan
    Write-Host "Please convert manually using your browser's Print to PDF function." -ForegroundColor White
}

Write-Host "`n📊 Report Summary:" -ForegroundColor Magenta
Write-Host "• Comprehensive OpenSearch cluster analysis" -ForegroundColor White
Write-Host "• 15+ pages of detailed metrics and recommendations" -ForegroundColor White
Write-Host "• Executive summary with key findings" -ForegroundColor White
Write-Host "• Actionable recommendations for optimization" -ForegroundColor White
Write-Host "• Professional formatting suitable for management presentation" -ForegroundColor White